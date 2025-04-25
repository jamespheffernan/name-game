const gameService = require('../services/gameService');
const studentDb = require('../models/studentDb');
const studentPerformanceDb = require('../models/studentPerformanceDb');

/**
 * Generate a new game session
 */
async function generateGame(req, res) {
  try {
    // Log the full request body for debugging
    console.log('Game generation request body:', req.body);
    
    const { 
      mode = 'shortAnswer', 
      questionCount = 5, 
      focusDifficult = false,
      onlyUntried = false,
      tagName = null,
      excludeTag: excludeTagParam = false,
      advancedFilters = {},
      useSimilarWrongAnswers = true // New option for similar wrong answers
    } = req.body;
    
    // Force convert to boolean to handle string values like "true" or "false"
    const excludeTag = excludeTagParam === true || excludeTagParam === "true" || excludeTagParam === 1;
    
    // Get advanced filters
    const nationalityFilter = advancedFilters.nationality || '';
    const languageFilter = advancedFilters.language || '';
    const genderFilter = advancedFilters.gender || '';
    
    // Check if we have any advanced filters
    const hasAdvancedFilters = nationalityFilter || languageFilter || genderFilter;
    
    // Force convert useSimilarWrongAnswers to boolean
    const useSimilarityBasedSelection = useSimilarWrongAnswers === true || 
                                        useSimilarWrongAnswers === "true" || 
                                        useSimilarWrongAnswers === 1;
                                        
    // Log the parsed options
    console.log('Game options after parsing:', {
      mode,
      questionCount,
      focusDifficult,
      onlyUntried,
      tagName,
      excludeTag: !!excludeTag, // Convert to boolean and log
      useSimilarWrongAnswers: useSimilarityBasedSelection,
      advancedFilters: {
        nationality: nationalityFilter,
        language: languageFilter,
        gender: genderFilter
      }
    });
    
    // Get all students from the database
    let students = await studentDb.getAllStudents();
    
    // Apply tag filter if a tag was specified
    if (tagName) {
      console.log(`Processing tag filter: tag=${tagName}, exclude=${excludeTag}`);
      
      if (excludeTag) {
        console.log(`Excluding students with tag: ${tagName}`);
        
        // Get students with the tag first
        const studentsWithTag = await studentDb.getStudentsByTag(tagName);
        console.log(`Found ${studentsWithTag.length} students with tag ${tagName} to exclude`);
        
        // Then exclude them from all students
        const studentIdsWithTag = studentsWithTag.map(s => s.id);
        const filteredStudents = students.filter(s => !studentIdsWithTag.includes(s.id));
        console.log(`After exclusion: ${filteredStudents.length} students remain (from ${students.length} total)`);
        
        students = filteredStudents;
        
        if (students.length < 5) {
          return res.status(400).json({ 
            error: 'Not enough students without selected tag', 
            message: `Excluding students with tag "${tagName}" leaves fewer than 5 students. Please add more students or choose a different tag.`
          });
        }
      } else {
        console.log(`Including only students with tag: ${tagName}`);
        // Include only students with the tag
        students = await studentDb.getStudentsByTag(tagName);
        console.log(`Found ${students.length} students with tag ${tagName} to include`);
        
        if (students.length < 5) {
          return res.status(400).json({ 
            error: 'Not enough students with selected tag', 
            message: `Please add at least 5 students to the tag "${tagName}" before using it in a game.`
          });
        }
      }
    }
    
    // Apply advanced filters if any are specified
    if (hasAdvancedFilters) {
      console.log('Applying advanced filters');
      
      // Filter students by nationality, language, and gender
      students = students.filter(student => {
        // Skip students without tags
        if (!student.tags || !Array.isArray(student.tags)) {
          return false;
        }
        
        // Apply nationality filter if provided
        if (nationalityFilter && !student.tags.includes(nationalityFilter)) {
          return false;
        }
        
        // Apply language filter if provided
        if (languageFilter && !student.tags.includes(languageFilter)) {
          return false;
        }
        
        // Apply gender filter if provided
        if (genderFilter && !student.tags.includes(genderFilter)) {
          return false;
        }
        
        return true;
      });
      
      console.log(`After applying advanced filters, found ${students.length} matching students`);
      
      if (students.length < 5) {
        return res.status(400).json({ 
          error: 'Not enough students with selected filters', 
          message: `Please select different filter criteria. The current combination doesn't have enough students.`
        });
      }
    }
    
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
        message: tagName 
          ? `Please add images for at least 5 students in the tag "${tagName}" before starting a game.`
          : 'Please add images for at least 5 students before starting a game.'
      });
    }
    
    // Get performance data
    const performanceData = await studentPerformanceDb.getAllPerformanceData();
    
    // Add performance data to all student objects
    let studentsToUse = studentsWithImages.map(student => {
      const performance = performanceData[student.id] || {
        successRate: 100, // Default to 100% if no data (will be lowest priority)
        attemptCount: 0,
        correctCount: 0,
        incorrectCount: 0
      };
      
      return {
        ...student,
        performance
      };
    });
    
    // Create categorized lists based on performance
    const attemptedStudents = studentsToUse.filter(student => 
      student.performance.attemptCount > 0);
    
    const difficultStudents = studentsToUse.filter(student => 
      student.performance.attemptCount > 0 && student.performance.incorrectCount > 0);
    
    const masteredStudents = studentsToUse.filter(student => 
      student.performance.attemptCount > 0 && student.performance.incorrectCount === 0);
      
    const untriedStudents = studentsToUse.filter(student => 
      student.performance.attemptCount === 0);
    
    // Option 1: Prioritize less practiced students
    if (onlyUntried) {
      // Sort students by attempt count (ascending)
      studentsToUse.sort((a, b) => a.performance.attemptCount - b.performance.attemptCount);
      
      // Take the top X students based on question count (with a minimum of 5)
      const numStudentsToUse = Math.max(5, questionCount * 2);
      
      // Make sure we have enough students for the number of questions
      if (studentsToUse.length < numStudentsToUse) {
        // If we don't have enough students, use all available
        studentsToUse = studentsToUse.slice(0, Math.min(studentsToUse.length, numStudentsToUse));
      } else {
        // If we have enough, take the least practiced ones
        studentsToUse = studentsToUse.slice(0, numStudentsToUse);
      }
      
      // Shuffle the selected students to randomize the order
      studentsToUse = studentsToUse.sort(() => Math.random() - 0.5);
    }
    // Option 2: Focus on difficult students
    else if (focusDifficult) {
      // Prioritize difficult students first, then untried, then mastered
      if (difficultStudents.length >= 5) {
        // If we have enough difficult students, use primarily them
        studentsToUse = gameService.prioritizeDifficultStudents(difficultStudents);
        
        // Add some untried students at the end for variety (if any exist)
        if (untriedStudents.length > 0) {
          // Shuffle untried students and take up to 20% of question count
          const shuffledUntried = [...untriedStudents].sort(() => Math.random() - 0.5);
          const untriedToInclude = shuffledUntried.slice(0, Math.max(2, Math.floor(questionCount * 0.2)));
          studentsToUse = [...studentsToUse, ...untriedToInclude];
        }
      } else if (difficultStudents.length > 0) {
        // If we have some difficult students but not enough, combine with unattempted
        const remainingNeeded = 5 - difficultStudents.length;
        let combined = [...difficultStudents];
        
        // Add untried students if any exist
        if (untriedStudents.length > 0) {
          const shuffledUntried = [...untriedStudents].sort(() => Math.random() - 0.5);
          combined = [...combined, ...shuffledUntried.slice(0, Math.min(untriedStudents.length, remainingNeeded))];
        }
        
        // If still not enough, add some mastered students
        if (combined.length < 5 && masteredStudents.length > 0) {
          const stillNeeded = 5 - combined.length;
          const shuffledMastered = [...masteredStudents].sort(() => Math.random() - 0.5);
          combined = [...combined, ...shuffledMastered.slice(0, Math.min(masteredStudents.length, stillNeeded))];
        }
        
        // Prioritize this combined set
        studentsToUse = gameService.prioritizeDifficultStudents(combined);
      } else {
        // No difficult students yet, use regular mode
        // We'll keep the default shuffled studentsToUse
      }
    }
    
    // Generate questions based on the game mode
    let questions;
    
    // Custom function to pass similarity option to game service functions
    const generateWithSimilarityOption = (generatorFn, ...args) => {
      // Modify each generator function to accept the similarity option
      // First look for standard functions that can work with our new parameter
      if (typeof generatorFn.withOptions === 'function') {
        return generatorFn.withOptions({useSimilarWrongAnswers: useSimilarityBasedSelection}, ...args);
      }
      
      // For unmodified functions, we'll use monkey patching to inject our options
      const origGenerateHardGameRound = gameService.generateHardGameRound;
      const origGenerateStandardGameRound = gameService.generateStandardGameRound;
      const origGenerateReverseGameRound = gameService.generateReverseGameRound;
      
      if (generatorFn === gameService.generateHardGameRound) {
        // Temporarily override the function to include our option
        gameService.generateHardGameRound = function(students, count, options) {
          return origGenerateHardGameRound.call(this, students, count, options, useSimilarityBasedSelection);
        };
        const result = generatorFn(...args);
        gameService.generateHardGameRound = origGenerateHardGameRound;
        return result;
      }
      
      if (generatorFn === gameService.generateStandardGameRound) {
        // Same for standard mode
        gameService.generateStandardGameRound = function(students, count) {
          const result = origGenerateStandardGameRound.call(this, students, count, useSimilarityBasedSelection);
          gameService.generateStandardGameRound = origGenerateStandardGameRound;
          return result;
        };
        return generatorFn(...args);
      }
      
      if (generatorFn === gameService.generateReverseGameRound) {
        // Same for reverse mode
        gameService.generateReverseGameRound = function(students, count) {
          const result = origGenerateReverseGameRound.call(this, students, count, useSimilarityBasedSelection);
          gameService.generateReverseGameRound = origGenerateReverseGameRound;
          return result;
        };
        return generatorFn(...args);
      }
      
      // For other function types (like shortAnswer), just call normally
      return generatorFn(...args);
    };
    
    if (mode === 'standard') {
      questions = generateWithSimilarityOption(gameService.generateStandardGameRound, studentsToUse, questionCount);
    } else if (mode === 'reverse') {
      questions = generateWithSimilarityOption(gameService.generateReverseGameRound, studentsToUse, questionCount);
    } else if (mode === 'hard') {
      // For hard mode with tags, we might need to get additional students for options
      let hardModeOptions = studentsWithImages;
      
      // If tag is used and not enough students, get additional students from outside the tag
      if (tagName && studentsWithImages.length < 31) {
        const allStudents = await studentDb.getAllStudents();
        const remainingStudents = allStudents
          .filter(s => s.imagePath && !studentsWithImages.some(tagged => tagged.id === s.id));
        
        // Add additional students until we have enough or run out
        hardModeOptions = [...studentsWithImages, ...remainingStudents];
      }
      
      // Check if we have enough students for hard mode
      if (hardModeOptions.length < 31) {
        return res.status(400).json({ 
          error: 'Not enough students for hard mode', 
          message: 'Hard mode requires at least 31 students with images.'
        });
      }
      
      // Use the tag-filtered students as core, but allow options from all students
      questions = generateWithSimilarityOption(gameService.generateHardGameRound, studentsToUse, questionCount, hardModeOptions);
    } else if (mode === 'shortAnswer') {
      questions = gameService.generateShortAnswerGameRound(studentsToUse, questionCount);
    } else if (mode === 'connectionTrivia') {
      // For connection trivia, we need students with education/experience data
      // Check if we have enough students
      if (studentsWithImages.length < 8) {
        return res.status(400).json({ 
          error: 'Not enough students for connection trivia mode', 
          message: 'Connection trivia mode requires at least 8 students with images and biographical data.'
        });
      }
      
      try {
        questions = gameService.generateConnectionTriviaRound(studentsWithImages, questionCount);
        
        // Check if we generated enough questions
        if (questions.length < 1) {
          return res.status(400).json({ 
            error: 'Could not generate connection trivia questions', 
            message: 'Not enough connections found between students. Try a different mode or add more biographical data.'
          });
        }
      } catch (error) {
        console.error('Error generating connection trivia:', error);
        return res.status(500).json({ 
          error: 'Failed to generate connection trivia', 
          message: error.message
        });
      }
    } else if (mode === 'educationTrivia') {
      // For education trivia, we need students with structured education data
      // Filter to students with education data
      const studentsWithEducation = studentsWithImages.filter(s => 
        s.educationParsed && Array.isArray(s.educationParsed) && s.educationParsed.length > 0);
      
      // Check if we have enough students with education data
      if (studentsWithEducation.length < 8) {
        return res.status(400).json({ 
          error: 'Not enough students for education trivia mode', 
          message: 'Education trivia mode requires at least 8 students with structured education data.'
        });
      }
      
      try {
        questions = gameService.generateEducationTriviaRound(studentsWithEducation, questionCount);
        
        // Check if we generated enough questions
        if (questions.length < 1) {
          return res.status(400).json({ 
            error: 'Could not generate education trivia questions', 
            message: 'Not enough educational connections found between students. Try a different mode or add more education data.'
          });
        }
      } catch (error) {
        console.error('Error generating education trivia:', error);
        return res.status(500).json({ 
          error: 'Failed to generate education trivia', 
          message: error.message
        });
      }
    } else {
      console.error(`Invalid game mode: ${mode}. Valid modes are: standard, reverse, hard, shortAnswer, connectionTrivia, educationTrivia`);
      return res.status(400).json({ 
        error: 'Invalid game mode',
        message: `The game mode "${mode}" is not supported. Valid modes are: standard, reverse, hard, shortAnswer, connectionTrivia, educationTrivia`
      });
    }
    
    // Generate a game session
    const gameSession = {
      id: `game_${Date.now()}`,
      mode,
      questions,
      focusDifficult,
      tagName,
      excludeTag, // This is now the properly converted boolean
      useSimilarWrongAnswers: useSimilarityBasedSelection, // Include the new option
      timestamp: new Date().toISOString()
    };
    
    res.json(gameSession);
  } catch (error) {
    console.error('Error generating game:', error);
    res.status(500).json({ error: 'Failed to generate game' });
  }
}

