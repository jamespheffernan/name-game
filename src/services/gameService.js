/**
 * Game Service
 * Handles game logic for the Name Game application
 */

// Import the connection services for trivia modes
const connectionService = require('./connectionService');
const educationConnectionService = require('./education-connections');

/**
 * Calculate tag similarity between two students
 * Higher score indicates more tags in common
 * @param {Object} student1 - First student with tags array
 * @param {Object} student2 - Second student with tags array
 * @returns {number} Similarity score (number of shared tags)
 */
function calculateTagSimilarity(student1, student2) {
  // If either student doesn't have tags, return 0
  if (!student1 || !student2 || !Array.isArray(student1.tags) || !Array.isArray(student2.tags)) {
    return 0;
  }
  
  // Count shared tags
  const tags1 = new Set(student1.tags);
  return student2.tags.filter(tag => tags1.has(tag)).length;
}

/**
 * Calculate name similarity score between two students based on first/last name
 * This is a fallback similarity measure when tag data is limited
 * @param {Object} student1 - First student
 * @param {Object} student2 - Second student
 * @returns {number} A score from 0-1 indicating name similarity
 */
function calculateNameSimilarity(student1, student2) {
  if (!student1 || !student2) return 0;
  
  const firstName1 = (student1.firstName || '').toLowerCase();
  const lastName1 = (student1.lastName || '').toLowerCase();
  const firstName2 = (student2.firstName || '').toLowerCase();
  const lastName2 = (student2.lastName || '').toLowerCase();
  
  let score = 0;
  
  // First letter of first name is the same
  if (firstName1.charAt(0) === firstName2.charAt(0)) {
    score += 0.3;
  }
  
  // First letter of last name is the same
  if (lastName1.charAt(0) === lastName2.charAt(0)) {
    score += 0.3;
  }
  
  // Similar name length (as a proportion)
  const firstNameLengthDiff = Math.abs(firstName1.length - firstName2.length);
  score += (1 - Math.min(firstNameLengthDiff / 5, 1)) * 0.2;
  
  const lastNameLengthDiff = Math.abs(lastName1.length - lastName2.length);
  score += (1 - Math.min(lastNameLengthDiff / 5, 1)) * 0.2;
  
  return score;
}

/**
 * Select wrong options for a question, prioritizing students with similar tags
 * @param {Object} correctStudent - The correct student object
 * @param {Array} allStudents - Array of all available students
 * @param {number} count - Number of wrong options to select
 * @param {boolean} [useSimilarity=true] - Whether to use tag similarity for selection
 * @returns {Array} Array of selected wrong option students
 */
function selectSimilarWrongOptions(correctStudent, allStudents, count, useSimilarity = true) {
  // Filter out the correct student
  const wrongOptions = allStudents.filter(s => s.id !== correctStudent.id);
  
  // If not enough options, return all available
  if (wrongOptions.length <= count) {
    return wrongOptions;
  }
  
  // If similarity-based selection is disabled, return random selection
  if (!useSimilarity) {
    return [...wrongOptions].sort(() => Math.random() - 0.5).slice(0, count);
  }
  
  // Calculate similarity scores
  const optionsWithScores = wrongOptions.map(student => {
    // Calculate tag similarity (primary score)
    const tagSimilarity = calculateTagSimilarity(correctStudent, student);
    
    // Calculate name similarity as a secondary score (scaled to be less than 1)
    const nameSimilarity = calculateNameSimilarity(correctStudent, student) * 0.8;
    
    // Use a combined score that prioritizes tag similarity but also considers name similarity
    const combinedScore = tagSimilarity > 0 ? tagSimilarity : nameSimilarity;
    
    return {
      student,
      similarityScore: combinedScore,
      tagSimilarity,
      nameSimilarity
    };
  });
  
  // Sort by similarity score (high to low)
  optionsWithScores.sort((a, b) => {
    // First compare tag similarity
    if (a.tagSimilarity !== b.tagSimilarity) {
      return b.tagSimilarity - a.tagSimilarity;
    }
    
    // If tied on tag similarity, use name similarity as a tiebreaker
    return b.nameSimilarity - a.nameSimilarity;
  });
  
  // Use 100% similar options, sorted by similarity score
  const mostSimilar = optionsWithScores.slice(0, count).map(item => item.student);
  
  // Return the most similar options
  return mostSimilar;
}

