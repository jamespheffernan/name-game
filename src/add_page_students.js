#!/usr/bin/env node

/**
 * This script adds students from a specific page to the database
 * Usage: node add_page_students.js <page_number> <start_name_index>
 * Example: node add_page_students.js 5 80
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

// Get command line arguments
const pageNumber = process.argv[2];
const startNameIndex = parseInt(process.argv[3], 10);

if (!pageNumber || isNaN(startNameIndex)) {
  console.error('Usage: node add_page_students.js <page_number> <start_name_index>');
  console.error('Example: node add_page_students.js 5 80');
  process.exit(1);
}

async function addPageStudents() {
  try {
    console.log(`Adding page${pageNumber} students to database...`);
    
    // Read names from the file
    const namesFilePath = path.join(__dirname, '..', 'extracted_names.txt');
    const namesContent = await fs.readFile(namesFilePath, 'utf8');
    const allNames = namesContent.split('\n').filter(name => name.trim() !== '');
    
    // Get the names for this page (usually 16 names per page)
    const pageNames = allNames.slice(startNameIndex, startNameIndex + 16);
    
    // Find all image files for this page
    const imagesDir = path.join(__dirname, '..', 'extracted_images');
    const allFiles = await fs.readdir(imagesDir);
    const pageImages = allFiles
      .filter(file => file.startsWith(`page${pageNumber}_img`) && file.endsWith('.png'))
      .sort((a, b) => {
        // Extract image numbers for proper sorting
        const getNumber = (filename) => {
          const match = filename.match(/img(\d+)/);
          return match ? parseInt(match[1], 10) : 999;
        };
        return getNumber(a) - getNumber(b);
      });
    
    console.log(`Found ${pageNames.length} names and ${pageImages.length} images for page ${pageNumber}`);
    
    if (pageNames.length === 0 || pageImages.length === 0) {
      console.error('Error: No names or images found for this page');
      process.exit(1);
    }
    
    if (pageNames.length !== pageImages.length) {
      console.warn(`Warning: Number of names (${pageNames.length}) doesn't match number of images (${pageImages.length})`);
      console.log('Will use the smaller of the two counts');
    }
    
    // Create page mapping
    const pageMapping = [];
    const count = Math.min(pageNames.length, pageImages.length);
    
    for (let i = 0; i < count; i++) {
      pageMapping.push({
        name: pageNames[i],
        image: pageImages[i]
      });
    }
    
    // Get existing students to determine starting index
    const existingStudents = await studentDb.getAllStudents();
    const startIndex = existingStudents.length;
    
    console.log(`Found ${existingStudents.length} existing students in the database`);
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    const students = [];
    
    for (let i = 0; i < pageMapping.length; i++) {
      const mapping = pageMapping[i];
      const fullName = mapping.name.trim();
      const imageFile = mapping.image;
      
      // Parse first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Copy the image to our public directory
      const sourcePath = path.join(imagesDir, imageFile);
      const targetFilename = `student_${startIndex + i + 1}.png`;
      const targetPath = path.join(studentImagesDir, targetFilename);
      
      await fs.copy(sourcePath, targetPath);
      
      const student = {
        firstName,
        lastName,
        fullName,
        imagePath: `/uploads/student-images/${targetFilename}`
      };
      
      students.push(student);
      console.log(`Processed: ${fullName} with image ${imageFile}`);
    }
    
    // Add students to database
    console.log('Adding students to database...');
    await studentDb.addStudents(students);
    
    console.log(`Successfully added ${students.length} students.`);
  } catch (error) {
    console.error('Error adding students:', error);
    process.exit(1);
  }
}

// Run the function
addPageStudents().then(() => {
  console.log(`Done adding page${pageNumber} students.`);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});