/**
 * Get all tags for game selection
 */
async function getGameTags(req, res) {
  try {
    const tags = await studentDb.getAllTags();
    
    // For each tag, count the number of students with images
    const tagsWithCounts = {};
    for (const [tagName, studentIds] of Object.entries(tags)) {
      const students = await studentDb.getStudentsByTag(tagName);
      const studentsWithImages = students.filter(student => student.imagePath);
      
      tagsWithCounts[tagName] = {
        count: studentIds.length,
        imageCount: studentsWithImages.length,
        canPlay: studentsWithImages.length >= 5
      };
    }
    
    res.json(tagsWithCounts);
  } catch (error) {
    console.error('Error fetching game tags:', error);
    res.status(500).json({ error: 'Failed to fetch game tags' });
  }
}

/**
 * Score a completed game
 */
async function scoreGame(req, res) {
  try {
    console.log('======= SCORE GAME CALLED =======');
    console.log('Request body keys:', Object.keys(req.body));
    
    const { questions, answers } = req.body;
    
    console.log('Questions count:', questions ? questions.length : 'none');
    console.log('Answers count:', answers ? answers.length : 'none');
    
    if (!questions || !answers || !Array.isArray(questions) || !Array.isArray(answers)) {
      console.error('Invalid request format - missing questions or answers');
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    console.log('First question:', questions[0] ? JSON.stringify(questions[0], null, 2) : 'none');
    console.log('First answer:', answers[0] ? JSON.stringify(answers[0], null, 2) : 'none');
    
    const scoreResult = gameService.scoreGame(questions, answers);
    
    // Record the results for each student to track performance
    const performanceUpdates = [];
    
    for (const result of scoreResult.results) {
      const question = questions.find(q => q.id === result.questionId);
      if (question) {
        // Create answer details to track wrong answers
        let answerDetails = null;
        
        // Include different details based on question type
        if (!result.correct && !result.dontKnow) {
          answerDetails = {};
          
          // Add timestamp to all wrong answers
          answerDetails.timestamp = new Date().toISOString();
          
          if (question.type === 'shortAnswer') {
            // For short answer, capture what they typed vs correct answers
            answerDetails.userAnswer = result.userTextAnswer;
            answerDetails.correctAnswers = question.acceptableAnswers;
            answerDetails.questionType = 'shortAnswer';
          } else if (question.type === 'standard' || question.type === 'hard') {
            // For standard/hard mode, capture which name they selected
            const selectedOption = question.options.find(opt => opt.id === result.selectedOptionId);
            const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
            
            if (selectedOption && correctOption) {
              answerDetails.selectedName = selectedOption.name;
              answerDetails.selectedId = selectedOption.id;
              answerDetails.correctName = correctOption.name || correctOption.fullName;
              answerDetails.correctId = correctOption.id;
              answerDetails.questionType = question.type;
            }
          } else if (question.type === 'reverse') {
            // For reverse mode, capture which photo they selected
            try {
              answerDetails.selectedId = result.selectedOptionId;
              const selectedIndex = question.options.findIndex(opt => opt.id === result.selectedOptionId);
              const correctIndex = question.options.findIndex(opt => opt.id === question.correctOptionId);
              
              console.log(`REVERSE MODE DEBUG - selectedId: ${result.selectedOptionId}, correctId: ${question.correctOptionId}`);
              console.log(`REVERSE MODE DEBUG - options length: ${question.options.length}`);
              
              // Find all available options
              const allOptions = question.options.map((opt, idx) => {
                return {
                  id: opt.id,
                  name: opt.name || opt.fullName || ((opt.firstName && opt.lastName) ? `${opt.firstName} ${opt.lastName}` : `Option ${idx+1}`)
                };
              });
              
              console.log('REVERSE MODE DEBUG - All options:', JSON.stringify(allOptions, null, 2));
              
              // Force map the names to options
              const optionMap = {};
              question.options.forEach((opt, idx) => {
                const name = opt.name || opt.fullName || ((opt.firstName && opt.lastName) ? `${opt.firstName} ${opt.lastName}` : `Option ${idx+1}`);
                optionMap[opt.id] = name;
              });
              
              // Directly set the names from our map
              answerDetails.selectedName = optionMap[result.selectedOptionId] || `Student ${selectedIndex + 1}`;
              answerDetails.correctName = optionMap[question.correctOptionId] || `Student ${correctIndex + 1}`;
              answerDetails.studentName = question.studentName;
              answerDetails.questionType = 'reverse';
              
              console.log('REVERSE MODE DEBUG - Final details:', JSON.stringify(answerDetails, null, 2));
            } catch (error) {
              console.error('Error processing reverse mode answer:', error);
              // Basic fallback
              answerDetails.selectedId = result.selectedOptionId;
              answerDetails.studentName = question.studentName;
              answerDetails.questionType = 'reverse';
            }
          }
          
          // If we couldn't get any details, set to null
          if (Object.keys(answerDetails).length <= 1) { // Just timestamp is not enough
            answerDetails = null;
          }
          
          // Debug logging
          console.log('Wrong answer details:', answerDetails);
        }
        
        // Include dontKnow flag and answer details in performance updates
        performanceUpdates.push({
          studentId: question.studentId,
          wasCorrect: result.correct,
          dontKnow: result.dontKnow || false,
          answerDetails: answerDetails
        });
      }
    }
    
    console.log('Recording performance updates:', performanceUpdates);
    
    // Record all the results in the performance database
    if (performanceUpdates.length > 0) {
      console.log(`Recording ${performanceUpdates.length} performance updates`);
      const wrongAnswersCount = performanceUpdates.filter(u => u.answerDetails !== null).length;
      console.log(`Performance updates with wrong answers: ${wrongAnswersCount}`);
      
      if (wrongAnswersCount > 0) {
        console.log('Wrong answer details being recorded:');
        performanceUpdates
          .filter(u => u.answerDetails !== null)
          .forEach((update, index) => {
            console.log(`Wrong answer ${index + 1}:`, JSON.stringify(update, null, 2));
          });
      }
      
      try {
        await studentPerformanceDb.recordBatchResults(performanceUpdates);
        console.log('Successfully recorded batch results');
        
        // Verify recording was successful by checking students with wrong answers
        for (const update of performanceUpdates.filter(u => u.answerDetails !== null)) {
          const perf = await studentPerformanceDb.getStudentPerformance(update.studentId);
          console.log(`Verified student ${update.studentId} now has ${perf.wrongAnswers.length} wrong answers`);
          console.log('Latest wrong answer:', perf.wrongAnswers.length > 0 ? 
            JSON.stringify(perf.wrongAnswers[perf.wrongAnswers.length - 1], null, 2) : 'None');
        }
      } catch (error) {
        console.error('Error recording batch results:', error);
      }
    }
    
    // Verify wrong answers were stored by manually checking the database
    // Count how many records should have wrong answers
    const studentsWithWrongAnswers = performanceUpdates
      .filter(update => !update.wasCorrect && !update.dontKnow && update.answerDetails !== null)
      .map(update => update.studentId);
    
    console.log(`Should have wrong answers for ${studentsWithWrongAnswers.length} students:`, studentsWithWrongAnswers);
    
    if (studentsWithWrongAnswers.length > 0) {
      // Directly read the DB file to check if wrong answers were persisted 
      try {
        const fs = require('fs-extra');
        const path = require('path');
        const dbPath = path.join(__dirname, '../../data/student_performance.json');
        const rawData = await fs.readJson(dbPath);
        
        for (const studentId of studentsWithWrongAnswers) {
          const student = rawData.students[studentId];
          if (student && student.wrongAnswers) {
            console.log(`Final DB check: Student ${studentId} has ${student.wrongAnswers.length} wrong answers`);
          } else {
            console.error(`Final DB check: Student ${studentId} has NO wrongAnswers array in the database file`);
          }
        }
      } catch (error) {
        console.error('Error doing final database check:', error);
      }
    }
    
    // Return student performance data for the results screen
    const studentIds = questions.map(q => q.studentId);
    const performanceData = {};
    
    for (const studentId of studentIds) {
      performanceData[studentId] = await studentPerformanceDb.getStudentPerformance(studentId);
      
      // Log if this student has wrong answers in the performance data
      if (performanceData[studentId].wrongAnswers && performanceData[studentId].wrongAnswers.length > 0) {
        console.log(`Performance data for student ${studentId} has ${performanceData[studentId].wrongAnswers.length} wrong answers`);
      }
    }
    
    // Add performance data to the score result
    scoreResult.performanceData = performanceData;
    
    res.json(scoreResult);
  } catch (error) {
    console.error('Error scoring game:', error);
    res.status(500).json({ error: 'Failed to score game' });
  }
}

/**
 * Add a wrong answer to a student's performance record (for testing)
 */
async function addWrongAnswer(req, res) {
  try {
    const { studentId, wrongAnswer } = req.body;
    
    if (!studentId || !wrongAnswer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get the student's performance data
    const performanceData = await studentPerformanceDb.getStudentPerformance(studentId);
    
    // Initialize wrongAnswers array if it doesn't exist
    if (!performanceData.wrongAnswers) {
      performanceData.wrongAnswers = [];
    }
    
    // Add the wrong answer
    performanceData.wrongAnswers.push(wrongAnswer);
    
    // Save the updated performance data
    await studentPerformanceDb.recordResult(
      studentId, 
      false, // wasCorrect = false
      false, // dontKnow = false
      wrongAnswer // answerDetails
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding wrong answer:', error);
    res.status(500).json({ error: 'Failed to add wrong answer' });
  }
}

module.exports = {
  generateGame,
  scoreGame,
  getGameTags,
  addWrongAnswer
};