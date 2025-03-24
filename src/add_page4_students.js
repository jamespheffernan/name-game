#!/usr/bin/env node

/**
 * This script adds the fifth 16 students (page4) to the database
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

const page4Mapping = [
  { name: "Amritansh Frank", image: "page4_img0 new.png" },
  { name: "Chloe Gao", image: "page4_img1 new.png" },
  { name: "Aydin Garayev", image: "page4_img2 new.png" },
  { name: "Fabian Garcia", image: "page4_img3 new.png" },
  { name: "Nikolai Gerasimov", image: "page4_img4 new.png" },
  { name: "Karthikesh Gnanapragasam", image: "page4_img5 new.png" },
  { name: "Diana Goldenberg", image: "page4_img6 new.png" },
  { name: "Cathie Gou", image: "page4_img7 new.png" },
  { name: "Elle Gough", image: "page4_img8 new.png" },
  { name: "Seki Guan", image: "page4_img9 new.png" },
  { name: "Siddhartha Guha", image: "page4_img10 new.png" },
  { name: "Kevin Haas", image: "page4_img11 new.png" },
  { name: "Shuo Han", image: "page4_img12 new.png" },
  { name: "Fernando Hanhausen", image: "page4_img13 new.png" },
  { name: "Carly Hanselmann", image: "page4_img14 new.png" },
  { name: "Stella Harman", image: "page4_img15 new.png" }
];

async function addPage4Students() {
  try {
    console.log('Adding page4 students to database...');
    
    // Get existing students so we know how many we already have
    const existingStudents = await studentDb.getAllStudents();
    const startIndex = existingStudents.length;
    
    console.log(`Found ${existingStudents.length} existing students in the database`);
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    const students = [];
    
    for (let i = 0; i < page4Mapping.length; i++) {
      const mapping = page4Mapping[i];
      const fullName = mapping.name.trim();
      const imageFile = mapping.image;
      
      // Parse first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Copy the image to our public directory
      const sourcePath = path.join(__dirname, '..', 'extracted_images', imageFile);
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
addPage4Students().then(() => {
  console.log('Done adding page4 students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});