#!/usr/bin/env node

/**
 * This script adds the first 16 students (page0) to the database
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

const page0Mapping = [
  { name: "Daiki Abe", image: "page0_img0.png" },
  { name: "Vidia Adhyarini", image: "page0_img1.png" },
  { name: "Gabriel Adi", image: "page0_img2.png" },
  { name: "Bassam Al-Bassam", image: "page0_img3.png" },
  { name: "Mauricio Alcantara", image: "page0_img4.png" },
  { name: "Felipe Aldana", image: "page0_img5.png" },
  { name: "Mai Allhaidan", image: "page0_img6.png" },
  { name: "Thidaporn Anantasa", image: "page0_img7.png" },
  { name: "Todd Anderson", image: "page0_img8.png" },
  { name: "Mateo Agustin Aponte", image: "page0_img9.png" },
  { name: "Hrithu Olickel", image: "page0_img10.png" },
  { name: "Asad Ashraf", image: "page0_img11.png" },
  { name: "Maxim Baban", image: "page0_img12.png" },
  { name: "Alex Shan Bai", image: "page0_img13.png" },
  { name: "Ishika Bansal", image: "page0_img14.png" },
  { name: "Angelo Berlingieri", image: "page0_img15.png" }
];

async function addPage0Students() {
  try {
    console.log('Adding page0 students to database...');
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    const students = [];
    
    for (let i = 0; i < page0Mapping.length; i++) {
      const mapping = page0Mapping[i];
      const fullName = mapping.name.trim();
      const imageFile = mapping.image;
      
      // Parse first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Copy the image to our public directory
      const sourcePath = path.join(__dirname, '..', 'extracted_images', imageFile);
      const targetFilename = `student_${i + 1}.png`;
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
addPage0Students().then(() => {
  console.log('Done adding page0 students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});