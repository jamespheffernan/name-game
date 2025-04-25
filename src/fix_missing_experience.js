const fs = require('fs').promises;
const path = require('path');

async function fixMissingExperience() {
  try {
    // Read data directly
    console.log('Reading student data files...');
    const studentsJsonPath = path.join(__dirname, '../data/students.json');
    const studentsData = JSON.parse(await fs.readFile(studentsJsonPath, 'utf8'));
    
    // Find students with empty experience arrays
    let fixCount = 0;
    
    for (let i = 0; i < studentsData.students.length; i++) {
      const student = studentsData.students[i];
      
      // Check if experience is empty
      if (Array.isArray(student.experience) && student.experience.length === 0) {
        // Add a placeholder
        student.experience = ["No previous work experience"];
        console.log(`Added placeholder experience for: ${student.fullName}`);
        fixCount++;
      }
    }
    
    // Write the updated data back
    await fs.writeFile(studentsJsonPath, JSON.stringify(studentsData, null, 2), 'utf8');
    
    console.log(`Successfully updated ${fixCount} students with placeholder experience data`);
    
  } catch (error) {
    console.error('Error during experience fix:', error);
  }
}

fixMissingExperience();