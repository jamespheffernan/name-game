const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Generate a new game
router.post('/generate', gameController.generateGame);

// Score a completed game
router.post('/score', gameController.scoreGame);

// Get student performance data
router.get('/performance', async (req, res) => {
  try {
    const studentPerformanceDb = require('../models/studentPerformanceDb');
    const performanceData = await studentPerformanceDb.getAllPerformanceData();
    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// Reset all performance data
router.delete('/performance', async (req, res) => {
  try {
    const studentPerformanceDb = require('../models/studentPerformanceDb');
    await studentPerformanceDb.resetAllPerformance();
    res.json({ message: 'All performance data has been reset' });
  } catch (error) {
    console.error('Error resetting performance data:', error);
    res.status(500).json({ error: 'Failed to reset performance data' });
  }
});

// Get all tags for game selection
router.get('/tags', gameController.getGameTags);

// Add a wrong answer (for testing purposes)
router.post('/performance/add-wrong-answer', gameController.addWrongAnswer);

module.exports = router;