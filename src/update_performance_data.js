const fs = require('fs');
const path = require('path');

// Paths to data files
const PERFORMANCE_PATH = path.join(__dirname, '../data/student_performance.json');
const REMAPPED_PATH = path.join(__dirname, '../data/student_performance_remapped.json');
const BACKUP_PATH = path.join(__dirname, '../data/student_performance_backup.json');

// Backup the original performance data
fs.copyFileSync(PERFORMANCE_PATH, BACKUP_PATH);
console.log(`Original performance data backed up to: ${BACKUP_PATH}`);

// Copy the remapped data to the main performance file
fs.copyFileSync(REMAPPED_PATH, PERFORMANCE_PATH);
console.log(`Performance data updated with remapped data.`);

// Verify the number of records in both files
const originalData = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
const newData = JSON.parse(fs.readFileSync(PERFORMANCE_PATH, 'utf8'));

const originalCount = Object.keys(originalData.students).length;
const newCount = Object.keys(newData.students).length;

console.log(`Original record count: ${originalCount}`);
console.log(`New record count: ${newCount}`);
console.log('Update complete!');