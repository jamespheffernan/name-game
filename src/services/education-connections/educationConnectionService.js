/**
 * Education Connection Service
 * Finds educational connections between students for the trivia game mode
 * using the structured education data
 */

/**
 * Connection type definitions for education-related connections
 */
const EDUCATION_CONNECTION_TYPES = {
  SAME_UNIVERSITY: {
    type: 'same_university',
    label: 'Attended the same university',
    description: (student1, student2, match) => 
      `${student1.fullName} and ${student2.fullName} both attended ${match}`
  },
  SAME_DEGREE_TYPE: {
    type: 'same_degree_type',
    label: 'Have the same type of degree',
    description: (student1, student2, match) => 
      `${student1.fullName} and ${student2.fullName} both have ${match} degrees`
  },
  SAME_SUBJECT: {
    type: 'same_subject',
    label: 'Studied the same subject',
    description: (student1, student2, match) => 
      `${student1.fullName} and ${student2.fullName} both studied ${match}`
  },
  SAME_EDUCATION_LOCATION: {
    type: 'same_education_location',
    label: 'Studied in the same location',
    description: (student1, student2, match) => 
      `${student1.fullName} and ${student2.fullName} both studied in ${match}`
  }
};

/**
 * Find educational connections between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {Object|null} Connection object or null if no connection found
 */
function findEducationConnection(student1, student2) {
  // Check if both students have parsed education data
  if (!student1.educationParsed || !student2.educationParsed || 
      !Array.isArray(student1.educationParsed) || !Array.isArray(student2.educationParsed) ||
      student1.educationParsed.length === 0 || student2.educationParsed.length === 0) {
    return null;
  }

  // 1. Check for same university
  const sharedUniversity = findSharedUniversity(student1, student2);
  if (sharedUniversity) {
    return {
      type: EDUCATION_CONNECTION_TYPES.SAME_UNIVERSITY.type,
      label: EDUCATION_CONNECTION_TYPES.SAME_UNIVERSITY.label,
      match: sharedUniversity,
      description: EDUCATION_CONNECTION_TYPES.SAME_UNIVERSITY.description(student1, student2, sharedUniversity)
    };
  }

  // 2. Check for same degree type
  const sharedDegreeType = findSharedDegreeType(student1, student2);
  if (sharedDegreeType) {
    return {
      type: EDUCATION_CONNECTION_TYPES.SAME_DEGREE_TYPE.type,
      label: EDUCATION_CONNECTION_TYPES.SAME_DEGREE_TYPE.label,
      match: sharedDegreeType,
      description: EDUCATION_CONNECTION_TYPES.SAME_DEGREE_TYPE.description(student1, student2, sharedDegreeType)
    };
  }

  // 3. Check for same subject
  const sharedSubject = findSharedSubject(student1, student2);
  if (sharedSubject) {
    return {
      type: EDUCATION_CONNECTION_TYPES.SAME_SUBJECT.type,
      label: EDUCATION_CONNECTION_TYPES.SAME_SUBJECT.label,
      match: sharedSubject,
      description: EDUCATION_CONNECTION_TYPES.SAME_SUBJECT.description(student1, student2, sharedSubject)
    };
  }

  // 4. Check for same education location
  const sharedLocation = findSharedEducationLocation(student1, student2);
  if (sharedLocation) {
    return {
      type: EDUCATION_CONNECTION_TYPES.SAME_EDUCATION_LOCATION.type,
      label: EDUCATION_CONNECTION_TYPES.SAME_EDUCATION_LOCATION.label,
      match: sharedLocation,
      description: EDUCATION_CONNECTION_TYPES.SAME_EDUCATION_LOCATION.description(student1, student2, sharedLocation)
    };
  }

  return null;
}

/**
 * Find a shared university between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {string|null} Shared university name or null
 */
function findSharedUniversity(student1, student2) {
  const universities1 = student1.educationParsed
    .filter(edu => edu.university && edu.university.length > 0)
    .map(edu => edu.university.toLowerCase());
  
  const universities2 = student2.educationParsed
    .filter(edu => edu.university && edu.university.length > 0)
    .map(edu => edu.university.toLowerCase());
  
  // Find the first match
  for (const uni1 of universities1) {
    for (const uni2 of universities2) {
      if (uni1 === uni2) {
        // Return properly capitalized university name
        const originalName = student1.educationParsed.find(edu => 
          edu.university && edu.university.toLowerCase() === uni1)?.university || uni1;
        return originalName;
      }
    }
  }
  
  return null;
}

