/**
 * Script to update students with preferred names from the TSV file
 */
const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

async function updatePreferredNames() {
  try {
    // Read TSV file
    const tsvPath = path.join(__dirname, '../preferred names.tsv');
    const tsvContent = await fs.readFile(tsvPath, 'utf8');
    
    // Parse TSV content
    const lines = tsvContent.trim().split('\n');
    const headers = lines[0].split('\t');
    
    // Find column indices
    const familyNameIndex = headers.indexOf('Family Name');
    const firstNameIndex = headers.indexOf('First Name');
    const preferredNameIndex = headers.indexOf('Preferred Name');
    
    if (familyNameIndex === -1 || firstNameIndex === -1 || preferredNameIndex === -1) {
      throw new Error('Required columns not found in TSV file');
    }
    
    // Get all students from the database
    const students = await studentDb.getAllStudents();
    console.log(`Loaded ${students.length} students from database`);
    
    // Process each line in the TSV (skip header)
    const updatedStudents = [];
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split('\t');
      const familyName = columns[familyNameIndex].trim();
      const firstName = columns[firstNameIndex].trim();
      const preferredName = columns[preferredNameIndex].trim();
      
      // Skip if preferred name is the same as first name or empty
      if (!preferredName || preferredName === firstName) {
        continue;
      }
      
      // Find matching student in database
      const student = students.find(s => {
        // Check if last name contains family name (some last names have multiple parts)
        const lastNameMatches = s.lastName.toLowerCase().includes(familyName.toLowerCase());
        
        // Check if first name starts with the same word as first name in TSV
        // or if the first word of fullName matches first name from TSV
        const firstNameDb = s.firstName.toLowerCase();
        const firstWordOfFullName = s.fullName.split(' ')[0].toLowerCase();
        const firstNameMatches = 
          firstNameDb === firstName.toLowerCase() || 
          firstWordOfFullName === firstName.toLowerCase();
        
        return lastNameMatches && firstNameMatches;
      });
      
      if (student) {
        // Check if preferred name is already part of the student's first name
        const firstNameLower = student.firstName.toLowerCase();
        if (firstNameLower === preferredName.toLowerCase() || 
            firstNameLower.includes(preferredName.toLowerCase())) {
          continue; // Skip if preferred name is already included
        }
        
        // Various checks for redundant names
        const fullNameWithoutQuotes = `${student.firstName} ${student.lastName}`.toLowerCase();
        const preferredPlusLastName = `${preferredName} ${familyName}`.toLowerCase();
        const isExactFullNameMatch = fullNameWithoutQuotes === preferredPlusLastName;
        const isFirstNameLastNameCombo = preferredName.toLowerCase() === `${student.firstName.toLowerCase()} ${student.lastName.toLowerCase()}`;
        
        // Check if preferred name + last name is just their full name, or if preferred name itself is their full name
        if (isExactFullNameMatch || isFirstNameLastNameCombo) {
          console.log(`Skipping redundant preferred name '${preferredName}' for ${student.fullName}`);
          continue;
        }
        
        // Skip if preferred name matches the format "First Last"
        if (preferredName.toLowerCase().includes(familyName.toLowerCase())) {
          console.log(`Skipping redundant preferred name '${preferredName}' for ${student.fullName}`);
          continue;
        }
        
        // Add preferred name to student object
        student.preferredName = preferredName;
        
        // Update fullName format with preferred name in quotes
        student.fullName = `${student.firstName} '${preferredName}' ${student.lastName}`;
        
        updatedStudents.push(student);
        console.log(`Adding preferred name '${preferredName}' to ${student.firstName} ${student.lastName}`);
      }
    }
    
    // Save updates to database, one student at a time
    console.log(`Updating ${updatedStudents.length} students with preferred names`);
    
    for (const student of updatedStudents) {
      await studentDb.updateStudent(student.id, {
        preferredName: student.preferredName,
        fullName: student.fullName
      });
    }
    
    console.log('Preferred names have been successfully updated.');
  } catch (error) {
    console.error('Error updating preferred names:', error);
  }
}

// Run the update function
updatePreferredNames()
  .then(() => {
    console.log('Script completed successfully.');
  })
  .catch(err => {
    console.error('Script failed:', err);
  });