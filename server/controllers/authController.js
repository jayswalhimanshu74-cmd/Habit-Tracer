const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');


const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateBaseUsername = (name) =>
  name
    .toLowerCase()  
    .replace(/[^a-z0-9]/g, '') // remove anything not alphanumeric
    .slice(0, 20) || 'user';   // fallback if name has no valid chars

/**
* Finds a unique username by appending a random suffix if the base is taken.
* Tries up to 5 times before giving up.
*/

const findUniqueUsername = async (baseName) => {
  // Try the clean base first
  const base = generateBaseUsername(baseName);

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0
      ? base
      : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    // ↑ first attempt: "johnsmith"
    // ↑ subsequent: "johnsmith4821", "johnsmith2047", etc.

    const existing = await db.query(
      'SELECT 1 FROM users WHERE username = $1',
      [candidate]
    );

    if (existing.rows.length === 0) {
      return candidate; // this one is free
    }
  }

  // Last resort: timestamp suffix guarantees uniqueness
  return `${base}${Date.now().toString().slice(-6)}`;
};

async function register(req, res) {
  const { name, email, password } = req.body;

  // --- Input validation ---
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (name.trim().length > 50) {
    return res.status(400).json({ success: false, message: 'Name must be 50 characters or fewer' });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ success: false, message: 'A valid email is required' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    // Check email uniqueness
    const existingEmail = await db.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Generate a guaranteed unique username
    const username = await findUniqueUsername(name.trim());

    const hashedPassword = await bcrypt.hash(password, 10);

    // Wrap insert in try/catch to handle any remaining race condition
    let newUser;
    try {
      newUser = await db.query(
        `INSERT INTO users (name, email, password, username)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, username`,
        [name.trim(), email.toLowerCase().trim(), hashedPassword, username]
      );
    } catch (insertErr) {
      // Catch Postgres unique violation (code 23505) as a last safety net
      if (insertErr.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }
      throw insertErr; // re-throw anything else
    }

    // Create user_stats row immediately on register
    // so the dashboard never finds a missing stats record
    await db.query(
      `INSERT INTO user_stats (user_id, total_points, level)
       VALUES ($1::uuid, 0, 1)
       ON CONFLICT (user_id) DO NOTHING`,
      [newUser.rows[0].id]
    );

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_habit_tracer_2026';
    const token = jwt.sign(
      { id: newUser.rows[0].id },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: newUser.rows[0]
      },
      message: 'Account created successfully'
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during registration'
    });
  }

}
async function login(req, res) {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter all fields' });
    }

    const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key_habit_tracer_2026';
    const token = jwt.sign(
      { id: user.rows[0].id },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.rows[0].id,
          name: user.rows[0].name,
          email: user.rows[0].email,
          username: user.rows[0].username,
        },
      },
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error during login'
    });
  }

}


module.exports = {
  register,
  login
};
