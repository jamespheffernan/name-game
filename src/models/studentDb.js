const fs = require('fs-extra');
const path = require('path');

// Path to our JSON "database"
const dbPath = path.join(__dirname, '../../data/students.json');

/**
 * Initialize the student database
 */
async function initDb() {
  try {
    // Make sure the data directory exists
    await fs.ensureDir(path.dirname(dbPath));
    
    // Create an empty students array if the file doesn't exist
    if (!await fs.pathExists(dbPath)) {
      await fs.writeJson(dbPath, { students: [] });
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
    return data.students || [];
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
      id: student.id || `student_${Date.now()}_${index}`
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
    await fs.writeJson(dbPath, { students: [] }, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error flushing database:', error);
    throw error;
  }
}

module.exports = {
  initDb,
  getAllStudents,
  addStudents,
  updateStudent,
  deleteStudent,
  flushDb
};
