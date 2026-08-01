const db = require('../config/db');
const habitService = require('../services/habitService');
const { getTodayUTC, formatDateUTC } = require('../utils/dateUtils');
const { VALID_DIFFICULTIES, VALID_CATEGORIES, isValidTime } = require('../utils/validators');// 


exports.getHabitLogs = async (req, res) => {
  try {
    const logs = await db.query(
      `SELECT hl.*
       FROM habit_logs hl
       JOIN habits h ON hl.habit_id = h.id
       WHERE hl.habit_id = $1::uuid
       AND h.user_id = $2::uuid       -- ownership check inside the JOIN
       ORDER BY hl.date DESC`,
      [req.params.id, req.user]
    );

    // If the habit doesn't belong to this user, 0 rows come back
    // We can't distinguish "habit not found" from "habit not yours"
    // — returning 404 in both cases is intentional (don't leak existence)
    if (logs.rows.length === 0) {
      const habitExists = await db.query(
        'SELECT 1 FROM habits WHERE id = $1::uuid',
        [req.params.id]
      );
      if (habitExists.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Habit not found' });
      }
      // Habit exists but belongs to another user — still return 404
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    res.json({ success: true, data: logs.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createHabit = async (req, res) => {
  const { title, category, reminder_time, difficulty } = req.body;
  
  try {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Title must be 100 characters or fewer' });
    }

    // ← add this
    const resolvedCategory = category || 'General';
    if (!VALID_CATEGORIES.includes(resolvedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
      });
    }

    // ✅ add this block
    const resolvedDifficulty = difficulty || 'Medium';
    if (!VALID_DIFFICULTIES.includes(resolvedDifficulty)) {
      return res.status(400).json({
        success: false,
        message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`
      });
    }
    if (reminder_time !== undefined && reminder_time !== null && !isValidTime(reminder_time)) {
      return res.status(400).json({ success: false, message: 'reminder_time must be in HH:MM format' });
    }

    const newHabit = await db.query(
      'INSERT INTO habits (title, category,difficulty, user_id, reminder_time) VALUES ($1, $2,$3, $4::uuid, $5) RETURNING *',
      [title.trim(), resolvedCategory, resolvedDifficulty, req.user, reminder_time || null]
    );

    res.json({
      success: true,
      data: {
        ...newHabit.rows[0],
        streak: 0, bestStreak: 0,
        completionRate: 0, completedToday: false,
        last30Days: [], insights: []
      },
      message: 'Habit created successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.updateHabit = async (req, res) => {
  const { title, category, reminder_time, difficulty } = req.body;
  const habitId = req.params.id;

  // --- Input validation ---

  // Title: if provided, must be a non-empty string under 100 chars
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot be empty'
      });
    }
    if (title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title must be 100 characters or fewer'
      });
    }
  }

  // Category: if provided, must be one of the allowed values
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`
    });
  }

  // ✅ add this block
  if (difficulty !== undefined && !VALID_DIFFICULTIES.includes(difficulty)) {
    return res.status(400).json({
      success: false,
      message: `Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`
    });
  }

  // reminder_time: if provided, must be a valid HH:MM time string
  if (reminder_time !== undefined && reminder_time !== null) {
    if (!isValidTime(reminder_time)) {
      return res.status(400).json({
        success: false,
        message: 'reminder_time must be in HH:MM format'
      });
    }
  }

  // Nothing to update
  if (title === undefined && category === undefined && reminder_time === undefined && difficulty === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Provide at least one field to update'
    });
  }

  try {
    // First fetch the existing habit so we can merge fields
    const existing = await db.query(
      'SELECT * FROM habits WHERE id = $1::uuid AND user_id = $2::uuid',
      [habitId, req.user]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const current = existing.rows[0];

    // Merge: only replace fields that were explicitly sent
    const updatedTitle = title !== undefined ? title.trim() : current.title;
    const updatedCategory = category !== undefined ? category : current.category;
    const updatedDifficulty = difficulty !== undefined ? difficulty : current.difficulty;
    const updatedReminder = reminder_time !== undefined ? reminder_time : current.reminder_time;
    // ↑ if reminder_time was not sent at all, keep the existing value
    // ↑ if reminder_time was explicitly sent as null, that means user cleared it

    const result = await db.query(
      `UPDATE habits
       SET title = $1, category = $2, difficulty=$3 ,reminder_time = $4
       WHERE id = $5::uuid AND user_id = $6::uuid
       RETURNING *`,
      [updatedTitle, updatedCategory, updatedDifficulty, updatedReminder, habitId, req.user]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Habit updated'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteHabit = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    res.json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const checkGamification = async (userId, habitId, io) => {
  const client = await db.pool.connect(); // ✅ grab a dedicated client for the transaction
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE user_stats SET total_points = total_points + 10 WHERE user_id = $1::uuid',
      [userId]
    );

    const logsResult = await client.query(
      'SELECT * FROM habit_logs WHERE habit_id = $1::uuid ORDER BY date DESC',
      [habitId]
    );
    const { currentStreak } = habitService.calculateStreaks(logsResult.rows);

    const MILESTONES = [
      { streak: 7, points: 50, message: '7-Day Streak! +50 Bonus Points 🔥' },
      { streak: 30, points: 200, message: '30-Day Streak! +200 Bonus Points 👑' },
    ];

    let milestoneMessage = null;

    for (const { streak, points, message } of MILESTONES) {
      if (currentStreak === streak) {
        const result = await client.query(
          `INSERT INTO streak_milestones (user_id, milestone)
           VALUES ($1::uuid, $2)
           ON CONFLICT (user_id, milestone) DO NOTHING`,
          [userId, streak]
        );
        if (result.rowCount === 1) {
          await client.query(
            'UPDATE user_stats SET total_points = total_points + $1 WHERE user_id = $2::uuid',
            [points, userId]
          );
          milestoneMessage = message;
        }
      }
    }

    await client.query(
      'UPDATE user_stats SET level = FLOOR(total_points / 100) + 1 WHERE user_id = $1::uuid',
      [userId]
    );

    await client.query('COMMIT'); // ✅ all or nothing

    // Emit AFTER commit so the client only hears about it if it actually saved
    if (milestoneMessage) {
      io?.to?.(userId)?.emit?.('achievement', { message: milestoneMessage });
    }
    io?.to?.(userId)?.emit?.('statsUpdated');


  } catch (err) {
    await client.query('ROLLBACK'); // ✅ undo everything on failure
    console.error('Gamification error:', err);
  } finally {
    client.release(); // ✅ always return the connection to the pool
  }
};

exports.toggleHabit = async (req, res) => {
  const today = getTodayUTC();

  try {
    const habit = await db.query(
      'SELECT * FROM habits WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user]
    );
    if (habit.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Habit not found' });

    const log = await db.query(
      'SELECT * FROM habit_logs WHERE habit_id = $1 AND date = $2',
      [req.params.id, today]
    );

    let resultLog;
    let isNowCompleted; // ← track the direction of the toggle

    if (log.rows.length > 0) {
      isNowCompleted = !log.rows[0].status;
      const updatedLog = await db.query(
        'UPDATE habit_logs SET status = $1 WHERE id = $2 RETURNING *',
        [isNowCompleted, log.rows[0].id]
      );
      resultLog = updatedLog.rows[0];
    } else {
      isNowCompleted = true;
      const newLog = await db.query(
        'INSERT INTO habit_logs (habit_id, date, status) VALUES ($1, $2, true) RETURNING *',
        [req.params.id, today]
      );
      resultLog = newLog.rows[0];
    }

    // Only run gamification when the habit is being marked COMPLETE
    if (isNowCompleted) {
      await checkGamification(req.user, req.params.id, req.io);
    } else {
      // Still notify the client to refresh stats display,
      // but don't award any points
      req.io?.to?.(req.user)?.emit?.('statsUpdated');

    }

    res.json({ success: true, data: resultLog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getHabits = async (req, res) => {
  try {
    const today = getTodayUTC();
    const result = await db.query(
      `SELECT 
         h.*,
         COALESCE(hl.status, false) AS "completedToday"
       FROM habits h
       LEFT JOIN habit_logs hl 
         ON h.id = hl.habit_id 
         AND hl.date = $2
       WHERE h.user_id = $1::uuid
       ORDER BY h.created_at DESC`,
      [req.user, today]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getHabits error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};


