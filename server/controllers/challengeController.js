const db = require('../config/db');

exports.getTodayChallenge = async (req, res) => {
  try {
    const allChallenges = await db.query('SELECT * FROM challenges');
    if (allChallenges.rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const challenge = allChallenges.rows[dayOfYear % allChallenges.rows.length];

    if (!challenge){
       return res.json({ success: true, data: null });
    }

    const completed = await db.query(
      'SELECT * FROM user_challenges WHERE user_id = $1::uuid AND challenge_id = $2 AND DATE(completed_at) = CURRENT_DATE',
      [req.user, challenge.id]
    );
    
    res.json({
      success: true,
      data: {
        ...challenge,
        completed: completed.rows.length > 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// challengeController.js · completeChallenge
exports.completeChallenge = async (req, res) => {
  const { challengeId } = req.body;

  // Step 1: input validation — must be present and a string
  if (!challengeId || typeof challengeId !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'challengeId is required'
    });
  }

  try {
    // Step 2: verify the challenge actually exists and get points in one shot
    const challenge = await db.query(
      'SELECT id, points_reward FROM challenges WHERE id = $1',
      [challengeId]
    );

    if (challenge.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const points = challenge.rows[0].points_reward;

    // Step 3: duplicate completion guard (now after existence is confirmed)
    const existing = await db.query(
      `SELECT 1 FROM user_challenges
       WHERE user_id = $1::uuid
       AND challenge_id = $2
       AND DATE(completed_at) = CURRENT_DATE`,
      [req.user, challengeId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Challenge already completed today'
      });
    }

    // Step 4: safe to insert now — challenge exists, not a duplicate
    await db.query(
      'INSERT INTO user_challenges (user_id, challenge_id) VALUES ($1::uuid, $2)',
      [req.user, challengeId]
    );

    // Step 5: award points
    await db.query(
      'UPDATE user_stats SET total_points = total_points + $1 WHERE user_id = $2::uuid',
      [points, req.user]
    );

    req.io.to(req.user).emit('achievement', {
      message: `Challenge Complete! +${points} Points 🏆`
    });
    req.io.to(req.user).emit('statsUpdated');

    res.json({
      success: true,
      message: 'Challenge completed!',
      data: { pointsEarned: points }
    });

  } catch (err) {
    console.error('completeChallenge error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
