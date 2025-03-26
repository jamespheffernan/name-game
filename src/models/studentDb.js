const fs = require('fs-extra');
const path = require('path');

// Path to our JSON "database"
const dbPath = path.join(__dirname, '../../data/students.json');

/**
 * Initialize the student database
 */
async function initDb() {
  try {
    console.log('Initializing database...');
    // Make sure the data directory exists
    await fs.ensureDir(path.dirname(dbPath));
    
    // Check if the file exists and has content
    let fileExists = false;
    try {
      fileExists = await fs.pathExists(dbPath) && (await fs.stat(dbPath)).size > 0;
    } catch (err) {
      console.log('Error checking database file:', err);
      fileExists = false;
    }
    
    // Create an empty database if the file doesn't exist or is empty
    if (!fileExists) {
      console.log('Creating new empty database...');
      await fs.writeJson(dbPath, { students: [], tags: {} }, { spaces: 2 });
      console.log('Database created successfully');
      return; // Nothing else to do with an empty database
    }
    
    // Check if the file contains valid JSON
    let data;
    try {
      data = await fs.readJson(dbPath);
      console.log('Successfully read database file');
    } catch (err) {
      console.error('Database file exists but contains invalid JSON:', err);
      // Backup the bad file
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      await fs.copy(dbPath, backupPath);
      console.log(`Backed up corrupt database to ${backupPath}`);
      
      // Create a new empty database
      await fs.writeJson(dbPath, { students: [], tags: {} }, { spaces: 2 });
      console.log('Created new empty database due to corruption');
      return;
    }
    
    // Validate and repair the database structure
    let needsSave = false;
    
    // Ensure students array exists
    if (!data.students || !Array.isArray(data.students)) {
      console.log('Database missing students array, adding it');
      data.students = [];
      needsSave = true;
    }
    
    // Ensure tags object exists
    if (!data.tags || typeof data.tags !== 'object') {
      console.log('Database missing tags object, adding it');
      data.tags = {};
      needsSave = true;
    }
    
    // Check for any data integrity issues
    let needsRepair = false;
    
    // Check for students without tags array
    const studentsWithoutTags = data.students.filter(s => !s.tags || !Array.isArray(s.tags));
    if (studentsWithoutTags.length > 0) {
      console.log(`Found ${studentsWithoutTags.length} students without valid tags array`);
      // Fix students without tags directly here
      data.students = data.students.map(student => {
        if (!student.tags || !Array.isArray(student.tags)) {
          student.tags = [];
        }
        return student;
      });
      needsSave = true;
    }
    
    // Save the database if changes were made
    if (needsSave) {
      console.log('Saving database with structure fixes...');
      await fs.writeJson(dbPath, data, { spaces: 2 });
      console.log('Database saved with fixes');
    } else {
      console.log('Database structure is valid, no fixes needed');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get all students from the database
 * @returns {Promise<Array>} Array of student objects
 */
async function getAllStudents() {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Ensure all students have a tags array
    const students = data.students || [];
    
    return students.map(student => {
      // Ensure tags is an array
      if (!student.tags) {
        student = { ...student, tags: [] };
      } else if (!Array.isArray(student.tags)) {
        // If tags is not an array (could be an object or string), convert to empty array
        console.warn(`Student ${student.id} has invalid tags format. Resetting tags.`);
        student = { ...student, tags: [] };
      }
      return student;
    });
  } catch (error) {
    console.error('Error getting students:', error);
    throw error;
  }
}

/**
 * Add students to the database
 * @param {Array} students - Array of student objects to add
 * @returns {Promise<Array>} Updated array of all students
 */
async function addStudents(students) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Generate unique IDs if not provided
    const updatedStudents = students.map((student, index) => ({
      ...student,
      id: student.id || `student_${Date.now()}_${index}`,
      tags: student.tags || []
    }));
    
    // Add the new students
    data.students = [...data.students, ...updatedStudents];
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return data.students;
  } catch (error) {
    console.error('Error adding students:', error);
    throw error;
  }
}

