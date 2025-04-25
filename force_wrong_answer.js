const fs = require('fs-extra');
const path = require('path');

// Path to the database file
const dbPath = path.join(__dirname, 'data/student_performance.json');
const backupPath = path.join(__dirname, 'data/student_performance_force_backup.json');

async function forceWrongAnswer() {
  try {
    console.log('Loading database file:', dbPath);
    
    // Create a backup first
    await fs.copy(dbPath, backupPath);
    console.log('Created backup at:', backupPath);
    
    // Read the database
    const data = await fs.readJson(dbPath);
    console.log('Loaded database with', Object.keys(data.students).length, 'students');
    
    // Find a student to add a wrong answer to
    const studentIds = Object.keys(data.students);
    const targetStudent = studentIds[0]; // Use the first student in the database
    
    console.log(`Adding forced wrong answer to student: ${targetStudent}`);
    
    // Ensure the wrongAnswers array exists
    if (!data.students[targetStudent].wrongAnswers) {
      data.students[targetStudent].wrongAnswers = [];
    }
    
    // Create a test wrong answer
    const forcedWrongAnswer = {
      timestamp: new Date().toISOString(),
      questionType: 'standard',
      selectedName: 'FORCED TEST NAME',
      selectedId: 'student_test_123',
      correctName: 'FORCED CORRECT NAME',
      correctId: targetStudent,
      forced: true // special flag to identify this test entry
    };
    
    // Add the wrong answer
    data.students[targetStudent].wrongAnswers.push(forcedWrongAnswer);
    
    // Write the updated database back to the file
    await fs.writeJson(dbPath, data, { spaces: 2 });
    console.log('Successfully wrote database file with forced wrong answer');
    
    // Verify the change
    const verifyData = await fs.readJson(dbPath);
    const updatedStudent = verifyData.students[targetStudent];
    
    if (updatedStudent && 
        updatedStudent.wrongAnswers && 
        updatedStudent.wrongAnswers.length > 0 &&
        updatedStudent.wrongAnswers.some(a => a.forced === true)) {
      console.log('VERIFICATION SUCCESSFUL: Found forced wrong answer in database');
      console.log('Student wrong answers:', updatedStudent.wrongAnswers.length);
      console.log('Last wrong answer:', JSON.stringify(updatedStudent.wrongAnswers[updatedStudent.wrongAnswers.length - 1], null, 2));
    } else {
      console.error('VERIFICATION FAILED: Could not find forced wrong answer in database');
    }
  } catch (error) {
    console.error('Error forcing wrong answer:', error);
  }
}

// Run the function
forceWrongAnswer();