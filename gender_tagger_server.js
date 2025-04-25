const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const app = express();
const port = 3001;

// Enable JSON parsing for POST requests
app.use(express.json({ limit: '10mb' }));

// Serve static files from the current directory
app.use(express.static(__dirname));
// Also serve from the src/public directory for images
app.use('/src/public', express.static(path.join(__dirname, 'src', 'public')));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Serve gender tagger UI (deprecated)
app.get('/gender-tagger', (req, res) => {
  res.sendFile(path.join(__dirname, 'gender_tagger.html'));
});

// Serve the new universal student tagger UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'student_tagger.html'));
});

// Repair the database before starting
async function repairDatabase() {
  try {
    console.log('Repairing database...');
    const dbPath = path.join(__dirname, 'data', 'students.json');
    // Read the database
    const data = await fs.readJson(dbPath);
    
    // Check for tag object
    if (!data.tags || typeof data.tags !== 'object') {
      console.log('Creating tags object');
      data.tags = {};
    }
    
    // Find all unique tags from students
    const uniqueTags = new Set();
    data.students.forEach(student => {
      if (student.tags && Array.isArray(student.tags)) {
        student.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    
    console.log(`Found ${uniqueTags.size} unique tags in student records: ${[...uniqueTags].join(', ')}`);
    
    // Ensure all tags exist in the tags object
    uniqueTags.forEach(tag => {
      if (!data.tags[tag]) data.tags[tag] = [];
    });
    
    // Create a counter for each tag
    const tagCounts = {};
    uniqueTags.forEach(tag => {
      tagCounts[tag] = 0;
    });
    
    // Add students to appropriate tag lists
    data.students.forEach(student => {
      // Make sure student has a tags array
      if (!student.tags) student.tags = [];
      
      // Process each tag for this student
      student.tags.forEach(tag => {
        if (uniqueTags.has(tag) && !data.tags[tag].includes(student.id)) {
          data.tags[tag].push(student.id);
          tagCounts[tag]++;
        }
      });
    });
    
    // Report results
    const countReport = Object.entries(tagCounts)
      .map(([tag, count]) => `${count} students to "${tag}"`)
      .join(', ');
    console.log(`Added: ${countReport}`);
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    console.log('Database repair completed successfully');
    
  } catch (error) {
    console.error('Error repairing database:', error);
  }
}

// API endpoint to save updated students data
app.post('/api/save-students', async (req, res) => {
  try {
    const studentsPath = path.join(__dirname, 'data', 'students.json');
    const backupPath = `${studentsPath}.gender_backup_${Date.now()}`;
    const isPartialUpdate = req.body.partial === true;
    
    console.log(`Processing save request - ${req.body.students.length} students${isPartialUpdate ? ' (partial update)' : ''}`);
    
    // Create backup if needed
    // Always backup for full saves, or for the first chunk of partial saves
    if (!isPartialUpdate || req.body.startIndex === 0) {
      fs.copyFileSync(studentsPath, backupPath);
      console.log('Backup created:', backupPath);
    }
    
    // Get existing data
    const currentData = await fs.readJson(studentsPath);
    
    // Handle partial updates differently from full updates
    let newData;
    
    if (isPartialUpdate) {
      // This is a partial update, we need to merge with existing data
      const startIndex = req.body.startIndex || 0;
      const chunk = req.body.students;
      
      console.log(`Applying partial update: ${chunk.length} students starting at index ${startIndex}`);
      
      // Create a map of student IDs to their updated data for quick lookups
      const studentUpdates = new Map();
      chunk.forEach(student => {
        studentUpdates.set(student.id, student);
      });
      
      // Update existing students
      for (let i = 0; i < currentData.students.length; i++) {
        const student = currentData.students[i];
        if (studentUpdates.has(student.id)) {
          currentData.students[i] = studentUpdates.get(student.id);
          studentUpdates.delete(student.id);
        }
      }
      
      // Add any remaining new students that weren't in the original data
      studentUpdates.forEach(student => {
        currentData.students.push(student);
      });
      
      newData = currentData;
      
      // We only rebuild tags with the final chunk or a full save
      // For intermediate chunks, we keep the existing tags
      if (!req.body.final) {
        // Just save the updated students without rebuilding tags
        await fs.writeJson(studentsPath, newData, { spaces: 2 });
        console.log('Partial student data updated');
        res.json({ 
          success: true, 
          message: 'Partial student data updated successfully',
          studentsProcessed: chunk.length
        });
        return;
      }
    } else {
      // This is a full update, replace all students
      newData = {
        students: req.body.students,
        tags: currentData.tags || {}
      };
    }
    
    // At this point, we either have a full update or the final chunk of a partial update
    // Rebuild the tag structure
    
    // Find all unique tags from students
    const uniqueTags = new Set();
    newData.students.forEach(student => {
      if (student.tags && Array.isArray(student.tags)) {
        student.tags.forEach(tag => uniqueTags.add(tag));
      }
    });
    
    console.log(`Found ${uniqueTags.size} unique tags in updated student records`);
    
    // Ensure all tags exist in the tags object
    uniqueTags.forEach(tag => {
      if (!newData.tags[tag]) newData.tags[tag] = [];
      else newData.tags[tag] = []; // Reset existing tags to rebuild them
    });
    
    // Update tag lists based on student tags
    const tagCounts = {};
    uniqueTags.forEach(tag => {
      tagCounts[tag] = 0;
    });
    
    // Add students to appropriate tag lists
    let studentsWithTags = 0;
    for (const student of newData.students) {
      if (student.tags && Array.isArray(student.tags) && student.tags.length > 0) {
        studentsWithTags++;
        student.tags.forEach(tag => {
          if (uniqueTags.has(tag)) {
            newData.tags[tag].push(student.id);
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        });
      }
    }
    
    // Write updated data
    await fs.writeJson(studentsPath, newData, { spaces: 2 });
    console.log('Students data updated');
    console.log(`Total students: ${newData.students.length}, with tags: ${studentsWithTags}`);
    
    // Create a summary of tag counts
    const tagSummary = Object.entries(tagCounts)
      .map(([tag, count]) => `${tag}: ${count}`)
      .join(', ');
    console.log(`Tag counts: ${tagSummary}`);
    
    res.json({ 
      success: true, 
      message: 'Students data saved successfully',
      tagCounts: tagCounts,
      totalStudents: newData.students.length,
      studentsWithTags: studentsWithTags
    });
  } catch (error) {
    console.error('Error saving students data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save students data',
      error: error.message
    });
  }
});

// API endpoint to repair a specific tag
app.post('/api/repair-tag', async (req, res) => {
  try {
    const { tagName } = req.body;
    
    if (!tagName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }
    
    console.log(`Repairing tag: ${tagName}`);
    const dbPath = path.join(__dirname, 'data', 'students.json');
    const data = await fs.readJson(dbPath);
    
    // Initialize or reset tag array
    if (!data.tags) data.tags = {};
    data.tags[tagName] = [];
    
    let taggedCount = 0;
    
    // Find all students with this tag and add to tag list
    data.students.forEach(student => {
      if (student.tags && Array.isArray(student.tags) && student.tags.includes(tagName)) {
        data.tags[tagName].push(student.id);
        taggedCount++;
      }
    });
    
    // Save the updated data
    await fs.writeJson(dbPath, data, { spaces: 2 });
    
    res.json({
      success: true,
      message: `Tag "${tagName}" repaired successfully`,
      studentsTagged: taggedCount,
      tagList: data.tags[tagName]
    });
  } catch (error) {
    console.error('Error repairing tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repair tag',
      error: error.message
    });
  }
});

// API endpoint to get tag statistics
app.get('/api/tag-stats', async (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'data', 'students.json');
    const data = await fs.readJson(dbPath);
    
    const tagStats = {};
    const allTags = new Set();
    
    // Count students with each tag
    data.students.forEach(student => {
      if (student.tags && Array.isArray(student.tags)) {
        student.tags.forEach(tag => {
          allTags.add(tag);
          tagStats[tag] = tagStats[tag] || { inStudents: 0, inTagList: 0 };
          tagStats[tag].inStudents++;
        });
      }
    });
    
    // Count students in each tag list
    if (data.tags) {
      Object.entries(data.tags).forEach(([tag, studentIds]) => {
        allTags.add(tag);
        tagStats[tag] = tagStats[tag] || { inStudents: 0, inTagList: 0 };
        tagStats[tag].inTagList = Array.isArray(studentIds) ? studentIds.length : 0;
      });
    }
    
    // Add a status field
    Object.keys(tagStats).forEach(tag => {
      const stats = tagStats[tag];
      stats.status = stats.inStudents === stats.inTagList ? 'OK' : 'NEEDS REPAIR';
    });
    
    res.json({
      success: true,
      tagStats: tagStats
    });
  } catch (error) {
    console.error('Error getting tag statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tag statistics',
      error: error.message
    });
  }
});

