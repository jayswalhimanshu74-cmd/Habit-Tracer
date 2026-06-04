const analyticsService = require('../services/analyticsService');
const recommendationService = require('../services/recommendationService');

exports.getSmartInsights = async (req, res) => {
  try {
    const userId = req.user;

    const [suggestions, risk, profile, engagement] = await Promise.all([
      recommendationService.getSuggestions(userId),
      analyticsService.calculateStreakRisk(userId),
      analyticsService.getUserProfile(userId),
      analyticsService.getEngagementScore(userId)
    ]);

    res.json({
      success: true,
      data: {
        suggestions,
        risk,
        profile,
        engagement
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