/**
 * Find a shared degree type between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {string|null} Shared degree type or null
 */
function findSharedDegreeType(student1, student2) {
  const degreeTypes1 = student1.educationParsed
    .filter(edu => edu.degreeType && edu.degreeType.length > 0)
    .map(edu => edu.degreeType.toLowerCase());
  
  const degreeTypes2 = student2.educationParsed
    .filter(edu => edu.degreeType && edu.degreeType.length > 0)
    .map(edu => edu.degreeType.toLowerCase());
  
  // Find the first match
  for (const type1 of degreeTypes1) {
    for (const type2 of degreeTypes2) {
      if (type1 === type2) {
        return type1.charAt(0).toUpperCase() + type1.slice(1);
      }
    }
  }
  
  return null;
}

/**
 * Find a shared study subject between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {string|null} Shared subject or null
 */
function findSharedSubject(student1, student2) {
  // Use a minimum subject length to avoid false matches on short strings
  const MIN_SUBJECT_LENGTH = 5;
  
  const subjects1 = student1.educationParsed
    .filter(edu => edu.subject && edu.subject.length >= MIN_SUBJECT_LENGTH)
    .map(edu => edu.subject.toLowerCase());
  
  const subjects2 = student2.educationParsed
    .filter(edu => edu.subject && edu.subject.length >= MIN_SUBJECT_LENGTH)
    .map(edu => edu.subject.toLowerCase());
  
  // Find common key subject terms
  const subjectKeywords = [
    "engineering", "computer science", "business", "economics", "finance", 
    "marketing", "management", "accounting", "law", "medicine", "biology",
    "chemistry", "physics", "mathematics", "psychology", "history", "design"
  ];
  
  for (const keyword of subjectKeywords) {
    const hasKeyword1 = subjects1.some(subj => subj.includes(keyword));
    const hasKeyword2 = subjects2.some(subj => subj.includes(keyword));
    
    if (hasKeyword1 && hasKeyword2) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }
  
  // If no keyword matches, try exact subject matches
  for (const subj1 of subjects1) {
    for (const subj2 of subjects2) {
      if (subj1 === subj2) {
        // Return properly capitalized subject name
        const originalName = student1.educationParsed.find(edu => 
          edu.subject && edu.subject.toLowerCase() === subj1)?.subject || subj1;
        return originalName;
      }
    }
  }
  
  return null;
}

/**
 * Find a shared education location between two students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {string|null} Shared location or null
 */
function findSharedEducationLocation(student1, student2) {
  const locations1 = student1.educationParsed
    .filter(edu => edu.location && edu.location.length > 0)
    .map(edu => edu.location.toLowerCase());
  
  const locations2 = student2.educationParsed
    .filter(edu => edu.location && edu.location.length > 0)
    .map(edu => edu.location.toLowerCase());
  
  // Find the first match
  for (const loc1 of locations1) {
    for (const loc2 of locations2) {
      if (loc1 === loc2) {
        // Return properly capitalized location name
        const originalName = student1.educationParsed.find(edu => 
          edu.location && edu.location.toLowerCase() === loc1)?.location || loc1;
        return originalName;
      }
    }
  }
  
  return null;
}

/**
 * Generate wrong options for the education trivia question
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @param {Object} connection - Real connection object
 * @param {Array} allStudents - All students for generating wrong options
 * @returns {Array} Array of wrong option objects
 */
