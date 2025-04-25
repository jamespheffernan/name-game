const fs = require('fs-extra');
const path = require('path');
const stringSimilarity = require('string-similarity');

// Paths to data files
const STUDENTS_DB_PATH = path.join(__dirname, 'data/students.json');
const NEW_DATA_PATH = path.join(__dirname, 'data/new student data.json');

/**
 * Main function to update students database with new tags
 */
async function updateStudentTags() {
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
    
    // Map of tag categories
    const tagCategories = {
      nationality: [], // Will store all unique nationalities
      languages: [],   // Will store all unique languages
      education: [],   // Will store education institutions (might be too many to be useful)
      experience: []   // Will store companies (might be too many to be useful)
    };
    
    // Count of students matched
    let matchCount = 0;
    let noMatchCount = 0;

    // Process each student in the new data
    for (const newStudentInfo of newStudentData) {
      // Find the best match in the existing database
      const bestMatch = findBestMatch(newStudentInfo.name, studentsDb.students);
      
      if (bestMatch) {
        matchCount++;
        console.log(`Matched: ${newStudentInfo.name} -> ${bestMatch.fullName} (Score: ${bestMatch.score.toFixed(2)})`);
        
        // Update the student with new tags
        updateStudentWithNewData(bestMatch, newStudentInfo, tagCategories);
      } else {
        noMatchCount++;
        console.log(`No match found for: ${newStudentInfo.name}`);
      }
    }
    
    // Log summary statistics of tag categories
    console.log('\nTag Categories Summary:');
    for (const [category, tags] of Object.entries(tagCategories)) {
      console.log(`${category}: ${tags.length} unique values`);
      // Show examples (first 5)
      if (tags.length > 0) {
        console.log(`  Examples: ${tags.slice(0, 5).join(', ')}${tags.length > 5 ? '...' : ''}`);
      }
    }
    
    console.log(`\nMatched ${matchCount} students, could not match ${noMatchCount} students`);
    
    // Save the updated database
    console.log('\nSaving updated student database...');
    await fs.writeJson(STUDENTS_DB_PATH, studentsDb, { spaces: 2 });
    console.log('Database updated successfully');
    
  } catch (error) {
    console.error('Error updating student tags:', error);
  }
}

/**
 * Find the best matching student in the existing database
 * @param {string} name - Name from the new data
 * @param {Array} existingStudents - Array of existing students
 * @returns {Object|null} - Best match or null if no good match found
 */
function findBestMatch(name, existingStudents) {
  // Normalize the name (remove extra spaces, lowercase)
  const normalizedName = name.trim().toLowerCase();
  
  // Prepare list of names for comparison
  const existingNames = existingStudents.map(student => ({
    student,
    name: student.fullName.trim().toLowerCase()
  }));
  
  // Find the closest match
  let bestMatch = null;
  let bestScore = 0;
  
  for (const entry of existingNames) {
    const similarity = calculateNameSimilarity(normalizedName, entry.name);
    
    if (similarity > bestScore && similarity >= 0.7) { // Threshold for a good match
      bestScore = similarity;
      bestMatch = entry.student;
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

/**
 * Update a student record with new data
 * @param {Object} student - Existing student record
 * @param {Object} newData - New data for the student
 * @param {Object} tagCategories - Running collection of tag categories
 */
function updateStudentWithNewData(student, newData, tagCategories) {
  // Add new tags, but don't overwrite existing ones
  if (!student.tags) {
    student.tags = [];
  }
  
  // Add nationality as a tag if it exists
  if (newData.nationality) {
    // Split multiple nationalities
    const nationalities = newData.nationality.split('/');
    
    for (let nationality of nationalities) {
      nationality = nationality.trim().toLowerCase();
      
      // Add to tag categories
      if (!tagCategories.nationality.includes(nationality)) {
        tagCategories.nationality.push(nationality);
      }
      
      // Add nationality as a tag
      const nationalityTag = `nationality:${nationality}`;
      if (!student.tags.includes(nationalityTag)) {
        student.tags.push(nationalityTag);
      }
    }
  }
  
  // Add languages as tags
  if (newData.languages && Array.isArray(newData.languages)) {
    for (let language of newData.languages) {
      language = language.trim().toLowerCase();
      
      // Add to tag categories
      if (!tagCategories.languages.includes(language)) {
        tagCategories.languages.push(language);
      }
      
      // Add language as a tag
      const languageTag = `language:${language}`;
      if (!student.tags.includes(languageTag)) {
        student.tags.push(languageTag);
      }
    }
  }
  
  // Store email if it's not already there
  if (newData.email && !student.email) {
    student.email = newData.email;
  }
  
  // Don't add education and experience as tags (too specific)
  // but track them in tag categories for reporting
  if (newData.education && Array.isArray(newData.education)) {
    for (const edu of newData.education) {
      const institution = extractInstitution(edu);
      if (institution && !tagCategories.education.includes(institution)) {
        tagCategories.education.push(institution);
      }
    }
  }
  
  if (newData.experience && Array.isArray(newData.experience)) {
    for (const exp of newData.experience) {
      const company = extractCompany(exp);
      if (company && !tagCategories.experience.includes(company)) {
        tagCategories.experience.push(company);
      }
    }
  }
}

/**
 * Extract institution name from education string
 */
function extractInstitution(education) {
  // Simple extraction - split on commas and take the last part before a country name
  const parts = education.split(',');
  if (parts.length > 1) {
    // Take the part before any country code or reference
    const mainPart = parts[0].trim();
    // Now extract the institution name - assuming it's after a degree
    const matches = mainPart.match(/(?:BSc|BA|BEng|MSc|MA|MEng|PhD|BBA|LLB|BMgmt|BE)[^,]* in [^,]*,\s*([^,]+)/i);
    if (matches && matches[1]) {
      return matches[1].trim();
    }
    // If that fails, just use the first part
    return mainPart;
  }
  return education.trim();
}

/**
 * Extract company name from experience string
 */
function extractCompany(experience) {
  // Simple extraction - take the first part of the string
  const parts = experience.split(',');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  return experience.trim();
}

// Execute the update function
updateStudentTags().then(() => {
  console.log('Finished updating student tags');
}).catch(err => {
  console.error('Error in main execution:', err);
});