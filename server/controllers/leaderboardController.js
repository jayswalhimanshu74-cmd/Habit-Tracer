const db = require('../config/db');

exports.getLeaderboard = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.username, u.name, us.total_points, us.level 
      FROM user_stats us 
      JOIN users u ON us.user_id = u.id 
      ORDER BY us.total_points DESC 
      LIMIT 10
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

