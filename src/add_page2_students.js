#!/usr/bin/env node

/**
 * This script adds the third 16 students (page2) to the database
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

const page2Mapping = [
  { name: "Yun-Hsin Chen", image: "page2_img0.png" },
  { name: "Chi-Cheng Cheng", image: "page2_img1.png" },
  { name: "Iris Cheung", image: "page2_img2.png" },
  { name: "Brianna Chiyo", image: "page2_img3.png" },
  { name: "Henry Chou", image: "page2_img4.png" },
  { name: "Paul Christodoulou", image: "page2_img5.png" },
  { name: "Chidinma Chukwuma", image: "page2_img6.png" },
  { name: "Claire Collins", image: "page2_img7.png" },
  { name: "Christian Conitsiotis", image: "page2_img8.png" },
  { name: "Ben Cook", image: "page2_img9.png" },
  { name: "Juan Ignacio Corcuera", image: "page2_img10.png" },
  { name: "Rachel Cottam", image: "page2_img11.png" },
  { name: "Paporn Daraseneeyakul", image: "page2_img12.png" },
  { name: "Shuyi Deng", image: "page2_img13.png" },
  { name: "Dharma Dev", image: "page2_img14.png" },
  { name: "Sander D'hondt", image: "page2_img15.png" }
];

async function addPage2Students() {
  try {
    console.log('Adding page2 students to database...');
    
    // Get existing students so we know how many we already have
    const existingStudents = await studentDb.getAllStudents();
    const startIndex = existingStudents.length;
    
    console.log(`Found ${existingStudents.length} existing students in the database`);
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    const students = [];
    
    for (let i = 0; i < page2Mapping.length; i++) {
      const mapping = page2Mapping[i];
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
addPage2Students().then(() => {
  console.log('Done adding page2 students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});