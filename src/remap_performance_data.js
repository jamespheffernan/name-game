const fs = require('fs');
const path = require('path');

// Paths to data files
const STUDENTS_PATH = path.join(__dirname, '../data/students.json');
const PERFORMANCE_PATH = path.join(__dirname, '../data/student_performance.json');
const OUTPUT_PATH = path.join(__dirname, '../data/student_performance_remapped.json');

// Load data
const studentsData = JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
const performanceData = JSON.parse(fs.readFileSync(PERFORMANCE_PATH, 'utf8'));

// Create the new performance data structure
const remappedPerformance = {
  students: {}
};

// Get all performance student IDs
const performanceStudentIds = Object.keys(performanceData.students);

// Map the old IDs to the new IDs based on index
// This mapping needs to be more sophisticated than just a direct index match
// because the old IDs have varied timestamp prefixes
let successCount = 0;
let failureCount = 0;

// Organize performance data by index
const performanceByIndex = {};
performanceStudentIds.forEach(oldId => {
  const match = oldId.match(/_(\d+)$/);
  if (match && match[1]) {
    const index = parseInt(match[1], 10);
    performanceByIndex[index] = performanceByIndex[index] || [];
    performanceByIndex[index].push({
      id: oldId,
      data: performanceData.students[oldId]
    });
  }
});

// Map to new students
studentsData.students.forEach((student, index) => {
  const newId = student.id;
  // Extract index from new ID
  const match = newId.match(/_(\d+)$/);
  if (match && match[1]) {
    const newIndex = parseInt(match[1], 10);
    
    // Check if we have performance data for this index
    if (performanceByIndex[newIndex] && performanceByIndex[newIndex].length > 0) {
      // Take the first record (if multiple)
      const oldRecord = performanceByIndex[newIndex].shift();
      remappedPerformance.students[newId] = oldRecord.data;
      successCount++;
    } else {
      failureCount++;
    }
  }
});

// Save the remapped data
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(remappedPerformance, null, 2));

console.log(`Remapping complete.`);
console.log(`Original performance records: ${performanceStudentIds.length}`);
console.log(`Successfully remapped: ${successCount}`);
console.log(`Failed to remap: ${failureCount}`);
console.log(`Total students: ${studentsData.students.length}`);
console.log(`Saved to: ${OUTPUT_PATH}`);