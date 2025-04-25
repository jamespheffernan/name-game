const fs = require('fs-extra');
const path = require('path');

// Path to our JSON "database" for student performance tracking
const dbPath = path.join(__dirname, '../../data/student_performance.json');

/**
 * Initialize the student performance database
 */
async function initDb() {
  try {
    // Make sure the data directory exists
    await fs.ensureDir(path.dirname(dbPath));
    
    // Create an empty student performance object if the file doesn't exist
    if (!await fs.pathExists(dbPath)) {
      await fs.writeJson(dbPath, { students: {} }, { spaces: 2 });
    } else {
      // Ensure wrongAnswers array exists for all students in the database
      const data = await fs.readJson(dbPath);
      let needsUpdate = false;
      
      for (const studentId in data.students) {
        if (!data.students[studentId].wrongAnswers) {
          data.students[studentId].wrongAnswers = [];
          needsUpdate = true;
        }
      }
      
      // Only write the file if changes were made
      if (needsUpdate) {
        console.log('Upgrading performance database to ensure wrongAnswers arrays exist');
        await fs.writeJson(dbPath, data, { spaces: 2 });
      }
    }
  } catch (error) {
    console.error('Error initializing performance database:', error);
    throw error;
  }
}

/**
 * Get performance data for all students
 * @returns {Promise<Object>} Object with student IDs as keys and performance data as values
 */
async function getAllPerformanceData() {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    return data.students || {};
  } catch (error) {
    console.error('Error getting performance data:', error);
    throw error;
  }
}

/**
 * Get performance data for a specific student
 * @param {string} studentId - The student ID to get performance data for
 * @returns {Promise<Object>} The student's performance data or empty object if not found
 */
async function getStudentPerformance(studentId) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Initialize student data if it doesn't exist in the database
    if (!data.students[studentId]) {
      data.students[studentId] = {
        correctCount: 0,
        incorrectCount: 0,
        dontKnowCount: 0,
        lastAnsweredCorrectly: false,
        attemptCount: 0,
        successRate: 0,
        wrongAnswers: []
      };
      
      // Save the updated data with the new student record
      await fs.writeJson(dbPath, data, { spaces: 2 });
    } 
    // Ensure wrongAnswers array exists for all students
    else if (!data.students[studentId].wrongAnswers) {
      data.students[studentId].wrongAnswers = [];
      
      // Save the updated data with the wrongAnswers array
      await fs.writeJson(dbPath, data, { spaces: 2 });
    }
    
    return data.students[studentId];
  } catch (error) {
    console.error('Error getting student performance:', error);
    throw error;
  }
}

/**
 * Record game result for a student
 * @param {string} studentId - The student ID
 * @param {boolean} wasCorrect - Whether the answer was correct
 * @param {boolean} [dontKnow=false] - Whether the answer was "Don't Know"
 * @param {Object} [answerDetails=null] - Details about the answer for tracking wrong answers
 * @returns {Promise<Object>} Updated performance data for the student
 */
