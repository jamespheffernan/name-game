#!/usr/bin/env node

/**
 * This script adds the fourth 16 students (page3) to the database
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

const page3Mapping = [
  { name: "Alex Dickson-Axt", image: "page3_img0 new.png" },
  { name: "Chris Ding", image: "page3_img1 new.png" },
  { name: "Libey Djath", image: "page3_img2 new.png" },
  { name: "Natalya Doris", image: "page3_img3 new.png" },
  { name: "Catherine Dorman", image: "page3_img4 new.png" },
  { name: "Alisa Dudareva", image: "page3_img5 new.png" },
  { name: "Oyyi Eﬀendi", image: "page3_img6 new.png" },
  { name: "Sam Eisenberg", image: "page3_img7 new.png" },
  { name: "Rémy El Youssef", image: "page3_img8.png" },
  { name: "Floris Eland", image: "page3_img9 new.png" },
  { name: "Estefania Read Elizalde", image: "page3_img10 new.png" },
  { name: "Quinn Farrugia", image: "page3_img11 new.png" },
  { name: "Azra Fazal", image: "page3_img12 new.png" },
  { name: "Anthony Fencl", image: "page3_img13 new.png" },
  { name: "Tom Ford", image: "page3_img14 new.png" },
  { name: "Eliott Fournet", image: "page3_img15 new.png" }
];

async function addPage3Students() {
  try {
    console.log('Adding page3 students to database...');
    
    // Get existing students so we know how many we already have
    const existingStudents = await studentDb.getAllStudents();
    const startIndex = existingStudents.length;
    
    console.log(`Found ${existingStudents.length} existing students in the database`);
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    const students = [];
    
    for (let i = 0; i < page3Mapping.length; i++) {
      const mapping = page3Mapping[i];
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
addPage3Students().then(() => {
  console.log('Done adding page3 students.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});