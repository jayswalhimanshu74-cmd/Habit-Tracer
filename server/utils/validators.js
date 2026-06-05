/**
 * validators.js
 * Shared validation helpers used by habitController and authController.
 * Fixes Bug 8: updateHabit and createHabit use same validation rules.
 */

const VALID_CATEGORIES = [
  'General',
  'Health',
  'Fitness',
  'Learning',
  'Mindfulness',
  'Productivity',
  'Social',
  'Finance'
];

/**
 * Returns true if time is a valid "HH:MM" or "HH:MM:SS" string.
 */
const isValidTime = (t) =>
  typeof t === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(t);

const VALID_DIFFICULTIES = ['Easy', 'Medium', 'Hard']; // ✅ add

/**
 * Returns true if title is a non-empty string under 100 chars.
 */
const isValidTitle = (t) =>
  typeof t === 'string' && t.trim().length > 0 && t.trim().length <= 100;

/**
 * Returns true if email matches basic email format.
 */
const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports= { VALID_CATEGORIES, VALID_DIFFICULTIES, isValidTime, isValidTitle, isValidEmail };