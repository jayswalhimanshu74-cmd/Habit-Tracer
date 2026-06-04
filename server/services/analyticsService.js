const db = require('../config/db');
const { format, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } = require('date-fns');
const { getTodayUTC } = require('../utils/dateUtils');

// server/services/analyticsService.js

exports.getAnalyticsSummary = async (userId) => {

  // Query 1: user stats (unchanged, already a single row)
  const stats = await db.query(
    'SELECT total_points, level FROM user_stats WHERE user_id = $1::uuid',
    [userId]
  );

  // Query 2: all habit logs with date — we compute EVERYTHING from this
  const habitLogs = await db.query(
    `SELECT l.date, l.status, l.habit_id
     FROM habit_logs l
     JOIN habits h ON l.habit_id = h.id
     WHERE h.user_id = $1::uuid`,
    [userId]
  );

  const logs = habitLogs.rows;
  const totalLogs = logs.length;
  const completions = logs.filter(l => l.status === true).length;
  const baseRate = totalLogs > 0 ? (completions / totalLogs) * 100 : 0;
  const consistencyScore = Math.min(
    100,
    Math.round(baseRate + (stats.rows[0]?.level || 1) * 2)
  );

  // --- Productivity trend (last 6 weeks) --- computed in JS, no extra queries
  const trends = [];
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() - i * 7);
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const count = logs.filter(l => {
      if (!l.status) return false;
      const d = new Date(l.date).getTime();
      return d >= weekStart.getTime() && d <= weekEnd.getTime();
    }).length;

    trends.push({
      week: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i}w ago`,
      completions: count
    });
  }

  // --- Weekday performance --- computed in JS from same logs array
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayPerformance = {};
  days.forEach(d => dayPerformance[d] = { total: 0, completed: 0 });

  logs.forEach(log => {
    const dayName = days[new Date(log.date).getUTCDay()];
    dayPerformance[dayName].total++;
    if (log.status) dayPerformance[dayName].completed++;
  });

  const weekdayStats = days.map(day => ({
    day,
    rate: dayPerformance[day].total > 0
      ? Math.round((dayPerformance[day].completed / dayPerformance[day].total) * 100)
      : 0
  }));

  // --- Monthly progress --- computed in JS, no extra query
  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);

  const monthLogs = logs.filter(l => new Date(l.date).getTime() >= monthStart);
  const monthTotal = monthLogs.length;
  const monthCompleted = monthLogs.filter(l => l.status).length;
  const monthlyRate = monthTotal > 0
    ? Math.round((monthCompleted / monthTotal) * 100)
    : 0;

  const sortedByRate = [...weekdayStats].sort((a, b) => a.rate - b.rate);

  return {
    consistencyScore,
    trends,
    weakDays: sortedByRate,
    allDays: weekdayStats,       // original order, not mutated
    monthlyProgress: monthlyRate,
    bestWeek: trends.reduce((prev, curr) =>
      prev.completions >= curr.completions ? prev : curr
    ).week,
    weakestDay: sortedByRate[0]?.day || 'None'
  };
};

/**
 * Calculates risk of losing streak for a user.
 */
exports.calculateStreakRisk = async (userId) => {
  const today = getTodayUTC();

  // Query 1: all habits for this user
  const habits = await db.query(
    'SELECT id, title FROM habits WHERE user_id = $1::uuid',
    [userId]
  );

  if (habits.rows.length === 0) {
    return { riskLevel: 'Low', highRiskCount: 0, atRiskHabits: [] };
  }

  const habitIds = habits.rows.map(h => h.id);

  // Query 2: today's logs for ALL habits at once
  const todayLogs = await db.query(
    `SELECT habit_id, status
     FROM habit_logs
     WHERE habit_id = ANY($1) AND date = $2`,
    [habitIds, today]
  );

  // Query 3: recent logs for ALL habits at once
  const recentLogs = await db.query(
    `SELECT DISTINCT ON (habit_id) habit_id, status, date
     FROM habit_logs
     WHERE habit_id = ANY($1)
     ORDER BY habit_id, date DESC`,
    [habitIds]
  );

  // Build lookup maps in JS — no more per-habit queries
  const todayMap = {};
  todayLogs.rows.forEach(l => { todayMap[l.habit_id] = l.status; });

  const recentMap = {};
  recentLogs.rows.forEach(l => { recentMap[l.habit_id] = true; });

  let highRiskCount = 0;
  const details = [];

  habits.rows.forEach(habit => {
    const completedToday = todayMap[habit.id] === true;
    if (completedToday) return; // not at risk

    const hasRecentHistory = recentMap[habit.id] === true;
    if (hasRecentHistory) {
      highRiskCount++;
      details.push(habit.title);
    }
  });

  const riskLevel = highRiskCount === 0
    ? 'Low'
    : highRiskCount > 2 ? 'High' : 'Medium';

  return { riskLevel, highRiskCount, atRiskHabits: details };
};
/**
 * Classifies user type based on engagement and points.
 */

exports.getUserProfile = async (userId) => {
  const stats = await db.query('SELECT total_points, level FROM user_stats WHERE user_id = $1::uuid', [userId]);
  const habitsCount = await db.query('SELECT COUNT(*) FROM habits WHERE user_id = $1::uuid', [userId]);
  
  const points = stats.rows[0]?.total_points || 0;
  const count = parseInt(habitsCount.rows[0].count);

  let type = 'Beginner';
  if (points > 500 && count >= 3) type = 'Consistent';
  if (points > 2000 && count >= 5) type = 'Advanced';

  return { type, points, habitsCount: count };
};

/**
 * Computes engagement score.
 */
exports.getEngagementScore = async (userId) => {
  const stats = await db.query('SELECT total_points FROM user_stats WHERE user_id = $1::uuid', [userId]);
  const completions = await db.query(
    'SELECT COUNT(*) FROM habit_logs l JOIN habits h ON l.habit_id = h.id WHERE h.user_id = $1::uuid AND l.status = true',
    [userId]
  );
  
  const score = (parseInt(completions.rows[0].count) * 2) + (stats.rows[0]?.total_points || 0);
  
  let label = 'Growing';
  if (score > 100) label = 'Steady';
  if (score > 500) label = 'Power User';

  return { score, label };
};
