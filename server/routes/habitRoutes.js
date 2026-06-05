const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.put('/:id', habitController.updateHabit);
router.delete('/:id', habitController.deleteHabit);
router.post('/:id/toggle', habitController.toggleHabit);
router.get('/:id/logs', habitController.getHabitLogs);

module.exports = router;
