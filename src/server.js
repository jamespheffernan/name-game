const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs-extra');

// Import routes and models
const studentRoutes = require('./routes/students');
const gameRoutes = require('./routes/game');
const studentDb = require('./models/studentDb');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to be more permissive for debugging
const corsOptions = {
  origin: '*', // Allow all origins for debugging
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware with more detailed information
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Set up file upload storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, 'public/uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// API routes
app.use('/api/students', studentRoutes);
app.use('/api/game', gameRoutes);

// Debug route to check if server is responding
app.get('/api/healthcheck', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Backup route for game tags in case the router is having issues
app.get('/api/game/tags-backup', async (req, res) => {
  try {
    const tags = await studentDb.getAllTags();
    
    // For each tag, count the number of students with images
    const tagsWithCounts = {};
    for (const [tagName, studentIds] of Object.entries(tags)) {
      const students = await studentDb.getStudentsByTag(tagName);
      const studentsWithImages = students.filter(student => student.imagePath);
      
      tagsWithCounts[tagName] = {
        count: studentIds.length,
        imageCount: studentsWithImages.length,
        canPlay: studentsWithImages.length >= 5
      };
    }
    
    res.json(tagsWithCounts);
  } catch (error) {
    console.error('Error fetching game tags (backup route):', error);
    res.status(500).json({ error: 'Failed to fetch game tags', details: error.message });
  }
});

// Initialize database before starting server
(async () => {
  try {
    console.log('Initializing database...');
    await studentDb.initDb();
    console.log('Database initialization complete');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Access the app at http://localhost:${PORT}`);
      console.log('Using explicit IP binding: 0.0.0.0');
    });
  } catch (err) {
    console.error('Failed to initialize database:', err);
    console.error('Server startup aborted');
    process.exit(1);
  }
})();