/**
 * Update a student in the database
 * @param {string} id - Student ID
 * @param {Object} updates - Object with properties to update
 * @returns {Promise<Object|null>} Updated student or null if not found
 */
async function updateStudent(id, updates) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    const index = data.students.findIndex(student => student.id === id);
    if (index === -1) return null;
    
    // Update the student
    data.students[index] = {
      ...data.students[index],
      ...updates
    };
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return data.students[index];
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

/**
 * Delete a student from the database
 * @param {string} id - Student ID to delete
 * @returns {Promise<boolean>} True if student was deleted, false if not found
 */
async function deleteStudent(id) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    const initialLength = data.students.length;
    data.students = data.students.filter(student => student.id !== id);
    
    // If no student was removed, return false
    if (data.students.length === initialLength) return false;
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
}

/**
 * Flush (clear) the student database
 * @returns {Promise<boolean>} True if operation was successful
 */
async function flushDb() {
  try {
    await initDb(); // Make sure the data directory exists
    await fs.writeJson(dbPath, { students: [], tags: {} }, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error flushing database:', error);
    throw error;
  }
}

/**
 * Repair the database to ensure all data is properly formatted
 * @returns {Promise<boolean>} True if operation was successful
 */
async function repairDb() {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Ensure tags object exists
    if (!data.tags) {
      data.tags = {};
    }
    
    // Ensure all students have a tags array
    data.students = data.students.map(student => {
      if (!student.tags) {
        student.tags = [];
      } else if (!Array.isArray(student.tags)) {
        console.warn(`Fixed invalid tags format for ${student.id}`);
        student.tags = [];
      }
      return student;
    });
    
    // Ensure all tags reference existing students
    for (const [tagName, studentIds] of Object.entries(data.tags)) {
      if (!Array.isArray(studentIds)) {
        console.warn(`Fixed invalid student list for tag ${tagName}`);
        data.tags[tagName] = [];
      }
      
      // Filter out student IDs that don't exist
      const validStudentIds = studentIds.filter(id => 
        data.students.some(student => student.id === id));
      
      if (validStudentIds.length !== studentIds.length) {
        console.warn(`Removed ${studentIds.length - validStudentIds.length} invalid student references from tag ${tagName}`);
      }
      
      data.tags[tagName] = validStudentIds;
    }
    
    // Make sure all tagged students have the tag in their tags array
    for (const [tagName, studentIds] of Object.entries(data.tags)) {
      for (const studentId of studentIds) {
        const studentIndex = data.students.findIndex(s => s.id === studentId);
        if (studentIndex !== -1) {
          const student = data.students[studentIndex];
          if (!student.tags.includes(tagName)) {
            console.warn(`Added missing tag ${tagName} to student ${studentId}`);
            student.tags.push(tagName);
          }
        }
      }
    }
    
    // Save the repaired data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    console.log("Database repair completed");
    
    return true;
  } catch (error) {
    console.error('Error repairing database:', error);
    throw error;
  }
}

/**
 * Get all tags from the database
 * @returns {Promise<Object>} Object with tag names as keys and arrays of student IDs as values
 */
async function getAllTags() {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    return data.tags || {};
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
}

/**
 * Create a new tag
 * @param {string} tagName - Name of the tag to create
 * @param {Array} [studentIds=[]] - Optional array of student IDs to assign to the tag
 * @returns {Promise<Object>} Updated tags object
 */
async function createTag(tagName, studentIds = []) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Check if tag already exists
    if (data.tags && data.tags[tagName]) {
      throw new Error(`Tag '${tagName}' already exists`);
    }
    
    // Create the tag with initial student IDs
    data.tags = data.tags || {};
    data.tags[tagName] = studentIds;
    
    // Add the tag to each student's tags array
    data.students = data.students.map(student => {
      if (studentIds.includes(student.id)) {
        // Ensure we have a tags array and add the new tag if not already there
        const tags = student.tags || [];
        if (!tags.includes(tagName)) {
          return { ...student, tags: [...tags, tagName] };
        }
      }
      return student;
    });
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return data.tags;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

/**
 * Delete a tag
 * @param {string} tagName - Name of the tag to delete
 * @returns {Promise<boolean>} True if tag was deleted, false if not found
 */
