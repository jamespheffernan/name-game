/**
 * Script to reset student names to firstName + lastName format
 */
const fs = require('fs-extra');
const path = require('path');

async function resetNames() {
  try {
    const dbPath = path.join(__dirname, '../data/students.json');
    const data = await fs.readJson(dbPath);
    
    // Reset all fullNames to firstName + lastName
    data.students = data.students.map(student => {
      student.fullName = `${student.firstName} ${student.lastName}`;
      if (student.preferredName) {
        delete student.preferredName;
      }
      return student;
    });
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    console.log('Reset all fullNames to default format');
  } catch (error) {
    console.error('Error resetting names:', error);
  }
}

resetNames()
  .then(() => {
    console.log('Script completed successfully.');
  })
  .catch(err => {
    console.error('Script failed:', err);
  });