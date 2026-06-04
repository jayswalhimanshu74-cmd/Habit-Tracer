const db = require('../config/db');

exports.getUserProfile = async (req, res) => {
  const { username } = req.params;

  try {
    const userResult = await db.query(
      'SELECT id, name, username, created_at FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get habits
    const habitsResult = await db.query(
      'SELECT title, category FROM habits WHERE user_id = $1',
      [user.id]
    );

    // Get streaks and stats
    const statsResult = await db.query(
      'SELECT total_points, level FROM user_stats WHERE user_id = $1',
      [user.id]
    );

    // Get badges
    const badgesResult = await db.query(
      'SELECT b.name, b.description, b.icon FROM badges b JOIN user_badges ub ON b.id = ub.badge_id WHERE ub.user_id = $1',
      [user.id]
    );

    res.json({
      success: true,
      data: {
        name: user.name,
        username: user.username,
        habits: habitsResult.rows,
        stats: statsResult.rows[0] || { total_points: 0, level: 1 },
        badges: badgesResult.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

