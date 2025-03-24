#!/usr/bin/env node

/**
 * This script adds the remaining students (page6 and onwards) to the database
 * using the rotated image filenames
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

async function addRemainingPages() {
  try {
    console.log('Adding remaining students (page6 onwards) to database...');
    
    // Read names from the file
    const namesFilePath = path.join(__dirname, '..', 'extracted_names.txt');
    const namesContent = await fs.readFile(namesFilePath, 'utf8');
    const allNames = namesContent.split('\n').filter(name => name.trim() !== '');
    
    // Get current student count to determine starting index for names
    const existingStudents = await studentDb.getAllStudents();
    const startNameIndex = existingStudents.length;
    
    console.log(`Found ${existingStudents.length} existing students in the database`);
    console.log(`Will start adding students from name index ${startNameIndex}`);
    
    // Get the remaining names
    const remainingNames = allNames.slice(startNameIndex);
    console.log(`Found ${remainingNames.length} remaining student names to add`);
    
    // Define page ranges to add
    const pagesToAdd = [];
    let currentNameIndex = startNameIndex;
    
    // For each page from 6 until we've added all names
    for (let page = 6; currentNameIndex < allNames.length; page++) {
      // Typically 16 students per page, but the last page might have fewer
      const namesForPage = Math.min(16, allNames.length - currentNameIndex);
      
      pagesToAdd.push({
        page: page.toString(),
        nameStartIndex: currentNameIndex,
        nameCount: namesForPage
      });
      
      currentNameIndex += namesForPage;
    }
    
    console.log(`Will add students from ${pagesToAdd.length} pages`);
    
    // Process each page
    const allAddedStudents = [];
    
    for (const pageInfo of pagesToAdd) {
      console.log(`Processing page ${pageInfo.page} with ${pageInfo.nameCount} students...`);
      
      // Get the names for this page
      const pageNames = allNames.slice(
        pageInfo.nameStartIndex, 
        pageInfo.nameStartIndex + pageInfo.nameCount
      );
      
      // Find all image files for this page
      const imagesDir = path.join(__dirname, '..', 'extracted_images');
      const allFiles = await fs.readdir(imagesDir);
      const pageImages = allFiles
        .filter(file => file.startsWith(`page${pageInfo.page}_img`) && file.endsWith('.png'))
        .sort((a, b) => {
          // Extract image numbers for proper sorting
          const getNumber = (filename) => {
            const match = filename.match(/img(\d+)/);
            return match ? parseInt(match[1], 10) : 999;
          };
          return getNumber(a) - getNumber(b);
        });
      
      console.log(`Found ${pageNames.length} names and ${pageImages.length} images for page ${pageInfo.page}`);
      
      if (pageNames.length === 0 || pageImages.length === 0) {
        console.warn(`Skipping page ${pageInfo.page} due to missing names or images`);
        continue;
      }
      
      if (pageNames.length !== pageImages.length) {
        console.warn(`Warning: Number of names (${pageNames.length}) doesn't match number of images (${pageImages.length}) for page ${pageInfo.page}`);
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
      
      // Ensure the uploads directory exists
      const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
      await fs.ensureDir(studentImagesDir);
      
      // Process each student
      const students = [];
      const startIndex = existingStudents.length + allAddedStudents.length;
      
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
      
      // Add students to database for this page
      console.log(`Adding ${students.length} students from page ${pageInfo.page} to database...`);
      await studentDb.addStudents(students);
      
      // Add to our tracking
      allAddedStudents.push(...students);
    }
    
    console.log(`Successfully added ${allAddedStudents.length} students from remaining pages.`);
  } catch (error) {
    console.error('Error adding remaining students:', error);
    process.exit(1);
  }
}

// Run the function
addRemainingPages().then(() => {
  console.log('Done adding remaining students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});