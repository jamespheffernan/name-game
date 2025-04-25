/**
 * Connection Service
 * Finds biographical connections between students for the trivia game mode
 */

// Define possible connection types with associated keywords
const CONNECTION_TYPES = {
  UNIVERSITY: {
    type: 'university',
    keywords: ['university', 'college', 'school', 'institute', 'mba', 'bsc', 'ba', 'ms', 'phd', 'llb', 'meng', 'msc'],
    label: 'Attended the same university'
  },
  COUNTRY: {
    type: 'country',
    keywords: ['japan', 'uk', 'us', 'usa', 'united states', 'united kingdom', 'china', 'india', 'france', 'germany', 
               'spain', 'italy', 'canada', 'australia', 'russia', 'brazil', 'mexico', 'singapore', 'hong kong',
               'indonesia', 'malaysia', 'thailand', 'vietnam', 'philippines', 'korea', 'pakistan', 'dubai', 
               'netherlands', 'belgium', 'switzerland', 'sweden', 'norway', 'denmark', 'finland', 'poland'],
    label: 'Have a connection to the same country'
  },
  INDUSTRY: {
    type: 'industry',
    keywords: ['finance', 'banking', 'consulting', 'technology', 'healthcare', 'pharma', 'pharmaceutical', 
               'manufacturing', 'retail', 'consumer', 'energy', 'oil', 'gas', 'media', 'entertainment', 
               'education', 'government', 'non-profit', 'startup', 'tech', 'software', 'insurance',
               'investment', 'marketing', 'advertising', 'telecom', 'agriculture', 'fashion'],
    label: 'Worked in the same industry'
  },
  COMPANY: {
    type: 'company',
    keywords: ['google', 'microsoft', 'amazon', 'apple', 'facebook', 'meta', 'tesla', 'netflix', 'ibm', 'oracle', 
               'salesforce', 'deloitte', 'pwc', 'kpmg', 'ey', 'mckinsey', 'bcg', 'bain', 'goldman sachs', 
               'morgan stanley', 'jp morgan', 'bank of america', 'hsbc', 'barclays', 'deutsche bank', 'citi',
               'unilever', 'procter & gamble', 'coca cola', 'pepsi', 'nestle', 'samsung', 'sony', 'toyota', 
               'volkswagen', 'bmw', 'mercedes', 'boeing', 'airbus', 'shell', 'bp', 'exxon'],
    label: 'Worked at the same company'
  },
  FIELD: {
    type: 'field',
    keywords: ['computer science', 'engineering', 'business', 'economics', 'law', 'medicine', 'biology', 
               'chemistry', 'physics', 'mathematics', 'psychology', 'sociology', 'history', 'philosophy', 
               'literature', 'arts', 'design', 'accounting', 'management', 'marketing', 'finance', 'medicine'],
    label: 'Studied in the same field'
  }
};

/**
 * Find a connection between two students based on their education and experience
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @returns {Object|null} Connection object or null if no connection found
 */
function findConnection(student1, student2) {
  // Check if both students have education and experience data
  if (!student1.education || !student2.education) {
    return null;
  }

  // Combine education and experience data for each student
  const student1Bio = [...(student1.education || []), ...(student1.experience || [])].join(' ').toLowerCase();
  const student2Bio = [...(student2.education || []), ...(student2.experience || [])].join(' ').toLowerCase();

  // Try to find connections in order of specificity
  const connectionTypes = Object.values(CONNECTION_TYPES);
  
  for (const connType of connectionTypes) {
    const match = findMatchingKeywords(student1Bio, student2Bio, connType.keywords);
    if (match) {
      return {
        type: connType.type,
        label: connType.label,
        keyword: match,
        description: generateConnectionDescription(student1, student2, connType.type, match)
      };
    }
  }

  return null;
}

/**
 * Find matching keywords between two text blocks
 * @param {string} text1 - First text block
 * @param {string} text2 - Second text block
 * @param {Array<string>} keywords - Keywords to search for
 * @returns {string|null} The matching keyword or null if no match found
 */
function findMatchingKeywords(text1, text2, keywords) {
  for (const keyword of keywords) {
    if (text1.includes(keyword) && text2.includes(keyword)) {
      return keyword;
    }
  }
  return null;
}

