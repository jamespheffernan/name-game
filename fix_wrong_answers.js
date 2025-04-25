const fs = require('fs-extra');
const path = require('path');

// Path to the database file
const dbPath = path.join(__dirname, 'data/student_performance.json');
const backupPath = path.join(__dirname, 'data/student_performance_prefixed_backup.json');

async function fixWrongAnswers() {
  try {
    console.log('Loading database file:', dbPath);
    
    // Create a backup first
    await fs.copy(dbPath, backupPath);
    console.log('Created backup at:', backupPath);
    
    // Read the database
    const data = await fs.readJson(dbPath);
    console.log('Loaded database with', Object.keys(data.students).length, 'students');
    
    // Count students missing wrongAnswers array
    let missingWrongAnswers = 0;
    
    // Add wrongAnswers array to all students
    for (const studentId in data.students) {
      if (!data.students[studentId].wrongAnswers) {
        data.students[studentId].wrongAnswers = [];
        missingWrongAnswers++;
      }
    }
    
    console.log(`Found ${missingWrongAnswers} students missing wrongAnswers array`);
    
    // Write the fixed database back to the file
    await fs.writeJson(dbPath, data, { spaces: 2 });
    console.log('Successfully wrote fixed database file');
    
    // Verify the fix
    const verifyData = await fs.readJson(dbPath);
    let studentsWithWrongAnswers = 0;
    
    for (const studentId in verifyData.students) {
      if (verifyData.students[studentId].wrongAnswers) {
        studentsWithWrongAnswers++;
      }
    }
    
    console.log(`Verified that ${studentsWithWrongAnswers} out of ${Object.keys(verifyData.students).length} students now have wrongAnswers array`);
    
    // Final check
    if (studentsWithWrongAnswers === Object.keys(verifyData.students).length) {
      console.log('FIX SUCCESSFUL: All students now have wrongAnswers array');
    } else {
      console.error('FIX FAILED: Not all students have wrongAnswers array');
    }
  } catch (error) {
    console.error('Error fixing wrong answers:', error);
  }
}

// Run the fix
fixWrongAnswers();