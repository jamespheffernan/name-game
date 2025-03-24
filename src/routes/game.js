const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Generate a new game session
router.post('/generate', gameController.generateGame);

// Score a completed game
router.post('/score', gameController.scoreGame);

module.exports = router;