async function recordResult(studentId, wasCorrect, dontKnow = false, answerDetails = null) {
  let data = null;
  
  try {
    console.log(`recordResult called for student ${studentId}: correct=${wasCorrect}, dontKnow=${dontKnow}, has details=${answerDetails !== null}`);
    
    if (answerDetails) {
      console.log('Answer details:', JSON.stringify(answerDetails, null, 2));
    }
    
    await initDb();
    console.log('Database initialized for single result');
    
    // Read the current data
    try {
      data = await fs.readJson(dbPath);
      console.log('Read database successfully for single result, found', Object.keys(data.students).length, 'students');
    } catch (readError) {
      console.error('Error reading database file:', readError);
      // Create an empty database as a fallback
      data = { students: {} };
      console.log('Created empty database as fallback');
    }
    
    // Initialize student data if it doesn't exist
    if (!data.students[studentId]) {
      console.log(`Creating new student record for ${studentId}`);
      data.students[studentId] = {
        correctCount: 0,
        incorrectCount: 0,
        dontKnowCount: 0,
        lastAnsweredCorrectly: false,
        attemptCount: 0,
        successRate: 0,
        wrongAnswers: [] // Array to track wrong answer details
      };
    }
    
    // Ensure wrongAnswers array exists for all students
    if (!data.students[studentId].wrongAnswers) {
      console.log(`Creating missing wrongAnswers array for ${studentId}`);
      data.students[studentId].wrongAnswers = [];
    }
    
    // Debug to check current state
    console.log(`Before update, student ${studentId} has ${data.students[studentId].wrongAnswers.length} wrong answers`);
    
    // Update the student's performance data
    const student = data.students[studentId];
    student.attemptCount++;
    
    if (wasCorrect) {
      student.correctCount++;
      student.lastAnsweredCorrectly = true;
    } else {
      student.incorrectCount++;
      student.lastAnsweredCorrectly = false;
      
      // Track wrong answers with details (except for "Don't Know" responses)
      if (!dontKnow && answerDetails) {
        console.log(`Adding wrong answer for student ${studentId}:`, JSON.stringify(answerDetails, null, 2));
        
        // Ensure the object is properly cloned to avoid reference issues
        const answerDetailsCopy = JSON.parse(JSON.stringify(answerDetails));
        
        // Add the answer details - timestamp is already included
        student.wrongAnswers.push(answerDetailsCopy);
        
        // Debug to verify the array update
        console.log(`After adding, student ${studentId} now has ${student.wrongAnswers.length} wrong answers`);
        
        // Log the last element to ensure it was added correctly
        if (student.wrongAnswers.length > 0) {
          console.log(`Last wrong answer in array:`, 
            JSON.stringify(student.wrongAnswers[student.wrongAnswers.length - 1], null, 2));
        } else {
          console.error(`ERROR: Wrong answer array is empty after adding!`);
        }
      }
      
      // Track "Don't Know" responses separately for analytics
      if (dontKnow) {
        student.dontKnowCount = student.dontKnowCount || 0;
        student.dontKnowCount++;
      }
    }
    
    // Calculate success rate using all attempts
    student.successRate = student.attemptCount > 0 
      ? (student.correctCount / student.attemptCount) * 100 
      : 0;
    
    // Create a backup of the current database before writing
    const backupPath = `${dbPath}.single-backup-${Date.now()}`;
    try {
      await fs.copy(dbPath, backupPath);
      console.log(`Created backup at ${backupPath}`);
    } catch (backupError) {
      console.warn(`Could not create backup: ${backupError.message}`);
      // Continue anyway since backup is not critical
    }
    
    // Save the updated data - try multiple strategies
    let writeSuccess = false;
    
    // Strategy 1: Standard write
    try {
      await fs.writeJson(dbPath, data, { spaces: 2 });
      console.log('Successfully wrote database file using standard write');
      writeSuccess = true;
    } catch (writeError1) {
      console.error('Error with standard write:', writeError1);
      
      // Strategy 2: Write to temp file then move
      try {
        const tempPath = `${dbPath}.temp`;
        await fs.writeJson(tempPath, data, { spaces: 2 });
        await fs.move(tempPath, dbPath, { overwrite: true });
        console.log('Successfully wrote database file using temp file strategy');
        writeSuccess = true;
      } catch (writeError2) {
        console.error('Error with temp file strategy:', writeError2);
        
        // Strategy 3: Direct file write with fs.writeFileSync
        try {
          fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
          console.log('Successfully wrote database file using sync write');
          writeSuccess = true;
        } catch (writeError3) {
          console.error('Error with sync write:', writeError3);
          
          // We've tried all strategies and failed
          throw new Error('All write strategies failed');
        }
      }
    }
    
    // If we successfully wrote the file, verify the data was written correctly
    if (writeSuccess) {
      try {
        // Double-check by reading the file again
        const verifyData = await fs.readJson(dbPath);
        if (!wasCorrect && !dontKnow && answerDetails && 
            verifyData.students[studentId] && 
            verifyData.students[studentId].wrongAnswers) {
          console.log(`Verified student ${studentId} now has ${verifyData.students[studentId].wrongAnswers.length} wrong answers`);
        }
      } catch (verifyError) {
        console.error('Error verifying database file:', verifyError);
        // We still consider this a success since we did write the file
      }
    }
    
    console.log(`Result recorded successfully for student ${studentId}`);
    return student;
  } catch (error) {
    console.error('Error recording result:', error);
    
    // If we have the data in memory but couldn't write it, try to save it to a fallback location
    if (data !== null) {
      try {
        const errorPath = `${dbPath}.single-error-${Date.now()}.json`;
        await fs.writeJson(errorPath, data, { spaces: 2 });
        console.log(`Saved data to error file: ${errorPath}`);
      } catch (fallbackError) {
        console.error('Could not save to fallback location:', fallbackError);
      }
    }
    
    throw error;
  }
}