/**
 * Generate a description for the connection
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @param {string} connectionType - Type of connection
 * @param {string} keyword - The matching keyword
 * @returns {string} Description of the connection
 */
function generateConnectionDescription(student1, student2, connectionType, keyword) {
  const name1 = student1.fullName;
  const name2 = student2.fullName;
  
  switch (connectionType) {
    case 'university':
      // Find the specific university
      const university = findSpecificEntity(student1, student2, keyword, connectionType);
      return `${name1} and ${name2} both attended ${university}`;
    
    case 'country':
      // Find the specific country
      const country = findSpecificEntity(student1, student2, keyword, connectionType);
      return `${name1} and ${name2} both have a connection to ${country}`;
    
    case 'industry':
      const industry = findSpecificEntity(student1, student2, keyword, connectionType);
      return `${name1} and ${name2} both worked in the ${industry} industry`;
    
    case 'company':
      const company = findSpecificEntity(student1, student2, keyword, connectionType);
      return `${name1} and ${name2} both worked at ${company}`;
    
    case 'field':
      const field = findSpecificEntity(student1, student2, keyword, connectionType);
      return `${name1} and ${name2} both studied ${field}`;
    
    default:
      return `${name1} and ${name2} share a connection`;
  }
}

/**
 * Find the specific entity (university, country, etc.) that connects the students
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @param {string} keyword - The matching keyword
 * @param {string} type - Type of connection
 * @returns {string} The specific entity name
 */