async function deleteTag(tagName) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Check if tag exists
    if (!data.tags || !data.tags[tagName]) {
      return false;
    }
    
    // Remove tag from all students
    data.students = data.students.map(student => {
      if (student.tags && student.tags.includes(tagName)) {
        return { ...student, tags: student.tags.filter(tag => tag !== tagName) };
      }
      return student;
    });
    
    // Delete the tag
    delete data.tags[tagName];
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
}

/**
 * Get students by tag
 * @param {string} tagName - Name of the tag to filter by
 * @returns {Promise<Array>} Array of students with the specified tag
 */
async function getStudentsByTag(tagName) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    console.log(`DB: Getting students with tag: ${tagName}`);
    
    // Check if tag exists
    if (!data.tags || !data.tags[tagName]) {
      console.log(`DB: Tag "${tagName}" not found in:`, Object.keys(data.tags || {}));
      return [];
    }
    
    // Get student IDs with this tag
    const studentIds = data.tags[tagName];
    console.log(`DB: Found ${studentIds.length} student IDs for tag ${tagName}:`, studentIds);
    
    // Return students with matching IDs, ensuring tags array exists
    const matchingStudents = data.students
      .filter(student => studentIds.includes(student.id))
      .map(student => {
        // Ensure tags array exists
        if (!student.tags) {
          student = { ...student, tags: [tagName] };
        } else if (!student.tags.includes(tagName)) {
          // Fix inconsistency if student is in tag but tag not in student
          student = { ...student, tags: [...student.tags, tagName] };
        }
        return student;
      });
    
    console.log(`DB: Returning ${matchingStudents.length} students`);
    return matchingStudents;
  } catch (error) {
    console.error('Error getting students by tag:', error);
    throw error;
  }
}

/**
 * Add a student to a tag
 * @param {string} tagName - Name of the tag
 * @param {string} studentId - ID of the student to add
 * @returns {Promise<boolean>} True if successful, false if tag or student not found
 */
async function addStudentToTag(tagName, studentId) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Check if tag exists
    if (!data.tags || !data.tags[tagName]) {
      await createTag(tagName, [studentId]);
      return true;
    }
    
    // Check if student exists
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex === -1) {
      return false;
    }
    
    // Add student to tag if not already there
    if (!data.tags[tagName].includes(studentId)) {
      data.tags[tagName].push(studentId);
    }
    
    // Add tag to student's tags array if not already there
    if (!data.students[studentIndex].tags || !data.students[studentIndex].tags.includes(tagName)) {
      data.students[studentIndex].tags = data.students[studentIndex].tags || [];
      data.students[studentIndex].tags.push(tagName);
    }
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error adding student to tag:', error);
    throw error;
  }
}

/**
 * Remove a student from a tag
 * @param {string} tagName - Name of the tag
 * @param {string} studentId - ID of the student to remove
 * @returns {Promise<boolean>} True if successful, false if tag or student not found
 */
async function removeStudentFromTag(tagName, studentId) {
  try {
    await initDb();
    const data = await fs.readJson(dbPath);
    
    // Check if tag exists
    if (!data.tags || !data.tags[tagName]) {
      return false;
    }
    
    // Check if student exists
    const studentIndex = data.students.findIndex(student => student.id === studentId);
    if (studentIndex === -1) {
      return false;
    }
    
    // Remove student from tag
    data.tags[tagName] = data.tags[tagName].filter(id => id !== studentId);
    
    // Remove tag from student's tags array
    if (data.students[studentIndex].tags) {
      data.students[studentIndex].tags = data.students[studentIndex].tags.filter(tag => tag !== tagName);
    }
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    return true;
  } catch (error) {
    console.error('Error removing student from tag:', error);
    throw error;
  }
}

module.exports = {
  initDb,
  getAllStudents,
  addStudents,
  updateStudent,
  deleteStudent,
  flushDb,
  repairDb,
  getAllTags,
  createTag,
  deleteTag,
  getStudentsByTag,
  addStudentToTag,
  removeStudentFromTag
};