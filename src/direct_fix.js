const fs = require('fs').promises;
const path = require('path');

async function directFix() {
  try {
    // Read data directly
    console.log('Reading student data files...');
    const studentsJsonPath = path.join(__dirname, '../data/students.json');
    const studentsData = JSON.parse(await fs.readFile(studentsJsonPath, 'utf8'));
    
    // Find Sander's index
    let sanderIndex = -1;
    for (let i = 0; i < studentsData.students.length; i++) {
      const student = studentsData.students[i];
      if (student.firstName === 'Sander' && student.lastName.includes('hondt')) {
        sanderIndex = i;
        break;
      }
    }
    
    if (sanderIndex === -1) {
      console.log('Could not find Sander in students data');
      return;
    }
    
    // Add education and experience data directly
    console.log(`Found Sander at index ${sanderIndex}`);
    
    studentsData.students[sanderIndex].education = [
      "Master in Computer Science Engineering, Ghent University, Ghent, Belgium",
      "MSc in Finance, Vlerick Business School, Ghent, Belgium"
    ];
    
    studentsData.students[sanderIndex].experience = [
      "Touring, 2020-2023, Insurance Analyst",
      "Touring, 2023-present, Project Lead IT & Supply Chain Optimization",
      "Start-up mentor (Moonshake, Oper), 2023-present"
    ];
    
    // Write the updated data back
    await fs.writeFile(studentsJsonPath, JSON.stringify(studentsData, null, 2), 'utf8');
    
    console.log('Successfully updated Sander\'s data');
    
  } catch (error) {
    console.error('Error during direct fix:', error);
  }
}

directFix();