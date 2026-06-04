const exportService = require('../services/exportService');
const db = require('../config/db');

exports.exportCSV = async (req, res) => {
  try {
    const csv = await exportService.generateCSV(req.user);
    res.header('Content-Type', 'text/csv');
    res.attachment(`habit_data_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

// exportController.js · exportPDF
exports.exportPDF = async (req, res) => {
  try {
    const userRes = await db.query(
      'SELECT name FROM users WHERE id = $1::uuid',
      [req.user]
    );

    // Guard: should always exist if auth middleware passed, but be explicit
    if (userRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Guard: new users may not have a stats row yet
    await db.query(
      `INSERT INTO user_stats (user_id, total_points, level)
       VALUES ($1::uuid, 0, 1)
       ON CONFLICT (user_id) DO NOTHING`,
      [req.user]
    );

    const pdfBuffer = await exportService.generatePDF(req.user, userRes.rows[0]);

    res.header('Content-Type', 'application/pdf');
    res.attachment(`habit_report_${new Date().toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'PDF generation failed' });
  }
};
