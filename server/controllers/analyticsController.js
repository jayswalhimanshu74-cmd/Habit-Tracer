const analyticsService = require('../services/analyticsService');

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user;
    const summary = await analyticsService.getAnalyticsSummary(userId);
    res.json({ success: true, data: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