/**
 * Record multiple game results at once
 * @param {Array} results - Array of {studentId, wasCorrect, dontKnow, answerDetails} objects
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function recordBatchResults(results) {
  let data = null;
  
  try {
    console.log('recordBatchResults called with', results.length, 'results');
    
    await initDb();
    console.log('Database initialized');
    
    // Read the current data
    try {
      data = await fs.readJson(dbPath);
      console.log('Read database successfully, found', Object.keys(data.students).length, 'students');
    } catch (readError) {
      console.error('Error reading database file:', readError);
      // Create an empty database as a fallback
      data = { students: {} };
      console.log('Created empty database as fallback');
    }
    
    // Process each result
    let updatedCount = 0;
    let wrongAnswersAdded = 0;
    
    for (const result of results) {
      const { studentId, wasCorrect, dontKnow, answerDetails } = result;
      console.log(`Processing result for student ${studentId}: correct=${wasCorrect}, dontKnow=${dontKnow}, has details=${answerDetails !== null}`);
      
      // Initialize student data if it doesn't exist
      if (!data.students[studentId]) {
        console.log(`Creating new student record for ${studentId}`);
        data.students[studentId] = {
          correctCount: 0,
          incorrectCount: 0,
          dontKnowCount: 0,
          lastAnsweredCorrectly: false,
          attemptCount: 0,
          successRate: 0,
          wrongAnswers: [] // Array to track wrong answer details
        };
      }
      
      // Ensure wrongAnswers array exists for all students
      if (!data.students[studentId].wrongAnswers) {
        console.log(`Creating missing wrongAnswers array for ${studentId}`);
        data.students[studentId].wrongAnswers = [];
      }
      
      // Debug to check current state
      console.log(`Before update, student ${studentId} has ${data.students[studentId].wrongAnswers.length} wrong answers`);
      
      // Update the student's performance data
      const student = data.students[studentId];
      student.attemptCount++;
      
      if (wasCorrect) {
        student.correctCount++;
        student.lastAnsweredCorrectly = true;
      } else {
        student.incorrectCount++;
        student.lastAnsweredCorrectly = false;
        
        // Track wrong answers with details (except for "Don't Know" responses)
        if (!dontKnow && answerDetails) {
          console.log(`Adding wrong answer for student ${studentId}:`, JSON.stringify(answerDetails, null, 2));
          
          // Ensure the object is properly cloned to avoid reference issues
          const answerDetailsCopy = JSON.parse(JSON.stringify(answerDetails));
          
          // Add the answer details - timestamp is already included
          student.wrongAnswers.push(answerDetailsCopy);
          wrongAnswersAdded++;
          
          // Debug to verify the array update
          console.log(`After adding, student ${studentId} now has ${student.wrongAnswers.length} wrong answers`);
          
          // Log the last element to ensure it was added correctly
          if (student.wrongAnswers.length > 0) {
            console.log(`Last wrong answer in array:`, 
              JSON.stringify(student.wrongAnswers[student.wrongAnswers.length - 1], null, 2));
          } else {
            console.error(`ERROR: Wrong answer array is empty after adding!`);
          }
        }
        
        // Track "Don't Know" responses separately for analytics
        if (dontKnow) {
          student.dontKnowCount = student.dontKnowCount || 0;
          student.dontKnowCount++;
        }
      }
      
      // Calculate success rate using all attempts
      student.successRate = student.attemptCount > 0 
        ? (student.correctCount / student.attemptCount) * 100 
        : 0;
      
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} student records with ${wrongAnswersAdded} new wrong answers`);
    
    // Create a backup of the current database before writing
    const backupPath = `${dbPath}.backup-${Date.now()}`;
    try {
      await fs.copy(dbPath, backupPath);
      console.log(`Created backup at ${backupPath}`);
    } catch (backupError) {
      console.warn(`Could not create backup: ${backupError.message}`);
      // Continue anyway since backup is not critical
    }
    
    // Save the updated data - try multiple strategies
    let writeSuccess = false;
    
    // Strategy 1: Standard write
    try {
      await fs.writeJson(dbPath, data, { spaces: 2 });
      console.log('Successfully wrote database file using standard write');
      writeSuccess = true;
    } catch (writeError1) {
      console.error('Error with standard write:', writeError1);
      
      // Strategy 2: Write to temp file then move
      try {
        const tempPath = `${dbPath}.temp`;
        await fs.writeJson(tempPath, data, { spaces: 2 });
        await fs.move(tempPath, dbPath, { overwrite: true });
        console.log('Successfully wrote database file using temp file strategy');
        writeSuccess = true;
      } catch (writeError2) {
        console.error('Error with temp file strategy:', writeError2);
        
        // Strategy 3: Direct file write with fs.writeFileSync
        try {
          fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
          console.log('Successfully wrote database file using sync write');
          writeSuccess = true;
        } catch (writeError3) {
          console.error('Error with sync write:', writeError3);
          
          // We've tried all strategies and failed
          throw new Error('All write strategies failed');
        }
      }
    }
    
    // If we successfully wrote the file, verify the data was written correctly
    if (writeSuccess) {
      try {
        // Double-check by reading the file again
        const verifyData = await fs.readJson(dbPath);
        let verifiedWrongAnswers = 0;
        
        for (const result of results.filter(r => !r.wasCorrect && !r.dontKnow && r.answerDetails)) {
          if (verifyData.students[result.studentId] && 
              verifyData.students[result.studentId].wrongAnswers && 
              verifyData.students[result.studentId].wrongAnswers.length > 0) {
            verifiedWrongAnswers++;
          }
        }
        console.log(`Verified ${verifiedWrongAnswers} students with wrong answers in the database`);
      } catch (verifyError) {
        console.error('Error verifying database file:', verifyError);
        // We still consider this a success since we did write the file
      }
    }
    
    console.log('Batch results recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording batch results:', error);
    
    // If we have the data in memory but couldn't write it, try to save it to a fallback location
    if (data !== null) {
      try {
        const errorPath = `${dbPath}.error-${Date.now()}.json`;
        await fs.writeJson(errorPath, data, { spaces: 2 });
        console.log(`Saved data to error file: ${errorPath}`);
      } catch (fallbackError) {
        console.error('Could not save to fallback location:', fallbackError);
      }
    }
    
    throw error;
  }
}

/**
 * Reset all student performance data
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function resetAllPerformance() {
  try {
    await initDb();
    await fs.writeJson(dbPath, { students: {} }, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error resetting performance data:', error);
    throw error;
  }
}

module.exports = {
  initDb,
  getAllPerformanceData,
  getStudentPerformance,
  recordResult,
  recordBatchResults,
  resetAllPerformance
};