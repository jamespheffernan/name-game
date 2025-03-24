const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const studentController = require('../controllers/studentController');

// Set up file upload storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Get all students
router.get('/', studentController.getAllStudents);

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

module.exports = router;
