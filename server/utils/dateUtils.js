
/**
 * dateUtils.js
 * Central UTC date utility — used by all controllers and services.
 * Fixes Bug 3: timezone mismatch between server local time and Postgres DATE columns.
 */

/**
 * Returns today's date as a UTC string: "YYYY-MM-DD"
 * Always matches what Postgres stores in a DATE column.
 */
const getTodayUTC = () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formats any date value (Date object, ISO string, or Postgres DATE)
 * as a UTC "YYYY-MM-DD" string.
 */
const formatDateUTC = (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Returns a UTC timestamp (ms) for the start of a given date.
 * Used for streak day arithmetic.
 */
const toUTCDay = (date) => {
    const d = new Date(date);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
};

/**
 * Returns UTC timestamp for today at midnight.
 */
const getTodayUTCMs = () => {
    const n = new Date();
    return Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
};

module.exports = { getTodayUTC, formatDateUTC, toUTCDay, getTodayUTCMs };