// Add a UI route for the tag repair page
app.get('/tag-repair', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tag Repair Tool</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .tag-row {
                display: flex;
                padding: 10px;
                border-bottom: 1px solid #eee;
                align-items: center;
            }
            .tag-name {
                flex: 1;
                font-weight: bold;
            }
            .tag-stats {
                flex: 2;
            }
            .status-ok {
                color: green;
            }
            .status-repair {
                color: red;
            }
            button {
                padding: 5px 10px;
                background-color: #4285f4;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            button:hover {
                background-color: #3367d6;
            }
            .loading {
                display: none;
                margin-top: 20px;
                color: #666;
            }
            .message {
                margin-top: 20px;
                padding: 10px;
                background-color: #e6f4ea;
                border-radius: 4px;
                display: none;
            }
            h1 {
                color: #333;
            }
        </style>
    </head>
    <body>
        <h1>Tag Repair Tool</h1>
        <p>This tool helps repair tags by ensuring that all students with a specific tag are properly included in the tag's list.</p>
        
        <div id="tag-container">
            <div class="loading" id="loading">Loading tag statistics...</div>
        </div>
        
        <div class="message" id="message"></div>
        
        <script>
            const tagContainer = document.getElementById('tag-container');
            const loadingElement = document.getElementById('loading');
            const messageElement = document.getElementById('message');
            
            async function loadTagStats() {
                loadingElement.style.display = 'block';
                try {
                    const response = await fetch('/api/tag-stats');
                    const data = await response.json();
                    
                    if (data.success) {
                        displayTagStats(data.tagStats);
                    } else {
                        showMessage('Error: ' + data.message, 'error');
                    }
                } catch (error) {
                    showMessage('Error loading tag statistics: ' + error.message, 'error');
                } finally {
                    loadingElement.style.display = 'none';
                }
            }
            
            function displayTagStats(tagStats) {
                tagContainer.innerHTML = '';
                
                // Create table header
                const header = document.createElement('div');
                header.className = 'tag-row';
                header.innerHTML = \`
                    <div class="tag-name">Tag Name</div>
                    <div class="tag-stats">Statistics</div>
                    <div class="tag-action">Action</div>
                \`;
                tagContainer.appendChild(header);
                
                // Sort tags by status (NEEDS REPAIR first)
                const sortedTags = Object.entries(tagStats)
                    .sort(([,a], [,b]) => {
                        if (a.status === 'NEEDS REPAIR' && b.status !== 'NEEDS REPAIR') return -1;
                        if (a.status !== 'NEEDS REPAIR' && b.status === 'NEEDS REPAIR') return 1;
                        return 0;
                    });
                
                // Create rows for each tag
                for (const [tag, stats] of sortedTags) {
                    const row = document.createElement('div');
                    row.className = 'tag-row';
                    
                    const statusClass = stats.status === 'OK' ? 'status-ok' : 'status-repair';
                    
                    row.innerHTML = \`
                        <div class="tag-name">\${tag}</div>
                        <div class="tag-stats">
                            <span>In students: \${stats.inStudents}</span> | 
                            <span>In tag list: \${stats.inTagList}</span> | 
                            <span class="\${statusClass}">Status: \${stats.status}</span>
                        </div>
                        <div class="tag-action">
                            <button onclick="repairTag('\${tag}')" \${stats.status === 'OK' ? 'disabled' : ''}>
                                Repair
                            </button>
                        </div>
                    \`;
                    
                    tagContainer.appendChild(row);
                }
            }
            
            async function repairTag(tagName) {
                loadingElement.style.display = 'block';
                loadingElement.textContent = \`Repairing tag "\${tagName}"...\`;
                
                try {
                    const response = await fetch('/api/repair-tag', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ tagName })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showMessage(\`Successfully repaired tag "\${tagName}" with \${data.studentsTagged} students\`, 'success');
                        // Reload stats
                        loadTagStats();
                    } else {
                        showMessage('Error: ' + data.message, 'error');
                    }
                } catch (error) {
                    showMessage('Error repairing tag: ' + error.message, 'error');
                } finally {
                    loadingElement.style.display = 'none';
                }
            }
            
            function showMessage(text, type = 'success') {
                messageElement.textContent = text;
                messageElement.style.backgroundColor = type === 'success' ? '#e6f4ea' : '#fce8e6';
                messageElement.style.display = 'block';
                
                // Hide after 5 seconds
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 5000);
            }
            
            // Load tag statistics when page loads
            loadTagStats();
        </script>
    </body>
    </html>
  `);
});

// Run the repair operation before starting the server
repairDatabase().then(() => {
  // Start the server
  app.listen(port, () => {
    console.log(`Gender tagger server running at http://localhost:${port}`);
  });
});