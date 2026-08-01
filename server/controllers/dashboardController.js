const db = require('../config/db');
const habitService = require('../services/habitService');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user;

    // 1. Total Habits
    const totalHabitsResult = await db.query('SELECT COUNT(*) FROM habits WHERE user_id = $1::uuid', [userId]);
    const totalHabits = parseInt(totalHabitsResult.rows[0].count);

    // 2. Total Completions (All time)
    const totalCompletionsResult = await db.query(
      'SELECT COUNT(*) FROM habit_logs l JOIN habits h ON l.habit_id = h.id WHERE h.user_id = $1::uuid AND l.status = true',
      [userId]
    );
    const totalCompletions = parseInt(totalCompletionsResult.rows[0].count);

    // 3. Total Logs
    const totalLogsResult = await db.query(
      'SELECT COUNT(*) FROM habit_logs l JOIN habits h ON l.habit_id = h.id WHERE h.user_id = $1::uuid',
      [userId]
    );
    const totalLogs = parseInt(totalLogsResult.rows[0].count);
    const overallCompletionRate = totalLogs > 0 ? Math.round((totalCompletions / totalLogs) * 100) : 0;

    // 4. Longest Streak (Global)
    const habitsResult = await db.query('SELECT id FROM habits WHERE user_id = $1::uuid', [userId]);
    let globalLongestStreak = 0;

    const habitIds = habitsResult.rows.map(h => h.id);
    if (habitIds.length > 0) {
      const allLogsResult = await db.query(
        'SELECT * FROM habit_logs WHERE habit_id = ANY($1::uuid[]) ORDER BY date DESC',
        [habitIds]
      );

      const logsByHabit = {};
      allLogsResult.rows.forEach(log => {
        if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = [];
        logsByHabit[log.habit_id].push(log);
      });

      for (const habitId of habitIds) {
        const habitLogs = logsByHabit[habitId] || [];
        const { bestStreak } = habitService.calculateStreaks(habitLogs);
        globalLongestStreak = Math.max(globalLongestStreak, bestStreak);
      }
    }


    // 5. Gamification Stats
    const gamificationResult = await db.query(
      'SELECT total_points, level FROM user_stats WHERE user_id = $1::uuid',
      [userId]
    );
    const gamification = gamificationResult.rows[0] || { total_points: 0, level: 1 };

    // 6. Badges
    const badgesResult = await db.query(
      'SELECT b.name, b.description, b.icon FROM badges b JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = $1::uuid',
      [userId]
    );

    res.json({
      success: true,
      data: {
        totalHabits,
        totalCompletions,
        overallCompletionRate,
        globalLongestStreak,
        points: gamification.total_points,
        level: gamification.level,
        badges: badgesResult.rows
      }
    });

  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

