const fs = require('fs');
const path = require('path');

// Paths to data files
const STUDENTS_PATH = path.join(__dirname, '../data/students.json');
const PERFORMANCE_PATH = path.join(__dirname, '../data/student_performance.json');
const BACKUP_PATH = path.join(__dirname, '../data/student_performance_backup.json');

// Load data
const studentsData = JSON.parse(fs.readFileSync(STUDENTS_PATH, 'utf8'));
const performanceData = JSON.parse(fs.readFileSync(PERFORMANCE_PATH, 'utf8'));
const backupData = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));

// Create a mapping from image number to student
const imageToStudent = {};
studentsData.students.forEach(student => {
  const match = student.imagePath.match(/student_(\d+)\.png$/);
  if (match && match[1]) {
    const imageNumber = parseInt(match[1], 10);
    imageToStudent[imageNumber] = {
      id: student.id,
      name: student.fullName
    };
  }
});

// Verify the mapping for a few students
console.log("Verification of Performance Data Remapping:");
console.log("===========================================");

// Check a few random students
const sampleSize = 10;
const studentIds = Object.keys(performanceData.students);
const randomIds = [];

// Get random sample of student IDs
for (let i = 0; i < sampleSize; i++) {
  const randomIndex = Math.floor(Math.random() * studentIds.length);
  randomIds.push(studentIds[randomIndex]);
}

// Verify each random student
randomIds.forEach(studentId => {
  // Find this student in the students data
  const student = studentsData.students.find(s => s.id === studentId);
  if (!student) {
    console.log(`❌ Student ID ${studentId} not found in students database`);
    return;
  }
  
  // Get the image number for this student
  const imageMatch = student.imagePath.match(/student_(\d+)\.png$/);
  if (!imageMatch || !imageMatch[1]) {
    console.log(`❌ Could not extract image number for ${student.fullName}`);
    return;
  }
  
  const imageNumber = parseInt(imageMatch[1], 10);
  
  // Get old performance data index (0-15 for each group of 16 students)
  const oldIndex = (imageNumber - 1) % 16;
  
  // Find old performance records for this index
  const oldPerformanceIds = Object.keys(backupData.students).filter(id => {
    const match = id.match(/_(\d+)$/);
    return match && parseInt(match[1], 10) === oldIndex;
  });
  
  // Get one old performance record (first one)
  const oldPerformanceId = oldPerformanceIds[0];
  const oldPerformance = oldPerformanceId ? backupData.students[oldPerformanceId] : null;
  
  // Get new performance for this student
  const newPerformance = performanceData.students[studentId];
  
  console.log(`Student: ${student.fullName} (ID: ${student.id}, Image: ${imageNumber})`);
  console.log(`Old Performance Index: ${oldIndex}`);
  
  if (oldPerformance && newPerformance) {
    // Compare correctCount as a simple verification
    if (oldPerformance.correctCount === newPerformance.correctCount) {
      console.log(`✅ Correct count matches: ${oldPerformance.correctCount}`);
    } else {
      console.log(`❌ Correct count mismatch: Old: ${oldPerformance.correctCount}, New: ${newPerformance.correctCount}`);
    }
    
    // Compare successRate as another verification
    if (oldPerformance.successRate === newPerformance.successRate) {
      console.log(`✅ Success rate matches: ${oldPerformance.successRate}`);
    } else {
      console.log(`❌ Success rate mismatch: Old: ${oldPerformance.successRate}, New: ${newPerformance.successRate}`);
    }
  } else {
    console.log(`❌ Performance data missing. Old: ${oldPerformance ? 'Found' : 'Missing'}, New: ${newPerformance ? 'Found' : 'Missing'}`);
  }
  
  console.log("-------------------");
});

// Overall statistics
console.log("\nOverall Statistics:");
console.log(`Total students: ${studentsData.students.length}`);
console.log(`Students with performance data: ${Object.keys(performanceData.students).length}`);
console.log(`Original performance records: ${Object.keys(backupData.students).length}`);

// Check if any students are missing performance data
const missingPerformance = studentsData.students.filter(student => 
  !performanceData.students[student.id]
).length;

console.log(`Students missing performance data: ${missingPerformance}`);

if (missingPerformance === 0) {
  console.log("✅ All students have performance data successfully mapped!");
} else {
  console.log("❌ Some students are missing performance data.");
}