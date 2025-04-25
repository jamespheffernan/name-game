// Test script for connection service
const connectionService = require('./src/services/connectionService');
const fs = require('fs').promises;
const path = require('path');

async function testConnectionService() {
  try {
    // Read student data
    console.log('Reading student data...');
    const studentsData = JSON.parse(await fs.readFile(path.join(__dirname, 'data/students.json'), 'utf8'));
    
    // Take a subset of students for testing
    const testStudents = studentsData.students.slice(0, 20);
    console.log(`Using ${testStudents.length} students for testing`);
    
    // Test finding a connection between two specific students
    if (testStudents.length >= 2) {
      console.log('\nTesting finding connection between two students:');
      const student1 = testStudents[0];
      const student2 = testStudents[1];
      console.log(`Student 1: ${student1.fullName}`);
      console.log(`Student 2: ${student2.fullName}`);
      
      const connection = connectionService.findConnection(student1, student2);
      if (connection) {
        console.log('Connection found:');
        console.log(connection);
      } else {
        console.log('No connection found between these students');
      }
    }
    
    // Test generating a connection trivia question
    console.log('\nTesting generating a connection trivia question:');
    try {
      const question = connectionService.generateConnectionTrivia(testStudents);
      if (question) {
        console.log('Trivia question generated:');
        console.log(JSON.stringify(question, null, 2));
      } else {
        console.log('Could not generate a trivia question');
      }
    } catch (error) {
      console.error('Error generating trivia question:', error.message);
    }
    
    // Test generating a round of connection trivia
    console.log('\nTesting generating a round of connection trivia:');
    try {
      const questions = connectionService.generateConnectionTriviaRound(testStudents, 3);
      console.log(`Generated ${questions.length} questions`);
      if (questions.length > 0) {
        console.log('First question:');
        console.log(JSON.stringify(questions[0], null, 2));
      }
    } catch (error) {
      console.error('Error generating trivia round:', error.message);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnectionService();