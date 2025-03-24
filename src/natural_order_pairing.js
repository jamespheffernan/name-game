#!/usr/bin/env node

/**
 * This script pairs student names with images using natural order sorting
 * to ensure the page0_img1, page0_img2, ... page0_img10 sequence is correct.
 */

const fs = require('fs-extra');
const path = require('path');
const studentDb = require('./models/studentDb');

// Natural sort comparison function
function naturalCompare(a, b) {
  const ax = [], bx = [];
  
  a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { 
    ax.push([$1 || Infinity, $2 || ""]);
  });
  
  b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { 
    bx.push([$1 || Infinity, $2 || ""]);
  });
  
  while(ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();
    const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
    if(nn) return nn;
  }
  
  return ax.length - bx.length;
}

async function pairStudentsNaturalOrder() {
  try {
    console.log('Starting student pairing using natural order sorting...');
    
    // Read the list of names
    const namesFilePath = path.join(__dirname, '..', 'extracted_names.txt');
    const namesContent = await fs.readFile(namesFilePath, 'utf8');
    const names = namesContent.split('\n').filter(name => name.trim() !== '');
    
    console.log(`Found ${names.length} names in the file.`);
    
    // Get the list of image files
    const imagesDir = path.join(__dirname, '..', 'extracted_images');
    const imageFiles = await fs.readdir(imagesDir);
    
    // Filter out hidden files and non-PNG files
    const pngImages = imageFiles.filter(file => 
      !file.startsWith('.') && file.endsWith('.png')
    );
    
    // Split page and image number for proper sorting
    const imageData = pngImages.map(file => {
      const match = file.match(/page(\d+)_img(\d+)\.png/);
      if (match) {
        return {
          filename: file,
          page: parseInt(match[1], 10),
          img: parseInt(match[2], 10)
        };
      }
      return { filename: file, page: 999, img: 999 };
    });
    
    // First sort by page number, then by image number
    imageData.sort((a, b) => {
      if (a.page !== b.page) {
        return a.page - b.page;
      }
      return a.img - b.img;
    });
    
    // Extract the sorted filenames
    const sortedImages = imageData.map(item => item.filename);
    
    console.log(`Found ${sortedImages.length} PNG images in the directory.`);
    
    // Check for mismatch
    if (names.length !== sortedImages.length) {
      console.warn(`Warning: Number of names (${names.length}) doesn't match number of images (${sortedImages.length})`);
      console.log('Will use the smaller of the two counts.');
    }
    
    // Display the first few and last few pairs to verify
    console.log('\nFirst 10 name-image pairs:');
    for (let i = 0; i < Math.min(10, names.length, sortedImages.length); i++) {
      console.log(`${i+1}. ${names[i].padEnd(30)} -> ${sortedImages[i]} (Page ${imageData[i].page}, Img ${imageData[i].img})`);
    }
    
    console.log('\nLast 10 name-image pairs:');
    const offset = Math.min(names.length, sortedImages.length) - 10;
    for (let i = offset; i < Math.min(names.length, sortedImages.length); i++) {
      console.log(`${i+1}. ${names[i].padEnd(30)} -> ${sortedImages[i]} (Page ${imageData[i].page}, Img ${imageData[i].img})`);
    }
    
    // Create student records
    const students = [];
    const limit = Math.min(names.length, sortedImages.length);
    
    // Ensure the uploads directory exists
    const studentImagesDir = path.join(__dirname, 'public', 'uploads', 'student-images');
    await fs.ensureDir(studentImagesDir);
    
    // Process each student
    for (let i = 0; i < limit; i++) {
      const fullName = names[i].trim();
      const imageFile = sortedImages[i];
      
      // Parse first and last name
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      
      // Copy the image to our public directory
      const sourcePath = path.join(imagesDir, imageFile);
      const targetFilename = `student_${i + 1}.png`;
      const targetPath = path.join(studentImagesDir, targetFilename);
      
      await fs.copy(sourcePath, targetPath);
      
      const student = {
        firstName,
        lastName,
        fullName,
        imagePath: `/uploads/student-images/${targetFilename}`,
        sourceImage: imageFile, // Store original for reference
        pageNum: imageData[i].page,
        imgNum: imageData[i].img
      };
      
      students.push(student);
      
      if ((i + 1) % 20 === 0 || i === limit - 1) {
        console.log(`Processed ${i + 1} students...`);
      }
    }
    
    // Add students to database
    console.log('Adding students to database...');
    await studentDb.flushDb(); // Clear existing students
    await studentDb.addStudents(students);
    
    console.log(`Successfully imported ${students.length} students.`);
    return students;
  } catch (error) {
    console.error('Error pairing students:', error);
    process.exit(1);
  }
}

// Run the pairing function
pairStudentsNaturalOrder().then(students => {
  console.log('Pairing completed successfully.');
  
  // Output summary statistics
  const imagesByPage = {};
  students.forEach(student => {
    const page = student.pageNum;
    imagesByPage[page] = (imagesByPage[page] || 0) + 1;
  });
  
  console.log('\nImages per page:');
  Object.entries(imagesByPage).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([page, count]) => {
      console.log(`Page ${page}: ${count} images`);
    });
  
  // Create mapping file for reference
  const mappingPath = path.join(__dirname, '..', 'student_image_mapping.txt');
  const mappingContent = students.map((student, index) => 
    `${index+1}. ${student.fullName.padEnd(30)} -> ${student.sourceImage} (Page ${student.pageNum}, Img ${student.imgNum})`
  ).join('\n');
  
  fs.writeFileSync(mappingPath, mappingContent);
  console.log(`\nMapping file created at: ${mappingPath}`);
  
}).catch(err => {
  console.error('Pairing failed:', err);
  process.exit(1);
});