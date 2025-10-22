const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const schemaPath = path.join(__dirname, 'database.sqlite.sql');

// Remove existing database
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Existing database removed');
}

// Create new database
const db = new sqlite3.Database(dbPath);

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf8');

db.exec(schema, (err) => {
  if (err) {
    console.error('Error creating database:', err);
  } else {
    console.log('Database created successfully!');
  }
  db.close();
});