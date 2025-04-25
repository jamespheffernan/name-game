#!/usr/bin/env node

/**
 * This script adds the remaining students without images to the database
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

async function addMissingStudents() {
  try {
    console.log('Adding missing students to database...');
    
    // Read names from the file
    const namesFilePath = path.join(__dirname, '..', 'extracted_names.txt');
    const namesContent = await fs.readFile(namesFilePath, 'utf8');
    const allNames = namesContent.split('\n').filter(name => name.trim() !== '');
    
    // Get current students from database
    await studentDb.initDb();
    const existingStudents = await studentDb.getAllStudents();
    console.log(`Found ${existingStudents.length} existing students in the database`);
    console.log(`Total names in extracted_names.txt: ${allNames.length}`);
    
    // Get all existing fullNames
    const existingNames = new Set(existingStudents.map(s => s.fullName));
    
    // Find missing students
    const missingNames = allNames.filter(name => !existingNames.has(name));
    console.log(`Found ${missingNames.length} missing students that need to be added`);
    
    if (missingNames.length === 0) {
      console.log('No missing students to add.');
      return;
    }
    
    // Prepare the students to add
    const studentsToAdd = missingNames.map(fullName => {
      // Parse first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      return {
        firstName,
        lastName,
        fullName,
        // Use a placeholder image for missing images
        imagePath: `/uploads/student-images/placeholder.png`
      };
    });
    
    // Create a placeholder image if needed
    const placeholderPath = path.join(__dirname, 'public', 'uploads', 'student-images', 'placeholder.png');
    if (!await fs.pathExists(placeholderPath)) {
      // Create a directory to ensure it exists
      await fs.ensureDir(path.dirname(placeholderPath));
      
      // Copy a random existing image to use as placeholder
      // (We're not creating a new one as that would require graphics libraries)
      const uploadsDir = path.join(__dirname, 'public', 'uploads', 'student-images');
      const existingImages = await fs.readdir(uploadsDir);
      if (existingImages.length > 0) {
        // Take the first image we find as placeholder
        const sourceImage = path.join(uploadsDir, existingImages[0]);
        await fs.copy(sourceImage, placeholderPath);
        console.log(`Created placeholder image from ${existingImages[0]}`);
      } else {
        console.warn("No existing images found to use as placeholder");
      }
    }
    
    // Add students to database
    console.log(`Adding ${studentsToAdd.length} missing students to database...`);
    await studentDb.addStudents(studentsToAdd);
    
    console.log(`Successfully added ${studentsToAdd.length} missing students.`);
    
    // Verify total count
    const finalStudents = await studentDb.getAllStudents();
    console.log(`Final student count: ${finalStudents.length}`);
  } catch (error) {
    console.error('Error adding missing students:', error);
    process.exit(1);
  }
}

// Run the function
addMissingStudents().then(() => {
  console.log('Done adding missing students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});