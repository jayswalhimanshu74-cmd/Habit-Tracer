const db = require('../config/db');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const habitService = require('./habitService');
const { formatDateUTC } = require('../utils/dateUtils');

// exportService.js · generateCSV
// ↑ reuse the UTC date utility from Bug 3

exports.generateCSV = async (userId) => {
  const data = await db.query(
    `SELECT
       h.title,
       h.category,
       h.reminder_time,
       l.date,
       l.status
     FROM habits h
     LEFT JOIN habit_logs l ON h.id = l.habit_id
     WHERE h.user_id = $1::uuid
     ORDER BY h.title ASC, l.date DESC NULLS LAST`,
    // ↑ ORDER BY habit title first so each habit's logs are grouped together
    // ↑ NULLS LAST pushes habits with no logs to the bottom, not the top
    [userId]
  );

  if (data.rows.length === 0) {
    // Return a valid CSV with just headers instead of crashing
    return 'title,category,date,status,notes\n';
  }

  // Transform rows — give NULL log entries a meaningful representation
  const rows = data.rows.map(row => ({
    title: row.title,
    category: row.category,
    date: row.date ? formatDateUTC(row.date) : 'No logs yet',
    // ↑ NULL date becomes readable text instead of empty cell
    status: row.date === null
      ? 'Never logged'          // habit exists but has no logs
      : row.status === true
        ? 'Completed'           // logged and completed
        : 'Skipped',            // logged but not completed
    // ↑ boolean true/false → human readable strings
    reminder: row.reminder_time || 'None',
  }));

  const fields = [
    { label: 'Habit', value: 'title' },
    { label: 'Category', value: 'category' },
    { label: 'Date', value: 'date' },
    { label: 'Status', value: 'status' },
    { label: 'Reminder', value: 'reminder' },
  ];
  // ↑ named labels so the CSV header row reads "Habit" not "title"

  try {
    const { Parser } = require('json2csv');
    const parser = new Parser({ fields });
    return parser.parse(rows);
  } catch (err) {
    console.error('CSV generation error:', err);
    throw new Error('Failed to generate CSV');
  }
};

// exportService.js · generatePDF
exports.generatePDF = async (userId, user) => {
  const habitsRaw = await db.query(
    'SELECT * FROM habits WHERE user_id = $1::uuid',
    [userId]
  );
  const stats = await db.query(
    'SELECT * FROM user_stats WHERE user_id = $1::uuid',
    [userId]
  );

  // ← was: loop with one query per habit
  // Fix: fetch all logs at once
  const habitIds = habitsRaw.rows.map(h => h.id);
  let logsByHabit = {};

  if (habitIds.length > 0) {
    const allLogs = await db.query(
      'SELECT * FROM habit_logs WHERE habit_id = ANY($1) ORDER BY date DESC',
      [habitIds]
    );
    allLogs.rows.forEach(log => {
      if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = [];
      logsByHabit[log.habit_id].push(log);
    });
  }

  const habitsWithData = habitsRaw.rows.map(habit => {
    const logs = logsByHabit[habit.id] || [];
    const { currentStreak, bestStreak } = habitService.calculateStreaks(logs);
    return { ...habit, currentStreak, bestStreak };
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header Design
    doc.rect(0, 0, doc.page.width, 160).fill('#f8fafc');
    doc.fillColor('#0ea5e9').fontSize(28).font('Helvetica-Bold').text('HabitFlow Performance Report', 50, 60);
    doc.fillColor('#64748b').fontSize(12).font('Helvetica').text(`Prepared for: ${user.name}`, 50, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 50, 118);

    doc.moveDown(4);

    // Summary Cards
    const startY = 180;
    const cardWidth = 150;
    const cardHeight = 70;
    const colors = ['#0ea5e9', '#10b981', '#f59e0b'];
    const labels = ['Total Habits', 'Total Points', 'Current Level'];
    const values = [habitsRaw.rowCount, stats.rows[0]?.total_points || 0, stats.rows[0]?.level || 1];

    labels.forEach((label, i) => {
      const x = 50 + (i * (cardWidth + 20));
      doc.rect(x, startY, cardWidth, cardHeight).fill('#ffffff').stroke('#e2e8f0');
      doc.fillColor(colors[i]).fontSize(20).font('Helvetica-Bold').text(values[i], x + 15, startY + 15);
      doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text(label, x + 15, startY + 45);
    });

    doc.moveDown(8);

    // Table Header
    const tableTop = 300;
    const colWidths = [180, 100, 100, 100];
    const headers = ['Habit Title', 'Category', 'Current Streak', 'Best Streak'];

    // Draw Header Background
    doc.rect(50, tableTop, 480, 30).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');

    headers.forEach((header, i) => {
      const x = 50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(header, x + 10, tableTop + 10);
    });

    // Table Rows
    let currentY = tableTop + 30;
    doc.font('Helvetica').fontSize(9);

    habitsWithData.forEach((habit, index) => {
      // Row Background (zebra striping)
      if (index % 2 === 1) {
        doc.rect(50, currentY, 480, 25).fill('#f1f5f9');
      }

      doc.fillColor('#334155');

      // Title
      doc.text(habit.title, 60, currentY + 8, { width: 160, ellipsis: true });
      // Category
      doc.text(habit.category, 50 + colWidths[0] + 10, currentY + 8);
      // Streak
      doc.text(`${habit.currentStreak} Days`, 50 + colWidths[0] + colWidths[1] + 10, currentY + 8);
      // Best Streak
      doc.text(`${habit.bestStreak} Days`, 50 + colWidths[0] + colWidths[1] + colWidths[2] + 10, currentY + 8);

      currentY += 25;

      // New Page if needed
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Footer
    const footerY = doc.page.height - 70;
    doc.rect(0, footerY, doc.page.width, 70).fill('#f8fafc');
    doc.fillColor('#94a3b8').fontSize(10).text('HabitFlow - Your journey to excellence.', 0, footerY + 25, { align: 'center' });
    doc.fontSize(8).text('Keep moving forward. One habit at a time.', { align: 'center' });

    doc.end();
  });
};
