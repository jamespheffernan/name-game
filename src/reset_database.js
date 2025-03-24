#!/usr/bin/env node

/**
 * This script resets the database to an empty state.
 */

const studentDb = require('./models/studentDb');

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    await studentDb.flushDb();
    console.log('Database has been reset. The students.json file now contains an empty array.');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase().then(() => {
  console.log('Reset completed successfully.');
}).catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});