const fs = require('fs-extra');
const path = require('path');

// Path to the performance database
const dbPath = path.join(__dirname, 'data/student_performance.json');

// Define the direct add function
async function addWrongAnswerDirect(studentId, wrongAnswer) {
  try {
    console.log(`Adding wrong answer to student ${studentId}...`);
    
    // Read the database
    const data = await fs.readJson(dbPath);
    
    // Check if the student exists in the database
    if (!data.students[studentId]) {
      console.error(`Student ${studentId} not found in database`);
      return false;
    }
    
    // Make sure the wrongAnswers array exists
    if (!data.students[studentId].wrongAnswers) {
      data.students[studentId].wrongAnswers = [];
    }
    
    // Add the wrong answer to the student's record
    data.students[studentId].wrongAnswers.push(wrongAnswer);
    
    // Update the incorrect count
    data.students[studentId].incorrectCount = (data.students[studentId].incorrectCount || 0) + 1;
    
    // Calculate success rate
    const correct = data.students[studentId].correctCount || 0;
    const total = correct + data.students[studentId].incorrectCount;
    data.students[studentId].successRate = total > 0 ? (correct / total) * 100 : 0;
    
    // Write the updated database back to the file
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    // Verify the change
    const verifyData = await fs.readJson(dbPath);
    const updatedStudent = verifyData.students[studentId];
    const found = updatedStudent.wrongAnswers.some(
      wa => wa.timestamp === wrongAnswer.timestamp
    );
    
    if (found) {
      console.log(`SUCCESS: Wrong answer added to student ${studentId}`);
      console.log(`Student now has ${updatedStudent.wrongAnswers.length} wrong answers`);
      return true;
    } else {
      console.error(`FAILED: Wrong answer not found in student ${studentId}'s record after update`);
      return false;
    }
  } catch (error) {
    console.error('Error adding wrong answer directly:', error);
    return false;
  }
}

// Define a test wrong answer
const testWrongAnswer = {
  timestamp: new Date().toISOString(),
  questionType: 'standard',
  selectedName: 'DIRECT TEST NAME',
  selectedId: 'student_direct_test_456',
  correctName: 'DIRECT CORRECT NAME',
  correctId: 'student_direct_test_789',
  direct: true // Special flag to identify this direct test entry
};

// Ensure file permissions are correct
async function checkPermissions() {
  try {
    const stats = await fs.stat(dbPath);
    console.log('File permissions:', {
      readable: !!(stats.mode & 0o400),
      writable: !!(stats.mode & 0o200),
      executable: !!(stats.mode & 0o100),
      owner: stats.uid,
      group: stats.gid
    });
    
    // Ensure the file is writable
    await fs.access(dbPath, fs.constants.W_OK);
    console.log('File is writable by current user');
    return true;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

// Find a random student ID from the database
async function getRandomStudentId() {
  try {
    const data = await fs.readJson(dbPath);
    const studentIds = Object.keys(data.students);
    if (studentIds.length === 0) {
      throw new Error('No students found in database');
    }
    
    // Get a random student ID
    const randomIndex = Math.floor(Math.random() * studentIds.length);
    return studentIds[randomIndex];
  } catch (error) {
    console.error('Error getting random student ID:', error);
    throw error;
  }
}

// Main function to run the test
async function runTest() {
  try {
    console.log('Checking database file permissions...');
    await checkPermissions();
    
    // Get a random student ID to use for the test
    const studentId = await getRandomStudentId();
    console.log(`Using student ID: ${studentId}`);
    
    // Add the test wrong answer
    const success = await addWrongAnswerDirect(studentId, testWrongAnswer);
    
    if (success) {
      console.log('Test completed successfully');
    } else {
      console.error('Test failed');
    }
  } catch (error) {
    console.error('Error running test:', error);
  }
}

// Run the test
runTest();