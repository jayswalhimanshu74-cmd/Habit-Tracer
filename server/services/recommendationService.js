const db = require('../config/db');

/**
 * Analyzes habit behavior and suggests new habits or changes.
 */
exports.getSuggestions = async (userId) => {
  const habits = await db.query('SELECT category, title FROM habits WHERE user_id = $1::uuid', [userId]);
  const categories = habits.rows.map(h => h.category);

  const suggestions = [];

  // Rule 1: Diverse Categories
  if (!categories.includes('Health')) {
    suggestions.push({
      title: 'Morning Water',
      description: 'Start your day hydrated. Easy to build, high impact.',
      category: 'Health',
      reason: 'You don\'t have any health habits yet!'
    });
  }

  if (!categories.includes('Productivity')) {
    suggestions.push({
      title: 'Plan Tomorrow',
      description: 'Spend 5 minutes tonight planning your next day.',
      category: 'Productivity',
      reason: 'Boost your daily organization.'
    });
  }

  // Rule 2: Based on count
  if (habits.rows.length < 3) {
    suggestions.push({
      title: 'Read 5 Pages',
      description: 'Small reading goals lead to great knowledge.',
      category: 'General',
      reason: 'Perfect starter habit for your journey.'
    });
  }

  // Rule 3: Morning Person Check (Simulated)
  const healthHabits = habits.rows.filter(h => h.category === 'Health');
  if (healthHabits.length >= 2) {
    suggestions.push({
      title: '30m Morning Walk',
      description: 'You are doing great with health! Level up with a walk.',
      category: 'Health',
      reason: 'Matching your high health consistency.'
    });
  }

  return suggestions;
};
