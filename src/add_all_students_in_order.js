#!/usr/bin/env node

/**
 * This script adds all students to the database in the correct order,
 * matching each student with their corresponding image
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

async function addAllStudentsInOrder() {
  try {
    console.log('Adding all students in correct order...');
    
    // Read the student names from the extracted names file
    const namesFilePath = path.join(__dirname, '..', 'extracted_names.txt');
    const namesContent = await fs.readFile(namesFilePath, 'utf8');
    const allNames = namesContent.split('\n')
      .filter(name => name.trim() !== '')
      .map(name => name.trim());

    console.log(`Found ${allNames.length} student names in extracted_names.txt`);

    // Get all image files (assuming they are already named in order)
    const extractedImagesDir = path.join(__dirname, '..', 'extracted_images');
    const allImageFiles = await fs.readdir(extractedImagesDir);
    
    // Filter for png files and sort them in a logical order
    const imageFiles = allImageFiles
      .filter(file => file.endsWith('.png'))
      .sort((a, b) => {
        // Extract page and image numbers
        const pageA = parseInt(a.match(/page(\d+)/)?.[1] || '0', 10);
        const pageB = parseInt(b.match(/page(\d+)/)?.[1] || '0', 10);
        
        if (pageA !== pageB) return pageA - pageB;
        
        const imgA = parseInt(a.match(/img(\d+)/)?.[1] || '0', 10);
        const imgB = parseInt(b.match(/img(\d+)/)?.[1] || '0', 10);
        
        return imgA - imgB;
      });

    console.log(`Found ${imageFiles.length} images in extracted_images directory`);

    // Make sure we have the same number of students and images
    if (allNames.length !== imageFiles.length) {
      console.warn(`Warning: Number of student names (${allNames.length}) doesn't match number of images (${imageFiles.length})`);
      console.log('Will use placeholder images for missing students');
    }

    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);

    // Process each student
    const students = [];

    for (let i = 0; i < allNames.length; i++) {
      const fullName = allNames[i];
      const imageFile = i < imageFiles.length ? imageFiles[i] : null;

      // Parse first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Prepare the target filename
      const targetFilename = `student_${i + 1}.png`;
      const targetPath = path.join(studentImagesDir, targetFilename);

      // Copy the image if available
      if (imageFile) {
        const sourcePath = path.join(extractedImagesDir, imageFile);
        await fs.copy(sourcePath, targetPath);
        console.log(`Processed: ${fullName} with image ${imageFile}`);
      } else {
        // Use a placeholder image
        console.log(`No image for: ${fullName}, using placeholder`);
        // Just create an empty file as placeholder for now
        await fs.writeFile(targetPath, '');
      }

      const student = {
        firstName,
        lastName,
        fullName,
        imagePath: `/uploads/student-images/${targetFilename}`
      };

      students.push(student);
    }

    // Add students to database
    console.log(`Adding ${students.length} students to database...`);
    await studentDb.addStudents(students);

    console.log(`Successfully added ${students.length} students.`);

    // Verify final count
    const finalStudents = await studentDb.getAllStudents();
    console.log(`Final student count: ${finalStudents.length}`);
  } catch (error) {
    console.error('Error adding students:', error);
    process.exit(1);
  }
}

// Run the function
addAllStudentsInOrder().then(() => {
  console.log('Done adding all students in order.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});