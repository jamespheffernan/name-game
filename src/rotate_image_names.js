#!/usr/bin/env node

/**
 * This script rotates image names within each page starting from page6
 * The rotation is: img0 -> img8 new, img1 -> img9 new, etc.
 * It's a circular rotation where img8 -> img0 new, img9 -> img1 new, etc.
 */

const fs = require('fs-extra');
const path = require('path');

async function rotateImageNames() {
  try {
    console.log('Rotating image names from page6 onwards...');
    
    // Get all image files
    const imagesDir = path.join(__dirname, '..', 'extracted_images');
    const allFiles = await fs.readdir(imagesDir);
    
    // Filter for page6 and above
    const targetFiles = allFiles.filter(file => {
      return file.match(/^page[6-9]|page1[0-9]/i) && file.endsWith('.png');
    });
    
    console.log(`Found ${targetFiles.length} images from page6 onwards`);
    
    // Group files by page
    const filesByPage = {};
    
    for (const file of targetFiles) {
      const pageMatch = file.match(/^page(\d+)/i);
      if (pageMatch) {
        const page = pageMatch[1];
        if (!filesByPage[page]) {
          filesByPage[page] = [];
        }
        filesByPage[page].push(file);
      }
    }
    
    // Sort files within each page by their current image number
    for (const page in filesByPage) {
      filesByPage[page].sort((a, b) => {
        const getImgNum = (filename) => {
          const match = filename.match(/img(\d+)/i);
          return match ? parseInt(match[1], 10) : 999;
        };
        
        return getImgNum(a) - getImgNum(b);
      });
    }
    
    // Rotate and rename the files
    const renamingOperations = [];
    
    for (const page in filesByPage) {
      const files = filesByPage[page];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imgNumMatch = file.match(/img(\d+)/i);
        
        if (imgNumMatch) {
          const currentNum = parseInt(imgNumMatch[1], 10);
          // Rotate the number: 0->8, 1->9, 2->10, ..., 8->0, 9->1, ...
          const newNum = (currentNum + 8) % 16;
          
          const oldPath = path.join(imagesDir, file);
          const newName = file.replace(/img\d+/i, `img${newNum} new`);
          const newPath = path.join(imagesDir, newName);
          
          renamingOperations.push({ oldPath, newPath, oldName: file, newName });
        }
      }
    }
    
    // Execute the renaming operations
    for (const op of renamingOperations) {
      await fs.rename(op.oldPath, op.newPath);
      console.log(`Renamed: ${op.oldName} -> ${op.newName}`);
    }
    
    console.log(`Successfully rotated ${renamingOperations.length} image names.`);
  } catch (error) {
    console.error('Error rotating image names:', error);
    process.exit(1);
  }
}

// Run the function
rotateImageNames().then(() => {
  console.log('Done rotating image names.');
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});