/**
 * Prioritize difficult students by sorting and weighting based on performance metrics
 * @param {Array} students - Array of student objects with performance data
 * @returns {Array} Prioritized array of students weighted toward difficult ones
 */
function prioritizeDifficultStudents(students) {
  // Make a copy of the array to avoid modifying the original
  const studentsWithPerformance = [...students];
  
  // Calculate a difficulty score for each student
  studentsWithPerformance.forEach(student => {
    const performance = student.performance;
    
    // Higher weight for incorrect answers
    // The formula prioritizes:
    // 1. Students with high incorrect counts
    // 2. Students with low success rates
    // 3. Students with more recent incorrect answers
    let difficultyScore = 0;
    
    if (performance.attemptCount > 0) {
      // Base difficulty: inverted success rate (higher is more difficult)
      difficultyScore = 100 - performance.successRate;
      
      // Extra weight for students with more incorrect answers
      difficultyScore *= (1 + (performance.incorrectCount / 10));
      
      // Bonus for students with recent incorrect answers
      if (!performance.lastAnsweredCorrectly) {
        difficultyScore *= 1.5;
      }
    }
    
    student.difficultyScore = difficultyScore;
  });
  
  // Sort by difficulty score (descending) - most difficult first
  studentsWithPerformance.sort((a, b) => b.difficultyScore - a.difficultyScore);
  
  // For the most difficult students (top 50% or at least 5), ensure they appear multiple times
  const guaranteedDifficultCount = Math.max(5, Math.ceil(studentsWithPerformance.length / 2));
  const mostDifficult = studentsWithPerformance.slice(0, guaranteedDifficultCount);
  
  // Create a weighted selection that heavily favors difficult students
  const weightedSelection = [];
  
  // Add all students to the selection
  for (let i = 0; i < studentsWithPerformance.length; i++) {
    const student = studentsWithPerformance[i];
    
    // Base weight: all students appear at least once
    let weight = 1;
    
    // Most difficult students (top of the list) get significantly more weight
    if (i < guaranteedDifficultCount) {
      // Exponential weighting - earlier students get much higher priority
      weight = Math.max(5, Math.ceil(15 * Math.pow(0.85, i)));
    }
    
    for (let j = 0; j < weight; j++) {
      weightedSelection.push(student);
    }
  }
  
  // Shuffle the weighted selection for randomness
  const shuffledSelection = weightedSelection.sort(() => Math.random() - 0.5);
  
  // Remove duplicates while maintaining order
  const uniqueStudentIds = new Set();
  const uniqueStudents = [];
  
  for (const student of shuffledSelection) {
    if (!uniqueStudentIds.has(student.id)) {
      uniqueStudentIds.add(student.id);
      uniqueStudents.push(student);
    }
  }
  
  // If there are any "most difficult" students, ensure they appear in the first
  // half of the questions by placing them at the front of the array
  if (mostDifficult.length > 0) {
    const difficultIds = new Set(mostDifficult.map(s => s.id));
    
    // First remove all difficult students from the current list
    const remainingStudents = uniqueStudents.filter(s => !difficultIds.has(s.id));
    
    // Shuffle the most difficult students
    const shuffledDifficult = [...mostDifficult].sort(() => Math.random() - 0.5);
    
    // Combine: difficult students first, then the rest
    return [...shuffledDifficult, ...remainingStudents];
  }
  
  return uniqueStudents;
}

/**
 * Generate a round of questions for the hard mode game
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of question objects
 */
function generateHardGameRound(students, questionCount = 5) {
  // Check if we have enough students
  if (!students || students.length < 31) {
    throw new Error('Need at least 31 students to generate a hard game round');
  }
  
  // Limit question count to the number of available students
  questionCount = Math.min(questionCount, students.length);
  
  // Shuffle the students array
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  
  const questions = [];
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    // Select the correct student for this question
    const correctStudent = shuffledStudents[i];
    
    // Generate a set of options (including the correct one)
    // Use tag similarity to select more challenging wrong options for hard mode
    const otherStudents = selectSimilarWrongOptions(correctStudent, students, 29);
    
    // Add the correct student to the options and shuffle
    const options = [...otherStudents, correctStudent];
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    // Create the question object for hard mode - exactly matching standard mode format
    questions.push({
      id: `question_${i + 1}`,
      type: 'hard',
      studentImage: correctStudent.imagePath,
      studentId: correctStudent.id,
      options: shuffledOptions.map(student => ({
        id: student.id,
        name: student.fullName,
        imagePath: student.imagePath,
        // Include these to ensure consistency with the data model
        firstName: student.firstName,
        lastName: student.lastName,
        fullName: student.fullName,
        // Include preferredName if it exists
        ...(student.preferredName && { preferredName: student.preferredName })
      })),
      correctOptionId: correctStudent.id
    });
  }
  
  return questions;
}

