const studentDb = require('../models/studentDb');
const pdfParser = require('../services/pdfParser');
const path = require('path');
const fs = require('fs-extra');

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
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    
    const newStudent = {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      imagePath: req.file ? `/uploads/${req.file.filename}` : null
    };
    
    const students = await studentDb.addStudents([newStudent]);
    res.status(201).json(students[students.length - 1]);
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
    const updates = req.body;
    
    if (req.file) {
      updates.imagePath = `/uploads/${req.file.filename}`;
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

module.exports = {
  getAllStudents,
  uploadStudentPDF,
  addStudent,
  updateStudent,
  deleteStudent,
  flushStudents
};
