const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const studentController = require('../controllers/studentController');
const studentDb = require('../models/studentDb');

// Set up file upload storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // For PDF files, use the main uploads folder
    if (file.fieldname === 'pdf') {
      const uploadDir = path.join(__dirname, '../public/uploads');
      fs.ensureDirSync(uploadDir);
      cb(null, uploadDir);
    } 
    // For student images, use the student-images folder
    else {
      const studentImagesDir = path.join(__dirname, '../public/uploads/student-images');
      fs.ensureDirSync(studentImagesDir);
      cb(null, studentImagesDir);
    }
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Student Routes

// Get all students
router.get('/', studentController.getAllStudents);

// Tag Routes (placed before student ID route to prevent conflict)

// Get all tags
router.get('/tags', studentController.getAllTags);

// Backup route for tags in case the main endpoint has issues
router.get('/tags-backup', studentController.getAllTags);

// Direct database access route for tags bypassing the controller
router.get('/tags-direct', async (req, res) => {
  try {
    console.log('Direct DB route: Fetching tags from database...');
    const tags = await studentDb.getAllTags();
    console.log(`Direct DB route: Retrieved ${Object.keys(tags).length} tags`);
    res.json(tags);
  } catch (error) {
    console.error('Direct DB route: Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Get student by ID - keep this after /tags routes
router.get('/:id', studentController.getStudentById);

// Upload student PDF
router.post('/upload-pdf', upload.single('pdf'), studentController.uploadStudentPDF);

// Add a new student manually
router.post('/', upload.single('image'), studentController.addStudent);

// Update a student
router.put('/:id', upload.single('image'), studentController.updateStudent);

// Delete a student
router.delete('/:id', studentController.deleteStudent);

// Flush all students
router.delete('/', studentController.flushStudents);

// Tag Routes

// Get all tags
router.get('/tags', studentController.getAllTags);

// Backup route for tags in case the main endpoint has issues
router.get('/tags-backup', studentController.getAllTags);

// Direct database access route for tags bypassing the controller
router.get('/tags-direct', async (req, res) => {
  try {
    console.log('Direct DB route: Fetching tags from database...');
    const tags = await studentDb.getAllTags();
    console.log(`Direct DB route: Retrieved ${Object.keys(tags).length} tags`);
    res.json(tags);
  } catch (error) {
    console.error('Direct DB route: Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create a new tag
router.post('/tags', studentController.createTag);

// Delete a tag
router.delete('/tags/:tagName', studentController.deleteTag);

// Get students by tag
router.get('/tags/:tagName/students', studentController.getStudentsByTag);

// Add student to tag
router.post('/tags/add-student', studentController.addStudentToTag);

// Remove student from tag
router.post('/tags/remove-student', studentController.removeStudentFromTag);

// Batch add tag to multiple students
router.post('/batch-tag', studentController.batchAddTag);

// Repair database - handles corrupted tags data
router.post('/repair', studentController.repairDatabase);

module.exports = router;