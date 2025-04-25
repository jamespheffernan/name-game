const fs = require('fs');
const path = require('path');

// Function to parse education information into structured format
function parseEducation(educationStr) {
  // Initialize object with default values
  const result = {
    degree: '',
    degreeType: '',
    university: '',
    subject: '',
    location: ''
  };

  // Match common degree patterns, handling various formats
  let degreeMatch = educationStr.match(/^(BSc|MSc|MBA|BBA|BA|BS|MS|PhD|BEng|MEng|MPhil|MPA|BEC|MA|MPH|MPP|LLB|JD|MD|EdD|DBA|MIDE|MIST|BCHE|BIM|BGM|BFA|BDS|BAcc|MAQR|BCom|BTech|BES|MFin|MFinC|PharmD|SE)\s*(in\s+)?(.+?)(?:,|$)/i);
  
  // Handle special cases like "Double degree", "Dual degree", "Double major"
  if (!degreeMatch) {
    const specialMatch = educationStr.match(/(?:Double|Dual) (?:degree|major)-?\s*(.+?)(?:,|$)/i);
    if (specialMatch) {
      // Look for degree types within the description
      const innerDegreeMatch = specialMatch[1].match(/(BSc|MSc|MBA|BBA|BA|BS|MS|PhD|BEng|MEng|MPhil|BEC|MA|BCom|BTech|SE|BAcc)\s*(in\s+)?(.+?)(?:,|and|\s\/|$)/i);
      if (innerDegreeMatch) {
        degreeMatch = innerDegreeMatch;
      }
    }
  }
  
  // Handle certifications and other professional designations
  if (!degreeMatch) {
    const certMatch = educationStr.match(/^(CFA|CPA|PMP|Certificate|HSK|ICDL|Chartered|Solicitor|CEng)\s*(in\s+)?(.+?)(?:,|$)/i);
    if (certMatch) {
      result.degree = certMatch[1];
      result.degreeType = 'Certification';
      if (certMatch[3]) {
        result.subject = certMatch[3].trim();
      }
    }
  }
  
  if (degreeMatch) {
    result.degree = degreeMatch[1];
    
    // Categorize degree type
    const degreeType = degreeMatch[1].toUpperCase();
    if (degreeType.startsWith('B') || degreeType === 'SE') {
      result.degreeType = 'Bachelor';
    } else if (degreeType.startsWith('M')) {
      result.degreeType = 'Master';
    } else if (degreeType === 'PHD' || degreeType === 'EDD' || degreeType === 'DBA' || degreeType === 'JD' || degreeType === 'MD') {
      result.degreeType = 'Doctorate';
    }
    
    // Extract subject if available
    if (degreeMatch[3]) {
      result.subject = degreeMatch[3].trim();
    }
  }

  // Extract university name
  const universityMatch = educationStr.match(/(?:,\s*|^)([^,]+(?:University|College|School|Institute|Universidad|Universität|École|Vidyapeetham|Institute of Technology|IIT|Technical University)[^,]*)/i);
  if (universityMatch) {
    result.university = universityMatch[1].trim();
  }

  // Extract location (usually at the end)
  const locationMatch = educationStr.match(/(?:,\s*)([^,\[]+)(?:\s*\[.*\])?$/);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }
  
  // Clean up location data
  if (result.location) {
    // Remove trailing periods and spaces
    result.location = result.location.replace(/\.\s*$/, '').trim();
    
    // Handle UK/USA abbreviations
    if (result.location === 'UK') result.location = 'United Kingdom';
    if (result.location === 'USA' || result.location === 'US') result.location = 'United States';
  }

  return result;
}

// Read students.json file
const studentsFilePath = path.join(__dirname, '..', 'data', 'students.json');
const studentsData = JSON.parse(fs.readFileSync(studentsFilePath, 'utf8'));

// Process each student's education
const updatedStudents = studentsData.students.map(student => {
  if (student.education && Array.isArray(student.education)) {
    // Parse each education entry
    const parsedEducation = student.education.map(edu => parseEducation(edu));
    
    // Keep the original education array and add the parsed version
    student.educationParsed = parsedEducation;
  }
  return student;
});

// Update students data
const updatedData = { students: updatedStudents };

// Calculate statistics
const totalStudents = updatedStudents.length;
const totalEducationEntries = updatedStudents.reduce(
  (acc, student) => acc + (student.educationParsed ? student.educationParsed.length : 0), 
  0
);
const emptyDegrees = updatedStudents.filter(
  s => s.educationParsed && s.educationParsed.some(e => e.degree === '')
).length;
const successRate = ((totalEducationEntries - emptyDegrees) / totalEducationEntries * 100).toFixed(2);

// Write the updated data back to a temporary file for review
const outputPath = path.join(__dirname, '..', 'data', 'students_with_parsed_education.json');
fs.writeFileSync(outputPath, JSON.stringify(updatedData, null, 2), 'utf8');

// Write the final data to the students.json file
fs.writeFileSync(studentsFilePath, JSON.stringify(updatedData, null, 2), 'utf8');

console.log(`Parsed education data for ${totalStudents} students:`);
console.log(`- Total education entries: ${totalEducationEntries}`);
console.log(`- Successfully parsed: ${totalEducationEntries - emptyDegrees} (${successRate}%)`);
console.log(`- Updated students.json with parsed education information`);
console.log(`- Backup copy saved to ${outputPath}`);