#!/usr/bin/env node

const pdfParser = require('./services/pdfParser');
const studentDb = require('./models/studentDb');
const fs = require('fs-extra');
const path = require('path');

const [,, command, ...args] = process.argv;

async function main() {
  try {
    switch(command) {
      case 'parse-pdf':
        if (!args[0]) {
          console.error('Error: PDF path is required');
          console.log('Usage: node cli.js parse-pdf <pdf-path>');
          process.exit(1);
        }
        await parsePdf(args[0]);
        break;
        
      case 'list-students':
        await listStudents();
        break;
        
      case 'add-student':
        if (args.length < 2) {
          console.error('Error: First name and last name are required');
          console.log('Usage: node cli.js add-student <first-name> <last-name> [image-path]');
          process.exit(1);
        }
        await addStudent(args[0], args[1], args[2]);
        break;
        
      case 'delete-student':
        if (!args[0]) {
          console.error('Error: Student ID is required');
          console.log('Usage: node cli.js delete-student <student-id>');
          process.exit(1);
        }
        await deleteStudent(args[0]);
        break;
        
      case 'flush-db':
        if (args[0] !== '--confirm') {
          console.error('Warning: This will delete ALL students from the database');
          console.log('To confirm, use: node cli.js flush-db --confirm');
          process.exit(1);
        }
        await flushDatabase();
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function parsePdf(pdfPath) {
  console.log(`Parsing PDF: ${pdfPath}`);
  
  // Check if the file exists
  if (!await fs.pathExists(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }
  
  // Parse the PDF
  const students = await pdfParser.parseStudentPDF(pdfPath);
  console.log(`Found ${students.length} students in the PDF`);
  
  // Add students to the database
  await studentDb.addStudents(students);
  console.log(`Added ${students.length} students to the database`);
  
  // Display the students
  students.forEach(student => {
    console.log(`- ${student.fullName}`);
  });
}

async function listStudents() {
  const students = await studentDb.getAllStudents();
  
  if (students.length === 0) {
    console.log('No students in the database');
    return;
  }
  
  console.log(`Found ${students.length} students:`);
  students.forEach(student => {
    console.log(`- ${student.id}: ${student.fullName} ${student.imagePath ? '(has image)' : '(no image)'}`);
  });
}

async function addStudent(firstName, lastName, imagePath) {
  const student = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    imagePath: imagePath || null
  };
  
  await studentDb.addStudents([student]);
  console.log(`Added student: ${student.fullName}`);
}

async function deleteStudent(studentId) {
  const result = await studentDb.deleteStudent(studentId);
  
  if (result) {
    console.log(`Deleted student with ID: ${studentId}`);
  } else {
    console.log(`No student found with ID: ${studentId}`);
  }
}

async function flushDatabase() {
  try {
    await studentDb.flushDb();
    console.log('Successfully removed all students from the database');
  } catch (error) {
    throw new Error(`Failed to flush database: ${error.message}`);
  }
}

function showHelp() {
  console.log(`
Name Game CLI Tool

Usage:
  node cli.js <command> [options]

Commands:
  parse-pdf <pdf-path>                         Parse a PDF file and import students
  list-students                                List all students in the database
  add-student <first-name> <last-name> [image] Add a student manually
  delete-student <student-id>                  Delete a student by ID
  flush-db --confirm                           Remove ALL students from the database
  help                                         Show this help message
  `);
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});