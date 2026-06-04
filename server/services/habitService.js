// server/services/habitService.js
const { formatDateUTC } = require('../utils/dateUtils');

exports.calculateStreaks = (logs) => {
  if (!logs || logs.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const completedDates = logs
    .filter(log => log.status === true)
    .map(log => {
      // ← was: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      // which used local time. Now use UTC:
      const d = new Date(log.date);
      return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    })
    .sort((a, b) => b - a);

  if (completedDates.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const uniqueDates = [...new Set(completedDates)];

  const todayUTC = (() => {
    const n = new Date();
    return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  })();
  const yesterdayUTC = todayUTC - 86400000;

  let currentStreak = 0;
  let lastDate = uniqueDates[0];

  if (lastDate === todayUTC || lastDate === yesterdayUTC) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const expectedDate = lastDate - 86400000; // exactly one day back in UTC
      if (uniqueDates[i] === expectedDate) {
        currentStreak++;
        lastDate = uniqueDates[i];
      } else {
        break;
      }
    }
  }

  // Best streak logic unchanged, just using UTC timestamps now
  let bestStreak = 0;
  let tempStreak = 0;
  let nextExpected = null;
  const sortedDates = [...uniqueDates].sort((a, b) => a - b);

  for (let i = 0; i < sortedDates.length; i++) {
    if (nextExpected === null || sortedDates[i] === nextExpected) {
      tempStreak++;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
    }
    nextExpected = sortedDates[i] + 86400000;
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  return { currentStreak, bestStreak };
};