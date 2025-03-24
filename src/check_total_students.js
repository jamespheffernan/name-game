#!/usr/bin/env node

/**
 * This script checks the total number of students in the database
 */

const studentDb = require('./models/studentDb');

async function checkTotalStudents() {
  try {
    const students = await studentDb.getAllStudents();
    console.log(`Total students in database: ${students.length}`);
    
    // Print first and last few for verification
    console.log('\nFirst 5 students:');
    for (let i = 0; i < Math.min(5, students.length); i++) {
      const student = students[i];
      console.log(`${i+1}. ${student.fullName}`);
    }
    
    console.log('\nLast 5 students:');
    for (let i = Math.max(0, students.length - 5); i < students.length; i++) {
      const student = students[i];
      console.log(`${i+1}. ${student.fullName}`);
    }
  } catch (error) {
    console.error('Error checking students:', error);
    process.exit(1);
  }
}

// Run the function
checkTotalStudents().then(() => {
  console.log('Done checking students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});