function generateWrongOptions(student1, student2, connection, allStudents) {
  const wrongOptions = [];
  const usedDescriptions = new Set([connection.description]);
  
  // Option 1: Use different connection types
  const otherTypes = Object.values(EDUCATION_CONNECTION_TYPES)
    .filter(ct => ct.type !== connection.type)
    .map(ct => ({
      id: `option_wrong_${ct.type}`,
      text: ct.description(student1, student2, 'a different ' + ct.type.replace('same_', ''))
    }));
  
  // Shuffle and take up to 2
  const shuffledTypeOptions = otherTypes.sort(() => Math.random() - 0.5).slice(0, 2);
  for (const option of shuffledTypeOptions) {
    if (!usedDescriptions.has(option.text)) {
      wrongOptions.push(option);
      usedDescriptions.add(option.text);
    }
  }
  
  // Option 2: Generate alternative wrong connections using the same students
  // This approach avoids mentioning other students in wrong answers
  
  // Get all possible connection types that aren't the correct one
  const otherConnectionTypes = Object.values(EDUCATION_CONNECTION_TYPES)
    .filter(ct => ct.type !== connection.type);
  
  // For each wrong connection type, try to create a plausible but incorrect connection
  for (const wrongType of otherConnectionTypes) {
    if (wrongOptions.length >= 3) break;
    
    // Try to create a plausible incorrect connection
    let wrongText = '';
    
    switch (wrongType.type) {
      case 'same_university':
        // Use a plausible but incorrect university
        const universities = ['Harvard University', 'Stanford University', 'MIT', 'Oxford University', 
                           'Cambridge University', 'Yale University', 'Princeton University'];
        const wrongUniversity = universities[Math.floor(Math.random() * universities.length)];
        wrongText = `${student1.fullName} and ${student2.fullName} both attended ${wrongUniversity}`;
        break;
        
      case 'same_degree_type':
        // Use a plausible but incorrect degree type
        const degreeTypes = ['Bachelor', 'Master', 'Doctorate', 'MBA', 'PhD'];
        const correctDegreeType = connection.match; // Don't use the correct one
        const availableDegreeTypes = degreeTypes.filter(dt => 
          dt.toLowerCase() !== (correctDegreeType ? correctDegreeType.toLowerCase() : ''));
        const wrongDegreeType = availableDegreeTypes[Math.floor(Math.random() * availableDegreeTypes.length)];
        wrongText = `${student1.fullName} and ${student2.fullName} both have ${wrongDegreeType} degrees`;
        break;
        
      case 'same_subject':
        // Use a plausible but incorrect subject
        const subjects = ['Computer Science', 'Economics', 'Business Administration', 'Finance', 
                        'Engineering', 'Marketing', 'Physics', 'Mathematics'];
        const correctSubject = connection.match; // Don't use the correct one
        const availableSubjects = subjects.filter(s => 
          !correctSubject || !s.toLowerCase().includes(correctSubject.toLowerCase()));
        const wrongSubject = availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
        wrongText = `${student1.fullName} and ${student2.fullName} both studied ${wrongSubject}`;
        break;
        
      case 'same_education_location':
        // Use a plausible but incorrect location
        const locations = ['United States', 'United Kingdom', 'Japan', 'Germany', 'France', 
                         'Singapore', 'Australia', 'Canada', 'China'];
        const correctLocation = connection.match; // Don't use the correct one
        const availableLocations = locations.filter(loc => 
          !correctLocation || !loc.toLowerCase().includes(correctLocation.toLowerCase()));
        const wrongLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)];
        wrongText = `${student1.fullName} and ${student2.fullName} both studied in ${wrongLocation}`;
        break;
    }
    
    // Add the wrong option if it's not a duplicate
    if (wrongText && !usedDescriptions.has(wrongText)) {
      wrongOptions.push({
        id: `option_wrong_${wrongOptions.length + 1}`,
        text: wrongText
      });
      usedDescriptions.add(wrongText);
    }
  }
  
  // If we still need more options, generate completely fake ones
  const fakeConnections = [
    `${student1.fullName} and ${student2.fullName} both studied at Harvard University`,
    `${student1.fullName} and ${student2.fullName} both have Computer Science degrees`,
    `${student1.fullName} and ${student2.fullName} both studied in the United States`,
    `${student1.fullName} and ${student2.fullName} both completed their education in Europe`,
    `${student1.fullName} and ${student2.fullName} both have doctorate degrees`,
    `${student1.fullName} and ${student2.fullName} both studied Art History`
  ];
  
  while (wrongOptions.length < 3) {
    const fakeCon = fakeConnections[wrongOptions.length];
    if (!usedDescriptions.has(fakeCon)) {
      wrongOptions.push({
        id: `option_wrong_${wrongOptions.length + 1}`,
        text: fakeCon
      });
      usedDescriptions.add(fakeCon);
    }
  }
  
  return wrongOptions;
}

/**
 * Create a trivia question based on the education connection
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @param {Object} connection - Connection object
 * @param {Array} allStudents - All students for generating wrong options
 * @returns {Object} Trivia question object
 */
