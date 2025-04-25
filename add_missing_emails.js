const fs = require('fs-extra');
const path = require('path');

// Paths to data files
const STUDENTS_DB_PATH = path.join(__dirname, 'data/students.json');
const NEW_DATA_PATH = path.join(__dirname, 'data/new student data.json');

// Manual mapping for students that couldn't be matched automatically
const manualEmailMapping = {
  // Add these mappings based on the 13 students that weren't matched
  // Format: "student_id": "email_from_new_data"
  "student_1742953408354_90": "ai300@jbs.cam.ac.uk",     // Tom Jia
  "student_1742953408354_95": "ak2566@jbs.cam.ac.uk",    // Arushi Kejriwal
  "student_1742953408354_97": "mk2133@jbs.cam.ac.uk",    // Mira Khan
  "student_1742953408354_107": "ml2014@jbs.cam.ac.uk",   // Minnie Lei
  "student_1742953408354_110": "cl2003@jbs.cam.ac.uk",   // Carlson Lim
  "student_1742953408354_148": "lp763@jbs.cam.ac.uk",    // Ling Poon
  "student_1742953408354_164": "as3690@jbs.cam.ac.uk",   // Jianyu Shi
  "student_1742953408354_167": "ss3252@jbs.cam.ac.uk",   // Sheraz Shibli
  "student_1742953408354_173": "ms3072@jbs.cam.ac.uk",   // Morgan Solnick
  "student_1742953408354_192": "vt442@jbs.cam.ac.uk",    // Vinci Tsang
  "student_1742953408354_193": "pt520@jbs.cam.ac.uk",    // Prerna Tyagi
  "student_1742953408354_208": "nw445@jbs.cam.ac.uk",    // Nicholas Wong
  "student_1742953408354_213": "cy408@jbs.cam.ac.uk"     // Clark Yung
};

/**
 * Main function to add missing emails manually
 */
async function addMissingEmails() {
  try {
    // Load current student database
    console.log('Loading existing student database...');
    const studentsDb = await fs.readJson(STUDENTS_DB_PATH);
    
    // Make a backup of the current database
    const backupPath = path.join(__dirname, `data/students_backup_${Date.now()}.json`);
    console.log(`Creating backup at ${backupPath}`);
    await fs.writeJson(backupPath, studentsDb, { spaces: 2 });
    
    // Count statistics
    let emailsAdded = 0;
    
    // Process each student in the database
    for (const student of studentsDb.students) {
      // Skip students that already have emails
      if (student.email) {
        continue;
      }
      
      // Check if we have a manual mapping for this student
      if (manualEmailMapping[student.id]) {
        // Add the email to the student record
        student.email = manualEmailMapping[student.id];
        emailsAdded++;
        console.log(`Added email for ${student.fullName}: ${manualEmailMapping[student.id]}`);
      }
    }
    
    // Save the updated database
    console.log('\nSaving updated student database...');
    await fs.writeJson(STUDENTS_DB_PATH, studentsDb, { spaces: 2 });
    
    // Log summary
    console.log(`\nManual Email Update Summary:
- ${emailsAdded} students had emails added manually`);
    
    console.log('Database updated successfully');
    
  } catch (error) {
    console.error('Error adding missing emails to students:', error);
  }
}

// Execute the function
addMissingEmails().then(() => {
  console.log('Finished adding missing emails to students');
}).catch(err => {
  console.error('Error in main execution:', err);
});