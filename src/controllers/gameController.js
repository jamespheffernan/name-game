const gameService = require('../services/gameService');
const studentDb = require('../models/studentDb');

/**
 * Generate a new game session
 */
async function generateGame(req, res) {
  try {
    const { mode = 'standard', questionCount = 5 } = req.body;
    
    // Get all students from the database
    const students = await studentDb.getAllStudents();
    
    if (students.length < 5) {
      return res.status(400).json({ 
        error: 'Not enough students available', 
        message: 'Please add at least 5 students with images before starting a game.'
      });
    }
    
    // Filter students who have images (required for the game)
    const studentsWithImages = students.filter(student => student.imagePath);
    
    if (studentsWithImages.length < 5) {
      return res.status(400).json({ 
        error: 'Not enough students with images', 
        message: 'Please add images for at least 5 students before starting a game.'
      });
    }
    
    // Generate questions based on the game mode
    let questions;
    if (mode === 'standard') {
      questions = gameService.generateStandardGameRound(studentsWithImages, questionCount);
    } else if (mode === 'reverse') {
      questions = gameService.generateReverseGameRound(studentsWithImages, questionCount);
    } else {
      return res.status(400).json({ error: 'Invalid game mode' });
    }
    
    // Generate a game session
    const gameSession = {
      id: `game_${Date.now()}`,
      mode,
      questions,
      timestamp: new Date().toISOString()
    };
    
    res.json(gameSession);
  } catch (error) {
    console.error('Error generating game:', error);
    res.status(500).json({ error: 'Failed to generate game' });
  }
}

/**
 * Score a completed game
 */
async function scoreGame(req, res) {
  try {
    const { questions, answers } = req.body;
    
    if (!questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    const scoreResult = gameService.scoreGame(questions, answers);
    
    res.json(scoreResult);
  } catch (error) {
    console.error('Error scoring game:', error);
    res.status(500).json({ error: 'Failed to score game' });
  }
}

module.exports = {
  generateGame,
  scoreGame
};