/**
 * Generate a round of questions for the standard game mode
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of question objects
 */
/**
 * Generate a round of questions for the short answer mode
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of question objects
 */
function generateShortAnswerGameRound(students, questionCount = 5) {
  // Check if we have enough students
  if (!students || students.length < 5) {
    throw new Error('Need at least 5 students to generate a game round');
  }
  
  // Limit question count to the number of available students
  questionCount = Math.min(questionCount, students.length);
  
  // Shuffle the students array
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  
  const questions = [];
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    // Select the correct student for this question
    const correctStudent = shuffledStudents[i];
    
    // Ensure all required properties exist to prevent undefined errors
    const sanitizedStudent = {
      id: correctStudent.id || `unknown_${i}`,
      imagePath: correctStudent.imagePath || '',
      firstName: correctStudent.firstName || '',
      lastName: correctStudent.lastName || '',
      fullName: correctStudent.fullName || `Student ${i+1}`,
      preferredName: correctStudent.preferredName || null
    };
    
    // Create the question object
    questions.push({
      id: `question_${i + 1}`,
      type: 'shortAnswer',
      studentImage: sanitizedStudent.imagePath,
      studentId: sanitizedStudent.id,
      firstName: sanitizedStudent.firstName,
      lastName: sanitizedStudent.lastName,
      preferredName: sanitizedStudent.preferredName,
      fullName: sanitizedStudent.fullName,
      // Store acceptable answers
      acceptableAnswers: [
        sanitizedStudent.firstName.toLowerCase(),
        ...(sanitizedStudent.preferredName ? [sanitizedStudent.preferredName.toLowerCase()] : [])
      ]
    });
  }
  
  return questions;
}

function generateStandardGameRound(students, questionCount = 5) {
  // Check if we have enough students
  if (!students || students.length < 5) {
    throw new Error('Need at least 5 students to generate a game round');
  }
  
  // Limit question count to the number of available students
  questionCount = Math.min(questionCount, students.length);
  
  // Filter to only students with images
  const studentsWithImages = students.filter(student => student.imagePath);
  if (studentsWithImages.length < 5) {
    throw new Error('Need at least 5 students with images to generate a standard game round');
  }
  
  // Shuffle the students array
  const shuffledStudents = [...studentsWithImages].sort(() => Math.random() - 0.5);
  
  const questions = [];
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    try {
      // Select the correct student for this question
      const correctStudent = shuffledStudents[i];
      
      // Ensure all required properties exist to prevent undefined errors
      const sanitizedCorrect = {
        id: correctStudent.id || `unknown_${i}`,
        imagePath: correctStudent.imagePath || '',
        firstName: correctStudent.firstName || '',
        lastName: correctStudent.lastName || '',
        fullName: correctStudent.fullName || `Student ${i+1}`,
        preferredName: correctStudent.preferredName || null
      };
      
      // Generate a set of options (including the correct one)
      // Use tag similarity to select more challenging wrong options
      const otherStudents = selectSimilarWrongOptions(correctStudent, studentsWithImages, 3);
      
      // Add the correct student to the options and shuffle
      const options = [...otherStudents, correctStudent];
      const shuffledOptions = options.sort(() => Math.random() - 0.5);
      
      // Create the question object
      questions.push({
        id: `question_${i + 1}`,
        type: 'standard',
        studentImage: sanitizedCorrect.imagePath,
        studentId: sanitizedCorrect.id,
        options: shuffledOptions.map(student => {
          // Sanitize each option student
          const sanitizedOption = {
            id: student.id || `option_unknown_${Math.random()}`,
            imagePath: student.imagePath || '',
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            fullName: student.fullName || `Option ${Math.random()}`,
            preferredName: student.preferredName || null
          };
          
          return {
            id: sanitizedOption.id,
            name: sanitizedOption.fullName,
            imagePath: sanitizedOption.imagePath,
            firstName: sanitizedOption.firstName,
            lastName: sanitizedOption.lastName,
            ...(sanitizedOption.preferredName && { preferredName: sanitizedOption.preferredName })
          };
        }),
        correctOptionId: sanitizedCorrect.id
      });
    } catch (error) {
      console.error(`Error generating question ${i+1}:`, error);
      // Skip this question and continue with the next one
    }
  }
  
  return questions;
}

