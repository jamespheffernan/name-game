const fs = require('fs-extra');
const path = require('path');
const stringSimilarity = require('string-similarity');

// Paths to data files
const STUDENTS_DB_PATH = path.join(__dirname, 'data/students.json');
const NEW_DATA_PATH = path.join(__dirname, 'data/new student data.json');

/**
 * Main function to add emails to student records
 */
async function addEmailsToStudents() {
  try {
    // Load current student database
    console.log('Loading existing student database...');
    const studentsDb = await fs.readJson(STUDENTS_DB_PATH);
    
    // Load new student data
    console.log('Loading new student data...');
    const newStudentData = await fs.readJson(NEW_DATA_PATH);
    
    // Make a backup of the current database
    const backupPath = path.join(__dirname, `data/students_backup_${Date.now()}.json`);
    console.log(`Creating backup at ${backupPath}`);
    await fs.writeJson(backupPath, studentsDb, { spaces: 2 });
    
    // Count statistics
    let emailsAdded = 0;
    let alreadyHadEmail = 0;
    let noMatchFound = 0;
    
    // Process each student in the database
    for (const student of studentsDb.students) {
      // Skip students that already have emails
      if (student.email) {
        alreadyHadEmail++;
        continue;
      }
      
      // Try to find a match in the new data
      const bestMatch = findBestMatch(student.fullName, newStudentData);
      
      if (bestMatch && bestMatch.email) {
        // Add the email to the student record
        student.email = bestMatch.email;
        emailsAdded++;
        console.log(`Added email for ${student.fullName}: ${bestMatch.email}`);
      } else {
        noMatchFound++;
      }
    }
    
    // Save the updated database
    console.log('\nSaving updated student database...');
    await fs.writeJson(STUDENTS_DB_PATH, studentsDb, { spaces: 2 });
    
    // Log summary
    console.log(`\nEmail Update Summary:
- ${emailsAdded} students had emails added
- ${alreadyHadEmail} students already had emails
- ${noMatchFound} students had no matching email found
- Total: ${studentsDb.students.length} students in database`);
    
    console.log('Database updated successfully');
    
  } catch (error) {
    console.error('Error adding emails to students:', error);
  }
}

/**
 * Find the best matching student in the new data
 * @param {string} fullName - Full name from existing database
 * @param {Array} newData - Array of new student data
 * @returns {Object|null} - Best match or null if no good match found
 */
function findBestMatch(fullName, newData) {
  // Normalize the name (remove extra spaces, lowercase)
  const normalizedName = fullName.trim().toLowerCase();
  
  // Prepare list of names for comparison
  const newDataNames = newData.map(entry => ({
    entry,
    name: entry.name.trim().toLowerCase()
  }));
  
  // Find the closest match
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of newDataNames) {
    const similarity = calculateNameSimilarity(normalizedName, entry.name);
    
    if (similarity > bestScore && similarity >= 0.7) { // Threshold for a good match
      bestScore = similarity;
      bestMatch = entry.entry;
    }
  }
  
  if (bestMatch) {
    return { ...bestMatch, score: bestScore };
  }
  
  return null;
}

/**
 * Calculate similarity between two names
 * More sophisticated than simple string similarity to handle name variations
 */
function calculateNameSimilarity(name1, name2) {
  // Simple Jaccard similarity for names
  const set1 = new Set(name1.split(' '));
  const set2 = new Set(name2.split(' '));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Simple string similarity as a base
  const stringSim = stringSimilarity.compareTwoStrings(name1, name2);
  
  // Word-level similarity
  const wordSim = intersection.size / union.size;
  
  // Combined score giving more weight to word-level matches
  return (wordSim * 0.7) + (stringSim * 0.3);
}

// Execute the function
addEmailsToStudents().then(() => {
  console.log('Finished adding emails to students');
}).catch(err => {
  console.error('Error in main execution:', err);
});