function findSpecificEntity(student1, student2, keyword, type) {
  // Combine education and experience
  const s1Bio = [...(student1.education || []), ...(student1.experience || [])];
  const s2Bio = [...(student2.education || []), ...(student2.experience || [])];
  
  // Find entries containing the keyword
  const s1Entries = s1Bio.filter(entry => entry.toLowerCase().includes(keyword));
  const s2Entries = s2Bio.filter(entry => entry.toLowerCase().includes(keyword));
  
  if (s1Entries.length === 0 || s2Entries.length === 0) {
    // Shouldn't happen, but return the keyword as fallback
    return capitalizeFirst(keyword);
  }
  
  // For universities, try to extract full university name
  if (type === 'university') {
    const uniPattern = new RegExp(`\\b([A-Z][a-zA-Z\\s&]+ (?:${keyword}|University|College|Institute|School))\\b`, 'i');
    
    // Try to find a match in student1's entries
    for (const entry of s1Entries) {
      const match = entry.match(uniPattern);
      if (match && match[1]) {
        // Verify this university is also in student2's entries
        if (s2Entries.some(e => e.toLowerCase().includes(match[1].toLowerCase()))) {
          return match[1];
        }
      }
    }
  }
  
  // For countries, companies, fields, use the keyword with proper capitalization
  return capitalizeFirst(keyword);
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate a trivia question about connections between students
 * @param {Array} students - Array of student objects
 * @returns {Object|null} Trivia question object or null if no connections found
 */
function generateConnectionTrivia(students) {
  if (!students || students.length < 8) {
    throw new Error('Need at least 8 students to generate a connection trivia');
  }
  
  // Shuffle students
  const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
  
  // Try to find a pair of students with a connection
  for (let i = 0; i < shuffledStudents.length - 1; i++) {
    for (let j = i + 1; j < shuffledStudents.length; j++) {
      const student1 = shuffledStudents[i];
      const student2 = shuffledStudents[j];
      
      const connection = findConnection(student1, student2);
      if (connection) {
        // Found a connection, generate a question
        return createTriviaQuestion(student1, student2, connection, shuffledStudents);
      }
    }
  }
  
  return null;
}

/**
 * Create a trivia question based on the connection
 * @param {Object} student1 - First student object
 * @param {Object} student2 - Second student object
 * @param {Object} connection - Connection object
 * @param {Array} allStudents - All students for generating wrong options
 * @returns {Object} Trivia question object
 */
function createTriviaQuestion(student1, student2, connection, allStudents) {
  // Create question options
  const correctOption = {
    id: 'option_correct',
    text: connection.description
  };
  
  // Generate wrong options by finding connections with other students
  const wrongOptions = generateWrongOptions(student1, student2, connection, allStudents);
  
  // Combine options and shuffle
  const options = [correctOption, ...wrongOptions];
  const shuffledOptions = options.sort(() => Math.random() - 0.5);
  
  return {
    id: `connection_trivia_${Date.now()}`,
    type: 'connectionTrivia',
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
    question: `What connects ${student1.fullName} and ${student2.fullName}?`,
    options: shuffledOptions,
    correctOptionId: correctOption.id,
    connectionType: connection.type
  };
}

/**
 * Generate wrong options for the trivia question
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
  const otherTypes = Object.values(CONNECTION_TYPES)
    .filter(ct => ct.type !== connection.type)
    .map(ct => ({
      id: `option_wrong_${ct.type}`,
      text: `${student1.fullName} and ${student2.fullName} both ${ct.label.toLowerCase().replace('have a', 'have').replace('worked at', 'worked for')}`
    }));
  
  // Shuffle and take up to 2
  const shuffledTypeOptions = otherTypes.sort(() => Math.random() - 0.5).slice(0, 2);
  for (const option of shuffledTypeOptions) {
    if (!usedDescriptions.has(option.text)) {
      wrongOptions.push(option);
      usedDescriptions.add(option.text);
    }
  }
  
  // Option 2: Use real connections with other students
  const otherStudents = allStudents.filter(s => s.id !== student1.id && s.id !== student2.id);
  
  for (let i = 0; wrongOptions.length < 3 && i < otherStudents.length; i++) {
    const otherStudent = otherStudents[i];
    
    // Try to find a connection with student1
    const connection1 = findConnection(student1, otherStudent);
    if (connection1 && !usedDescriptions.has(connection1.description)) {
      wrongOptions.push({
        id: `option_wrong_${wrongOptions.length + 1}`,
        text: connection1.description
      });
      usedDescriptions.add(connection1.description);
      continue;
    }
    
    // Try with student2
    const connection2 = findConnection(student2, otherStudent);
    if (connection2 && !usedDescriptions.has(connection2.description)) {
      wrongOptions.push({
        id: `option_wrong_${wrongOptions.length + 1}`,
        text: connection2.description
      });
      usedDescriptions.add(connection2.description);
    }
  }
  
  // If we still need more options, generate completely fake ones
  const fakeConnections = [
    `${student1.fullName} and ${student2.fullName} both speak Mandarin Chinese fluently`,
    `${student1.fullName} and ${student2.fullName} both played professional sports before their studies`,
    `${student1.fullName} and ${student2.fullName} both founded successful startups`,
    `${student1.fullName} and ${student2.fullName} both worked on the same volunteer project`,
    `${student1.fullName} and ${student2.fullName} both have published research papers`,
    `${student1.fullName} and ${student2.fullName} both previously worked at the United Nations`
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
 * Generate a round of connection trivia questions
 * @param {Array} students - Array of student objects
 * @param {number} questionCount - Number of questions to generate
 * @returns {Array} Array of trivia question objects
 */
function generateConnectionTriviaRound(students, questionCount = 5) {
  // Check if we have enough students
  if (!students || students.length < 8) {
    throw new Error('Need at least 8 students to generate a connection trivia round');
  }
  
  // Limit question count to a reasonable number
  questionCount = Math.min(questionCount, 10);
  
  const questions = [];
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (questions.length < questionCount && attempts < maxAttempts) {
    attempts++;
    
    try {
      const question = generateConnectionTrivia(students);
      
      if (question) {
        // Check if we already have a very similar question
        const isDuplicate = questions.some(q => 
          (q.student1.id === question.student1.id && q.student2.id === question.student2.id) ||
          (q.student1.id === question.student2.id && q.student2.id === question.student1.id)
        );
        
        if (!isDuplicate) {
          questions.push(question);
        }
      }
    } catch (error) {
      console.error('Error generating connection trivia:', error);
    }
  }
  
  return questions;
}

module.exports = {
  findConnection,
  generateConnectionTrivia,
  generateConnectionTriviaRound
};