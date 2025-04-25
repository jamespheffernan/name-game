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

// Create a mapping from old performance data to student by image path
// Since the image paths should be consistent across databases
const imagePathToStudentId = {};
studentsData.students.forEach(student => {
  // Get image number from path (e.g., "/uploads/student-images/student_42.png" -> 42)
  const match = student.imagePath.match(/student_(\d+)\.png$/);
  if (match && match[1]) {
    const imageNumber = parseInt(match[1], 10);
    imagePathToStudentId[imageNumber] = student.id;
  }
});

// Determine which students have performance data
const performanceStudentIds = Object.keys(performanceData.students);

// Extract performance data indexed by old ID suffix
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

// Now map to new student IDs based on image number
// Performance data was likely indexed by page with 16 students per page (0-15)
let successCount = 0;
let failureCount = 0;

// In this simplified approach, we'll map each performance data index to the 
// corresponding student by image number (assuming regular ordering)
// For example, if student_1.png corresponds to index 0, student_2.png to index 1, etc.
for (let i = 1; i <= studentsData.students.length; i++) {
  const imageNumber = i;
  const studentId = imagePathToStudentId[imageNumber];
  
  if (!studentId) {
    console.log(`No student found for image number ${imageNumber}`);
    continue;
  }
  
  // The index in the performance data is i-1 (0-based)
  const performanceIndex = (i - 1) % 16;
  
  // If there are multiple timestamps with the same index, we need to handle that
  // For simplicity, we'll use the first record for each index
  if (performanceByIndex[performanceIndex] && performanceByIndex[performanceIndex].length > 0) {
    const oldRecord = performanceByIndex[performanceIndex][0];
    remappedPerformance.students[studentId] = oldRecord.data;
    successCount++;
  } else {
    failureCount++;
  }
}

// Save the remapped data
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(remappedPerformance, null, 2));

console.log(`Remapping complete.`);
console.log(`Original performance records: ${performanceStudentIds.length}`);
console.log(`Successfully remapped: ${successCount}`);
console.log(`Failed to remap: ${failureCount}`);
console.log(`Total students: ${studentsData.students.length}`);
console.log(`Saved to: ${OUTPUT_PATH}`);