/**
 * Generate a round of questions for the reverse game mode
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of question objects
 */
function generateReverseGameRound(students, questionCount = 5) {
  // Check if we have enough students
  if (!students || students.length < 5) {
    throw new Error('Need at least 5 students to generate a game round');
  }
  
  // Limit question count to the number of available students
  questionCount = Math.min(questionCount, students.length);
  
  // Filter to only students with images
  const studentsWithImages = students.filter(student => student.imagePath);
  if (studentsWithImages.length < 5) {
    throw new Error('Need at least 5 students with images to generate a reverse game round');
  }
  
  // Shuffle the students array
  const shuffledStudents = [...studentsWithImages].sort(() => Math.random() - 0.5);
  
  const questions = [];
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    try {
      // Select the correct student for this question
      const correctStudent = shuffledStudents[i];
      
      // Ensure all required properties exist to prevent undefined errors
      const sanitizedCorrect = {
        id: correctStudent.id || `unknown_${i}`,
        imagePath: correctStudent.imagePath || '',
        firstName: correctStudent.firstName || '',
        lastName: correctStudent.lastName || '',
        fullName: correctStudent.fullName || `Student ${i+1}`,
        preferredName: correctStudent.preferredName || null
      };
      
      // Generate a set of options (including the correct one)
      // Use tag similarity to select more challenging wrong options for reverse mode
      const otherStudents = selectSimilarWrongOptions(
        correctStudent, 
        studentsWithImages.filter(s => s.imagePath), // Ensure all have images
        3
      );
      
      // Add the correct student to the options and shuffle
      const options = [...otherStudents, correctStudent];
      const shuffledOptions = options.sort(() => Math.random() - 0.5);
      
      // Create the question object (reverse mode shows name, asks for photo)
      questions.push({
        id: `question_${i + 1}`,
        type: 'reverse',
        studentName: sanitizedCorrect.fullName,
        studentId: sanitizedCorrect.id,
        // Include these properties for proper name formatting in reverse mode
        firstName: sanitizedCorrect.firstName,
        lastName: sanitizedCorrect.lastName,
        ...(sanitizedCorrect.preferredName && { preferredName: sanitizedCorrect.preferredName }),
        options: shuffledOptions.map(student => {
          // Sanitize each option student
          const sanitizedOption = {
            id: student.id || `option_unknown_${Math.random()}`,
            imagePath: student.imagePath || '',
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            fullName: student.fullName || `Option ${Math.random()}`,
            preferredName: student.preferredName || null
          };
          
          return {
            id: sanitizedOption.id,
            imagePath: sanitizedOption.imagePath,
            name: sanitizedOption.fullName,
            firstName: sanitizedOption.firstName,
            lastName: sanitizedOption.lastName,
            ...(sanitizedOption.preferredName && { preferredName: sanitizedOption.preferredName })
          };
        }),
        correctOptionId: sanitizedCorrect.id
      });
    } catch (error) {
      console.error(`Error generating question ${i+1}:`, error);
      // Skip this question and continue with the next one
    }
  }
  
  return questions;
}

/**
 * Check answers and calculate score
 * @param {Array} questions - Array of question objects
 * @param {Array} answers - Array of answer objects {questionId, selectedOptionId, dontKnow, textAnswer}
 * @returns {Object} Score results
 */
