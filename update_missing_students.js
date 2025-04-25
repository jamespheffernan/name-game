const fs = require('fs-extra');
const path = require('path');

// Paths to data files
const STUDENTS_DB_PATH = path.join(__dirname, 'data/students.json');
const NEW_DATA_PATH = path.join(__dirname, 'data/new student data.json');

/**
 * Main function to update previously unmatched students
 */
async function updateMissingStudents() {
  try {
    // Load current student database
    console.log('Loading existing student database...');
    const studentsDb = await fs.readJson(STUDENTS_DB_PATH);
    
    // Load new student data
    console.log('Loading new student data...');
    const newStudentData = await fs.readJson(NEW_DATA_PATH);
    
    // Make a backup of the current database
    const backupPath = path.join(__dirname, `data/students_backup_missing_${Date.now()}.json`);
    console.log(`Creating backup at ${backupPath}`);
    await fs.writeJson(backupPath, studentsDb, { spaces: 2 });
    
    // Mappings of unmatched students from new data to database ids
    const mappings = [
      { newName: "Katie Bradfield", dbId: "student_1742953408354_21" },
      { newName: "Yun-Hsin Chen", dbId: "student_1742953408354_32" },
      { newName: "Sander D'hondt", dbId: "student_1742953408354_47" },
      { newName: "Anthony Fencl", dbId: "student_1742953408354_61" },
      { newName: "Shuo Han", dbId: "student_1742953408354_76" },
      { newName: "Robin Haakon Hedley", dbId: "student_1742953408354_81" },
      { newName: "Chanavi Jarutas", dbId: "student_1742953408354_99" },
      { newName: "Jeongah Kim", dbId: "student_1742953408354_111" },
      { newName: "Passavich Nalamlieng (Flint)", dbId: "student_1742953408354_147" },
      { newName: "Jean Paul Lou Schwank", dbId: "student_1742953408354_190" },
      { newName: "Thanadej Thovaravirut", dbId: "student_1742953408354_213" },
      { newName: "Lei Wang", dbId: "student_1742953408354_222" },
      { newName: "Zhaoyu Zhang", dbId: "student_1742953408354_240" }
    ];
    
    // Process each mapping
    for (const mapping of mappings) {
      const { newName, dbId } = mapping;
      
      // Find the student in the new data
      const newStudentInfo = newStudentData.find(s => s.name === newName);
      if (!newStudentInfo) {
        console.log(`Could not find student with name "${newName}" in new data`);
        continue;
      }
      
      // Find the student in the database
      const dbStudentIndex = studentsDb.students.findIndex(s => s.id === dbId);
      if (dbStudentIndex === -1) {
        console.log(`Could not find student with ID "${dbId}" in the database`);
        continue;
      }
      
      const dbStudent = studentsDb.students[dbStudentIndex];
      console.log(`Updating student: ${dbStudent.fullName} (ID: ${dbId})`);
      
      // Add new tags, but don't overwrite existing ones
      if (!dbStudent.tags) {
        dbStudent.tags = [];
      }
      
      // Add nationality as a tag if it exists
      if (newStudentInfo.nationality) {
        // Split multiple nationalities
        const nationalities = newStudentInfo.nationality.split('/');
        
        for (let nationality of nationalities) {
          nationality = nationality.trim().toLowerCase();
          
          // Add nationality as a tag
          const nationalityTag = `nationality:${nationality}`;
          if (!dbStudent.tags.includes(nationalityTag)) {
            dbStudent.tags.push(nationalityTag);
            console.log(`  Added nationality tag: ${nationalityTag}`);
          }
        }
      }
      
      // Add languages as tags
      if (newStudentInfo.languages && Array.isArray(newStudentInfo.languages)) {
        for (let language of newStudentInfo.languages) {
          language = language.trim().toLowerCase();
          
          // Add language as a tag
          const languageTag = `language:${language}`;
          if (!dbStudent.tags.includes(languageTag)) {
            dbStudent.tags.push(languageTag);
            console.log(`  Added language tag: ${languageTag}`);
          }
        }
      }
      
      // Store email if it's not already there
      if (newStudentInfo.email && !dbStudent.email) {
        dbStudent.email = newStudentInfo.email;
        console.log(`  Added email: ${newStudentInfo.email}`);
      }
      
      // Update the student in the database
      studentsDb.students[dbStudentIndex] = dbStudent;
    }
    
    // Save the updated database
    console.log('\nSaving updated student database...');
    await fs.writeJson(STUDENTS_DB_PATH, studentsDb, { spaces: 2 });
    console.log('Database updated successfully');
    
  } catch (error) {
    console.error('Error updating missing students:', error);
  }
}

// Execute the update function
updateMissingStudents().then(() => {
  console.log('Finished updating missing students');
}).catch(err => {
  console.error('Error in main execution:', err);
});