function createEducationTriviaQuestion(student1, student2, connection, allStudents) {
  // Create question options
  const correctOption = {
    id: 'option_correct',
    text: connection.description
  };
  
  // Generate wrong options
  const wrongOptions = generateWrongOptions(student1, student2, connection, allStudents);
  
  // Combine options and shuffle
  const options = [correctOption, ...wrongOptions];
  const shuffledOptions = options.sort(() => Math.random() - 0.5);
  
  // Log what we're generating to help with debugging
  console.log('Creating education trivia question:', {
    student1: student1.fullName,
    student2: student2.fullName,
    connectionType: connection.type,
    correctDescription: connection.description,
    optionsCount: options.length
  });
  
  return {
    id: `education_trivia_${Date.now()}`,
    type: 'educationTrivia',
    student1: {
      id: student1.id,
      name: student1.fullName,
      imagePath: student1.imagePath
    },
    student2: {
      id: student2.id,
      name: student2.fullName,
      imagePath: student2.imagePath
    },
    question: `What educational connection do ${student1.fullName} and ${student2.fullName} share?`,
    options: shuffledOptions,
    correctOptionId: correctOption.id,
    connectionType: connection.type
  };
}

/**
 * Generate an education trivia question about connections between students
 * @param {Array} students - Array of student objects
 * @returns {Object|null} Trivia question object or null if no connections found
 */
function generateEducationTrivia(students) {
  if (!students || students.length < 8) {
    throw new Error('Need at least 8 students to generate an education connection trivia');
  }
  
  // Filter to students with education data
  const studentsWithEducation = students.filter(s => 
    s.educationParsed && Array.isArray(s.educationParsed) && s.educationParsed.length > 0);
  
  console.log(`generateEducationTrivia: ${studentsWithEducation.length} students with education data out of ${students.length} total`);
  
  if (studentsWithEducation.length < 8) {
    throw new Error('Need at least 8 students with education data to generate education trivia');
  }
  
  // Shuffle students
  const shuffledStudents = [...studentsWithEducation].sort(() => Math.random() - 0.5);
  
  // Try to find a pair of students with an education connection
  let connectionFound = false;
  let connectionAttempts = 0;
  const maxConnectionAttempts = 50;
  
  for (let i = 0; i < shuffledStudents.length - 1 && connectionAttempts < maxConnectionAttempts; i++) {
    for (let j = i + 1; j < shuffledStudents.length && connectionAttempts < maxConnectionAttempts; j++) {
      connectionAttempts++;
      
      const student1 = shuffledStudents[i];
      const student2 = shuffledStudents[j];
      
      console.log(`Trying connection between ${student1.fullName} and ${student2.fullName} (attempt ${connectionAttempts})`);
      
      try {
        const connection = findEducationConnection(student1, student2);
        if (connection) {
          // Found a connection, generate a question
          console.log(`Found ${connection.type} connection: ${connection.description}`);
          connectionFound = true;
          return createEducationTriviaQuestion(student1, student2, connection, shuffledStudents);
        } else {
          console.log(`No education connection found between these students`);
        }
      } catch (error) {
        console.error(`Error finding connection:`, error);
      }
    }
  }
  
  console.log(`No education connections found after ${connectionAttempts} attempts`);
  return null;
}

/**
 * Generate a round of education trivia questions
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of trivia question objects
 */
function generateEducationTriviaRound(students, questionCount = 5) {
  // Check if we have enough students
  if (!students || students.length < 8) {
    throw new Error('Need at least 8 students to generate an education trivia round');
  }
  
  console.log(`Generating education trivia round with ${students.length} students and ${questionCount} questions`);
  
  // Count students with education data
  const studentsWithEducation = students.filter(s => 
    s.educationParsed && Array.isArray(s.educationParsed) && s.educationParsed.length > 0
  );
  
  console.log(`Found ${studentsWithEducation.length} students with education data`);
  
  // Limit question count to a reasonable number
  questionCount = Math.min(questionCount, 10);
  
  const questions = [];
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (questions.length < questionCount && attempts < maxAttempts) {
    attempts++;
    
    try {
      const question = generateEducationTrivia(students);
      
      if (question) {
        // Check if we already have a very similar question
        const isDuplicate = questions.some(q => 
          (q.student1.id === question.student1.id && q.student2.id === question.student2.id) ||
          (q.student1.id === question.student2.id && q.student2.id === question.student1.id)
        );
        
        if (!isDuplicate) {
          questions.push(question);
          console.log(`Added question ${questions.length}/${questionCount} (attempt ${attempts})`);
        } else {
          console.log(`Skipping duplicate question (attempt ${attempts})`);
        }
      } else {
        console.log(`No question generated on attempt ${attempts}`);
      }
    } catch (error) {
      console.error('Error generating education trivia:', error);
    }
  }
  
  console.log(`Generated ${questions.length} education trivia questions after ${attempts} attempts`);
  return questions;
}

module.exports = {
  findEducationConnection,
  generateEducationTrivia,
  generateEducationTriviaRound,
  EDUCATION_CONNECTION_TYPES
};