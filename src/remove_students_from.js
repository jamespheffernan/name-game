#!/usr/bin/env node

/**
 * This script removes students starting from a specific index
 * Usage: node remove_students_from.js <start_index>
 * Example: node remove_students_from.js 80
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

// Get command line arguments
const startIndex = parseInt(process.argv[2], 10);

if (isNaN(startIndex)) {
  console.error('Usage: node remove_students_from.js <start_index>');
  console.error('Example: node remove_students_from.js 80');
  process.exit(1);
}

async function removeStudentsFrom() {
  try {
    console.log(`Removing students starting from index ${startIndex}...`);
    
    // Get all students
    const allStudents = await studentDb.getAllStudents();
    console.log(`Total students in database: ${allStudents.length}`);
    
    if (startIndex >= allStudents.length) {
      console.log('Start index is greater than or equal to the number of students. Nothing to remove.');
      return;
    }
    
    // Get the students to keep and the ones to remove
    const studentsToKeep = allStudents.slice(0, startIndex);
    const studentsToRemove = allStudents.slice(startIndex);
    
    console.log(`Keeping ${studentsToKeep.length} students, removing ${studentsToRemove.length} students.`);
    
    // Remove the image files for the students being removed
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    
    for (const student of studentsToRemove) {
      // Extract the filename from the imagePath
      const imagePath = student.imagePath;
      if (imagePath) {
        const filename = path.basename(imagePath);
        const filePath = path.join(studentImagesDir, filename);
        
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          console.log(`Removed image file: ${filename}`);
        }
      }
    }
    
    // Reset the database with only the students to keep
    await studentDb.flushDb();
    if (studentsToKeep.length > 0) {
      await studentDb.addStudents(studentsToKeep);
    }
    
    console.log(`Successfully removed students. Now have ${studentsToKeep.length} students in the database.`);
  } catch (error) {
    console.error('Error removing students:', error);
    process.exit(1);
  }
}

// Run the function
removeStudentsFrom().then(() => {
  console.log('Done removing students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});