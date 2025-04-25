const studentDb = require('../models/studentDb');
const pdfParser = require('../services/pdfParser');
const path = require('path');
const fs = require('fs-extra');

/**
 * Get student by ID
 */
async function getStudentById(req, res) {
  try {
    const student = await studentDb.getStudentById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
}

/**
 * Get all students
 */
async function getAllStudents(req, res) {
  try {
    const students = await studentDb.getAllStudents();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
}

/**
 * Upload student PDF and process it
 */
async function uploadStudentPDF(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse the PDF to extract student data
    const students = await pdfParser.parseStudentPDF(req.file.path);
    
    // Extract images from the PDF (if they exist)
    const outputDir = path.join(__dirname, '../public/uploads/student-images');
    await fs.ensureDir(outputDir);
    
    // This would be the image extraction logic
    // Currently a placeholder as it requires specialized libraries
    // const imagePaths = await pdfParser.extractImagesFromPDF(req.file.path, outputDir);
    
    // Add students to the database
    const savedStudents = await studentDb.addStudents(students);
    
    res.json({ 
      message: 'PDF processed successfully', 
      studentsAdded: savedStudents.length,
      students: savedStudents
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
}

/**
 * Add a student manually
 */
async function addStudent(req, res) {
  try {
    const { firstName, lastName, tags } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    
    // Parse tags if provided as a string
    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }
    
    const newStudent = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      imagePath: req.file ? `/uploads/student-images/${req.file.filename}` : null,
      tags: parsedTags
    };
    
    const students = await studentDb.addStudents([newStudent]);
    const addedStudent = students[students.length - 1];
    
    // Add student to each tag
    if (parsedTags.length > 0) {
      for (const tag of parsedTags) {
        await studentDb.addStudentToTag(tag, addedStudent.id);
      }
    }
    
    res.status(201).json(addedStudent);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
}

/**
 * Update a student
 */
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    if (req.file) {
      updates.imagePath = `/uploads/student-images/${req.file.filename}`;
    }
    
    // If first and last name are updated, update the full name too
    if (updates.firstName && updates.lastName) {
      updates.fullName = `${updates.firstName} ${updates.lastName}`;
    } else if (updates.firstName) {
      const students = await studentDb.getAllStudents();
      const student = students.find(s => s.id === id);
      if (student) {
        updates.fullName = `${updates.firstName} ${student.lastName}`;
      }
    } else if (updates.lastName) {
      const students = await studentDb.getAllStudents();
      const student = students.find(s => s.id === id);
      if (student) {
        updates.fullName = `${student.firstName} ${updates.lastName}`;
      }
    }
    
    // Handle tags update if provided
    if (updates.tags) {
      // Parse tags if provided as a string
      const parsedTags = typeof updates.tags === 'string' 
        ? JSON.parse(updates.tags) 
        : updates.tags;
      
      // Get current student to compare tags
      const students = await studentDb.getAllStudents();
      const currentStudent = students.find(s => s.id === id);
      
      if (currentStudent) {
        const currentTags = currentStudent.tags || [];
        
        // Remove student from tags that are no longer assigned
        for (const tag of currentTags) {
          if (!parsedTags.includes(tag)) {
            await studentDb.removeStudentFromTag(tag, id);
          }
        }
        
        // Add student to new tags
        for (const tag of parsedTags) {
          if (!currentTags.includes(tag)) {
            await studentDb.addStudentToTag(tag, id);
          }
        }
      }
    }
    
    const updatedStudent = await studentDb.updateStudent(id, updates);
    
    if (!updatedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
}

/**
 * Delete a student
 */
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    
    // Get student's tags before deleting
    const students = await studentDb.getAllStudents();
    const student = students.find(s => s.id === id);
    
    if (student && student.tags) {
      for (const tag of student.tags) {
        await studentDb.removeStudentFromTag(tag, id);
      }
    }
    
    const deleted = await studentDb.deleteStudent(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
}

/**
 * Flush (clear) all students from the database
 */
async function flushStudents(req, res) {
  try {
    await studentDb.flushDb();
    res.json({ message: 'All students have been removed from the database' });
  } catch (error) {
    console.error('Error flushing students:', error);
    res.status(500).json({ error: 'Failed to flush student database' });
  }
}

/**
 * Get all tags
 */
async function getAllTags(req, res) {
  try {
    const tags = await studentDb.getAllTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
}

/**
 * Create a new tag
 */
async function createTag(req, res) {
  try {
    const { tagName, studentIds } = req.body;
    
    if (!tagName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }
    
    const tags = await studentDb.createTag(tagName, studentIds || []);
    res.status(201).json({ tagName, students: studentIds || [], tags });
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error.message && error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create tag' });
  }
}

/**
 * Delete a tag
 */
async function deleteTag(req, res) {
  try {
    const { tagName } = req.params;
    const deleted = await studentDb.deleteTag(tagName);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
}

/**
 * Get students by tag
 */
async function getStudentsByTag(req, res) {
  try {
    const { tagName } = req.params;
    
    console.log(`Controller: Getting students with tag: ${tagName}`);
    
    if (!tagName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }
    
    // Verify tag exists
    const allTags = await studentDb.getAllTags();
    if (!allTags[tagName]) {
      console.log(`Tag "${tagName}" not found`);
      // Return empty array instead of error to prevent UI issues
      return res.json([]);
    }
    
    const students = await studentDb.getStudentsByTag(tagName);
    console.log(`Found ${students.length} students with tag ${tagName}`);
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching students by tag:', error);
    res.status(500).json({ error: 'Failed to fetch students by tag' });
  }
}

/**
 * Add a student to a tag
 */
async function addStudentToTag(req, res) {
  try {
    const { tagName, studentId } = req.body;
    
    if (!tagName || !studentId) {
      return res.status(400).json({ error: 'Tag name and student ID are required' });
    }
    
    const success = await studentDb.addStudentToTag(tagName, studentId);
    
    if (!success) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student added to tag successfully' });
  } catch (error) {
    console.error('Error adding student to tag:', error);
    res.status(500).json({ error: 'Failed to add student to tag' });
  }
}

/**
 * Remove a student from a tag
 */
async function removeStudentFromTag(req, res) {
  try {
    const { tagName, studentId } = req.body;
    
    if (!tagName || !studentId) {
      return res.status(400).json({ error: 'Tag name and student ID are required' });
    }
    
    const success = await studentDb.removeStudentFromTag(tagName, studentId);
    
    if (!success) {
      return res.status(404).json({ error: 'Tag or student not found' });
    }
    
    res.json({ message: 'Student removed from tag successfully' });
  } catch (error) {
    console.error('Error removing student from tag:', error);
    res.status(500).json({ error: 'Failed to remove student from tag' });
  }
}

/**
 * Repair database structure issues
 */
async function repairDatabase(req, res) {
  try {
    await studentDb.repairDb();
    res.json({ message: 'Database repair completed successfully' });
  } catch (error) {
    console.error('Error repairing database:', error);
    res.status(500).json({ error: 'Failed to repair database' });
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  uploadStudentPDF,
  addStudent,
  updateStudent,
  deleteStudent,
  flushStudents,
  getAllTags,
  createTag,
  deleteTag,
  getStudentsByTag,
  addStudentToTag,
  removeStudentFromTag,
  repairDatabase,
  batchAddTag
};

/**
 * Batch add a tag to multiple students
 */
async function batchAddTag(req, res) {
  try {
    const { tagName, studentIds } = req.body;
    
    if (!tagName || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'Valid tag name and array of student IDs are required' });
    }
    
    // Verify the tag exists
    const allTags = await studentDb.getAllTags();
    if (!allTags[tagName]) {
      return res.status(404).json({ error: `Tag "${tagName}" not found` });
    }
    
    // Get all current students
    const allStudents = await studentDb.getAllStudents();
    
    // Track success and failures
    const results = {
      success: [],
      failed: []
    };
    
    // Process each student
    for (const studentId of studentIds) {
      try {
        // Verify student exists
        const student = allStudents.find(s => s.id === studentId);
        if (!student) {
          results.failed.push({ id: studentId, reason: 'Student not found' });
          continue;
        }
        
        // Check if student already has this tag
        const studentTags = student.tags || [];
        if (studentTags.includes(tagName)) {
          results.success.push({ id: studentId, status: 'already tagged' });
          continue;
        }
        
        // Add tag to student
        const success = await studentDb.addStudentToTag(tagName, studentId);
        
        if (success) {
          results.success.push({ id: studentId, status: 'tagged' });
        } else {
          results.failed.push({ id: studentId, reason: 'Failed to add tag' });
        }
      } catch (error) {
        console.error(`Error adding tag to student ${studentId}:`, error);
        results.failed.push({ id: studentId, reason: 'Error during processing' });
      }
    }
    
    res.json({
      message: `Tag "${tagName}" applied to ${results.success.length} students. ${results.failed.length} failures.`,
      results
    });
  } catch (error) {
    console.error('Error in batch tag operation:', error);
    res.status(500).json({ error: 'Failed to apply tag to students' });
  }
}