function scoreGame(questions, answers) {
  if (!questions || !Array.isArray(questions) || !answers || !Array.isArray(answers)) {
    console.error('Invalid input to scoreGame:', {
      questionsType: typeof questions,
      isQuestionsArray: Array.isArray(questions),
      questionsLength: questions ? questions.length : 0,
      answersType: typeof answers,
      isAnswersArray: Array.isArray(answers),
      answersLength: answers ? answers.length : 0
    });
    
    // Return default error result
    return {
      score: 0,
      totalQuestions: 0,
      percentage: 0,
      dontKnowCount: 0,
      dontKnowPercentage: 0,
      results: [],
      error: 'Invalid input to scoreGame'
    };
  }
  
  let correctCount = 0;
  let totalQuestions = questions.length;
  let dontKnowCount = 0;
  
  const results = answers.map(answer => {
    try {
      // Skip processing if answer is invalid
      if (!answer || typeof answer !== 'object' || !answer.questionId) {
        console.error('Invalid answer object:', answer);
        return { 
          questionId: 'unknown', 
          correct: false, 
          error: 'Invalid answer format' 
        };
      }
      
      const question = questions.find(q => q.id === answer.questionId);
      
      if (!question) {
        console.warn(`Question not found for answer ID: ${answer.questionId}`);
        return { 
          questionId: answer.questionId, 
          correct: false, 
          error: 'Question not found' 
        };
      }
      
      // Handle "Don't Know" responses (still counts as incorrect)
      if (answer.dontKnow || answer.selectedOptionId === 'dont-know') {
        dontKnowCount++;
        return {
          questionId: answer.questionId,
          correct: false,
          dontKnow: true,
          correctOptionId: question.correctOptionId || question.studentId,
          selectedOptionId: 'dont-know'
        };
      }
      
      // Handle short answer mode
      if (question.type === 'shortAnswer' && answer.textAnswer) {
        // Clean up and normalize the user's text answer
        const userAnswer = (answer.textAnswer || '').trim().toLowerCase();
        
        // Ensure acceptableAnswers exists and is an array
        const acceptableAnswers = Array.isArray(question.acceptableAnswers) ? 
          question.acceptableAnswers : [];
        
        // Check if the answer matches any acceptable answer
        const isCorrect = acceptableAnswers.includes(userAnswer) && userAnswer.length > 0;
        
        if (isCorrect) correctCount++;
        
        return {
          questionId: answer.questionId,
          correct: isCorrect,
          correctAnswers: acceptableAnswers,
          userTextAnswer: userAnswer,
          studentId: question.studentId,
          firstName: question.firstName || '',
          preferredName: question.preferredName || null
        };
      }
      
      // Handle standard/reverse multiple choice
      const isCorrect = question.correctOptionId === answer.selectedOptionId;
      if (isCorrect) correctCount++;
      
      return {
        questionId: answer.questionId,
        correct: isCorrect,
        correctOptionId: question.correctOptionId,
        selectedOptionId: answer.selectedOptionId
      };
    } catch (error) {
      console.error('Error processing answer:', error, 'Answer:', answer);
      return { 
        questionId: answer ? answer.questionId : 'unknown', 
        correct: false, 
        error: `Processing error: ${error.message}` 
      };
    }
  });
  
  // Ensure we have a valid totalQuestions
  totalQuestions = Math.max(1, totalQuestions);
  
  return {
    score: correctCount,
    totalQuestions,
    percentage: Math.round((correctCount / totalQuestions) * 100),
    dontKnowCount,
    dontKnowPercentage: Math.round((dontKnowCount / totalQuestions) * 100),
    results
  };
}

/**
 * Generate a round of trivia questions about student connections
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of trivia question objects
 */
function generateConnectionTriviaRound(students, questionCount = 5) {
  // Delegate to the connection service
  return connectionService.generateConnectionTriviaRound(students, questionCount);
}

/**
 * Generate a round of education trivia questions about student connections
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of trivia question objects
 */
function generateEducationTriviaRound(students, questionCount = 5) {
  // Delegate to the education connection service
  return educationConnectionService.generateEducationTriviaRound(students, questionCount);
}

module.exports = {
  generateStandardGameRound,
  generateReverseGameRound,
  generateHardGameRound,
  generateShortAnswerGameRound,
  generateConnectionTriviaRound,
  generateEducationTriviaRound,  // Export the new education trivia function
  scoreGame,
  prioritizeDifficultStudents,
  // Export utility functions for testing and configuration
  calculateTagSimilarity,
  calculateNameSimilarity,
  selectSimilarWrongOptions
};
