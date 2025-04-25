const fs = require('fs');
const readline = require('readline');

// Load student data
const studentsPath = './data/students.json';
let data = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
const students = data.students;

// Setup interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Track current student index
let currentIndex = 0;
const totalStudents = students.length;
let skippedStudents = [];

// Check if student already has a gender tag
function hasGenderTag(student) {
  return student.tags.some(tag => tag === 'male' || tag === 'female');
}

// Skip already tagged students
while (currentIndex < totalStudents && hasGenderTag(students[currentIndex])) {
  currentIndex++;
}

// Display student info and prompt for gender
function processStudent() {
  if (currentIndex >= totalStudents) {
    if (skippedStudents.length > 0) {
      console.log(`\nAll students processed! You skipped ${skippedStudents.length} students.`);
      console.log('Skipped students:');
      skippedStudents.forEach(index => {
        console.log(`- ${students[index].fullName} (ID: ${students[index].id})`);
      });
    } else {
      console.log('\nAll students have been tagged with gender!');
    }
    saveData();
    rl.close();
    return;
  }

  const student = students[currentIndex];
  const progress = `[${currentIndex + 1}/${totalStudents}]`;
  
  console.clear();
  console.log(`${progress} Tagging student: ${student.fullName}`);
  if (student.preferredName) {
    console.log(`Preferred name: ${student.preferredName}`);
  }
  console.log(`Image: ${student.imagePath}`);
  console.log('\nCommands:');
  console.log('m - Tag as male');
  console.log('f - Tag as female');
  console.log('s - Skip for now');
  console.log('q - Save and quit');
  console.log('\nEnter gender (m/f) or command:');
  
  rl.question('> ', (answer) => {
    switch (answer.toLowerCase()) {
      case 'm':
        tagStudent(student, 'male');
        currentIndex++;
        while (currentIndex < totalStudents && hasGenderTag(students[currentIndex])) {
          currentIndex++;
        }
        break;
      case 'f':
        tagStudent(student, 'female');
        currentIndex++;
        while (currentIndex < totalStudents && hasGenderTag(students[currentIndex])) {
          currentIndex++;
        }
        break;
      case 's':
        skippedStudents.push(currentIndex);
        currentIndex++;
        while (currentIndex < totalStudents && hasGenderTag(students[currentIndex])) {
          currentIndex++;
        }
        break;
      case 'q':
        saveData();
        rl.close();
        return;
      default:
        console.log('Invalid command. Use m (male), f (female), s (skip), or q (quit)');
        setTimeout(processStudent, 1500);
        return;
    }
    
    saveData();
    processStudent();
  });
}

// Tag a student with gender
function tagStudent(student, gender) {
  if (!student.tags.includes(gender)) {
    student.tags.push(gender);
    console.log(`Tagged ${student.fullName} as ${gender}`);
  }
}

// Save data back to file
function saveData() {
  const backupPath = `${studentsPath}.backup`;
  
  // Create backup first
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, fs.readFileSync(studentsPath));
  }
  
  // Save updated data
  fs.writeFileSync(studentsPath, JSON.stringify(data, null, 2));
  console.log('Data saved successfully!');
}

console.log('Gender Tagging Tool');
console.log('==================');
console.log(`Found ${totalStudents} students in the database.`);

// Start the process
processStudent();