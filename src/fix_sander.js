const fs = require('fs').promises;
const path = require('path');

async function fixSanderData() {
  try {
    // Read both data files
    console.log('Reading student data files...');
    const studentsData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/students.json'), 'utf8'));
    const newStudentData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/new student data.json'), 'utf8'));
    
    // Find Sander in new data
    let sanderNewData = null;
    for (const student of newStudentData) {
      if (student.name.includes('Sander') && student.name.includes('hondt')) {
        console.log(`Found Sander in new data: ${student.name}`);
        sanderNewData = student;
        break;
      }
    }
    
    if (!sanderNewData) {
      console.log('Could not find Sander in new data');
      return;
    }
    
    // Find Sander in students data
    let fixed = false;
    for (const student of studentsData.students) {
      if (student.firstName === 'Sander' && student.lastName === 'D\'hondt') {
        console.log(`Found Sander in students data: ${student.fullName}`);
        student.education = sanderNewData.education || [];
        student.experience = sanderNewData.experience || [];
        console.log('Updated Sander\'s education and experience data');
        fixed = true;
        break;
      }
    }
    
    if (!fixed) {
      console.log('Could not find Sander in students data');
      return;
    }
    
    // Write the updated data back to students.json
    await fs.writeFile(
      path.join(__dirname, '../data/students.json'),
      JSON.stringify(studentsData, null, 2),
      'utf8'
    );
    
    console.log('Fixed Sander\'s data successfully');
    
  } catch (error) {
    console.error('Error fixing Sander\'s data:', error);
  }
}

fixSanderData();