const fs = require('fs').promises;
const path = require('path');

async function updateStudentsWithEducationAndExperience() {
  try {
    // Read both data files
    console.log('Reading student data files...');
    const studentsData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/students.json'), 'utf8'));
    const newStudentData = JSON.parse(await fs.readFile(path.join(__dirname, '../data/new student data.json'), 'utf8'));
    
    console.log(`Found ${studentsData.students.length} students in students.json`);
    console.log(`Found ${newStudentData.length} students in new student data.json`);
    
    // Create a backup of students.json before modifying
    await fs.writeFile(
      path.join(__dirname, '../data/students_backup_before_education_experience.json'),
      JSON.stringify(studentsData, null, 2),
      'utf8'
    );
    console.log('Created backup of students.json');
    
    // Map the new student data by name for easy lookup
    const newDataByName = {};
    newStudentData.forEach(student => {
      newDataByName[student.name.toLowerCase()] = student;
    });
    
    // Count successful updates
    let updatedCount = 0;
    let missingCount = 0;
    let missingNames = [];
    
    // Update each student in the students.json data
    studentsData.students.forEach(student => {
      const fullNameLower = student.fullName.toLowerCase();
      
      if (newDataByName[fullNameLower]) {
        // Add education and experience as separate properties
        student.education = newDataByName[fullNameLower].education || [];
        student.experience = newDataByName[fullNameLower].experience || [];
        updatedCount++;
      } else {
        // Try to match by first and last name separately
        const firstLastFormat = `${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`;
        
        if (newDataByName[firstLastFormat]) {
          student.education = newDataByName[firstLastFormat].education || [];
          student.experience = newDataByName[firstLastFormat].experience || [];
          updatedCount++;
        } else {
          // Try matching with name variations
          const foundMatch = Object.keys(newDataByName).find(name => {
            return name.includes(student.firstName.toLowerCase()) && 
                   name.includes(student.lastName.toLowerCase());
          });
          
          if (foundMatch) {
            student.education = newDataByName[foundMatch].education || [];
            student.experience = newDataByName[foundMatch].experience || [];
            updatedCount++;
          } else {
            // No match found
            student.education = [];
            student.experience = [];
            missingCount++;
            missingNames.push(student.fullName);
          }
        }
      }
    });
    
    // Write the updated data back to students.json
    await fs.writeFile(
      path.join(__dirname, '../data/students.json'),
      JSON.stringify(studentsData, null, 2),
      'utf8'
    );
    
    console.log(`Updated ${updatedCount} students with education and experience data`);
    console.log(`${missingCount} students had no matching data and received empty arrays`);
    
    if (missingNames.length > 0) {
      console.log('Students with no matching data:');
      missingNames.forEach(name => console.log(` - ${name}`));
      await fs.writeFile(
        path.join(__dirname, '../data/unmatched_students_education.json'),
        JSON.stringify(missingNames, null, 2),
        'utf8'
      );
    }
    
    console.log('Education and experience data update complete!');
    
  } catch (error) {
    console.error('Error updating students with education and experience:', error);
  }
}

updateStudentsWithEducationAndExperience();