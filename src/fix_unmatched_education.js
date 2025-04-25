const fs = require('fs').promises;
const path = require('path');

async function fixUnmatchedEducation() {
  try {
    // Read both data files
    console.log('Reading student data files...');
    const studentsData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/students.json'), 'utf8'));
    const newStudentData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/new student data.json'), 'utf8'));
    
    // Create mapping for specific unmatched students
    const specialMapping = {
      'Katie Bradﬁeld': 'Katie Bradfield',
      'Sander D\'hondt': 'Sander D\'hondt', // Exact match but might be encoding issue
      'Jean Paul Lou Schwenk': 'Jean Paul Lou Schwank'
    };
    
    // Create new data lookup
    const newDataByName = {};
    newStudentData.forEach(student => {
      newDataByName[student.name] = student;
    });
    
    // Fix each unmatched student
    let fixedCount = 0;
    
    studentsData.students.forEach(student => {
      if (student.education.length === 0 && specialMapping[student.fullName]) {
        const matchName = specialMapping[student.fullName];
        if (newDataByName[matchName]) {
          student.education = newDataByName[matchName].education || [];
          student.experience = newDataByName[matchName].experience || [];
          console.log(`Fixed match for ${student.fullName} using ${matchName}`);
          fixedCount++;
        }
      }
    });
    
    // Write the updated data back to students.json
    await fs.writeFile(
      path.join(__dirname, '../data/students.json'),
      JSON.stringify(studentsData, null, 2),
      'utf8'
    );
    
    console.log(`Fixed ${fixedCount} previously unmatched students`);
    console.log('Manual fix complete!');
    
  } catch (error) {
    console.error('Error fixing unmatched students:', error);
  }
}

fixUnmatchedEducation();