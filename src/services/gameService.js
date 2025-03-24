/**
 * Game Service
 * Handles game logic for the Name Game application
 */

/**
 * Generate a round of questions for the standard game mode
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of question objects
 */
function generateStandardGameRound(students, questionCount = 5) {
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
    
    // Generate a set of options (including the correct one)
    // Shuffle the full array of students each time to ensure random selection
    const allStudentsShuffled = [...students].sort(() => Math.random() - 0.5);
    // Filter out the correct student and take the first 3 for wrong options
    const otherStudents = allStudentsShuffled.filter(s => s.id !== correctStudent.id).slice(0, 3);
    
    // Add the correct student to the options and shuffle
    const options = [...otherStudents, correctStudent];
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    // Create the question object
    questions.push({
      id: `question_${i + 1}`,
      type: 'standard',
      studentImage: correctStudent.imagePath,
      studentId: correctStudent.id,
      options: shuffledOptions.map(student => ({
        id: student.id,
        name: student.fullName,
        imagePath: student.imagePath, // Include the image path for each option
      })),
      correctOptionId: correctStudent.id
    });
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
  
  // Shuffle the students array
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  
  const questions = [];
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    // Select the correct student for this question
    const correctStudent = shuffledStudents[i];
    
    // Generate a set of options (including the correct one)
    // Shuffle the full array of students each time to ensure random selection
    const allStudentsShuffled = [...students].sort(() => Math.random() - 0.5);
    // Filter out the correct student and take the first 3 for wrong options
    const otherStudents = allStudentsShuffled.filter(s => s.id !== correctStudent.id).slice(0, 3);
    
    // Add the correct student to the options and shuffle
    const options = [...otherStudents, correctStudent];
    const shuffledOptions = options.sort(() => Math.random() - 0.5);
    
    // Create the question object (reverse mode shows name, asks for photo)
    questions.push({
      id: `question_${i + 1}`,
      type: 'reverse',
      studentName: correctStudent.fullName,
      studentId: correctStudent.id,
      options: shuffledOptions.map(student => ({
        id: student.id,
        imagePath: student.imagePath,
        name: student.fullName, // Include the name for each option
      })),
      correctOptionId: correctStudent.id
    });
  }
  
  return questions;
}

/**
 * Check answers and calculate score
 * @param {Array} questions - Array of question objects
 * @param {Array} answers - Array of answer objects {questionId, selectedOptionId}
 * @returns {Object} Score results
 */
function scoreGame(questions, answers) {
  let correctCount = 0;
  let totalQuestions = questions.length;
  
  const results = answers.map(answer => {
    const question = questions.find(q => q.id === answer.questionId);
    
    if (!question) {
      return { questionId: answer.questionId, correct: false, error: 'Question not found' };
    }
    
    const isCorrect = question.correctOptionId === answer.selectedOptionId;
    if (isCorrect) correctCount++;
    
    return {
      questionId: answer.questionId,
      correct: isCorrect,
      correctOptionId: question.correctOptionId,
      selectedOptionId: answer.selectedOptionId
    };
  });
  
  return {
    score: correctCount,
    totalQuestions,
    percentage: Math.round((correctCount / totalQuestions) * 100),
    results
  };
}

module.exports = {
  generateStandardGameRound,
  generateReverseGameRound,
  scoreGame
};
