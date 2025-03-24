#!/usr/bin/env node

/**
 * This script adds the second 16 students (page1) to the database
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

const page1Mapping = [
  { name: "Pritish Bhattacharya", image: "page1_img0.png" },
  { name: "Alex Blomstedt", image: "page1_img1.png" },
  { name: "Amanda Boadi", image: "page1_img2.png" },
  { name: "Marcelo Tigre", image: "page1_img3.png" },
  { name: "George Bourne", image: "page1_img4.png" },
  { name: "Katie Bradﬁeld", image: "page1_img5.png" },
  { name: "Richard Carter", image: "page1_img6.png" },
  { name: "Tim Cayanga", image: "page1_img7.png" },
  { name: "David Cayetano", image: "page1_img8.png" },
  { name: "Sunny Chae", image: "page1_img9.png" },
  { name: "Sambhabi Chanda", image: "page1_img10.png" },
  { name: "Anandita Chandra", image: "page1_img11.png" },
  { name: "Pheerawit Charuvajana", image: "page1_img12.png" },
  { name: "Aeint Myat Chel", image: "page1_img13.png" },
  { name: "Helen Chen", image: "page1_img14.png" },
  { name: "Tony Chen", image: "page1_img15.png" }
];

async function addPage1Students() {
  try {
    console.log('Adding page1 students to database...');
    
    // Get existing students so we know how many we already have
    const existingStudents = await studentDb.getAllStudents();
    const startIndex = existingStudents.length;
    
    console.log(`Found ${existingStudents.length} existing students in the database`);
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    const students = [];
    
    for (let i = 0; i < page1Mapping.length; i++) {
      const mapping = page1Mapping[i];
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
addPage1Students().then(() => {
  console.log('Done adding page1 students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});