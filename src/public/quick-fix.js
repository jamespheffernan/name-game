// Name Game Quick Fix Module
// This script directly addresses the student display issue

// Wait until document loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('[QUICK FIX] Installed');
  
  // Add a fix button to the main header
  const header = document.querySelector('.main-header');
  if (header) {
    const fixButton = document.createElement('button');
    fixButton.innerHTML = 'Fix Student Display';
    fixButton.style.marginLeft = '20px';
    fixButton.style.backgroundColor = '#10b981';
    fixButton.style.color = 'white';
    fixButton.style.border = 'none';
    fixButton.style.borderRadius = '4px';
    fixButton.style.padding = '8px 16px';
    fixButton.style.cursor = 'pointer';
    
    fixButton.addEventListener('click', attemptToFixDisplay);
    
    header.appendChild(fixButton);
    console.log('[QUICK FIX] Added fix button to header');
  }
  
  // Also add a manual load button near the student list
  const studentTab = document.getElementById('upload-tab');
  if (studentTab) {
    // Create a section for manual intervention
    const manualSection = document.createElement('div');
    manualSection.style.margin = '20px 0';
    manualSection.style.padding = '15px';
    manualSection.style.backgroundColor = '#f0fdf4';
    manualSection.style.border = '1px solid #bbf7d0';
    manualSection.style.borderRadius = '6px';
    
    manualSection.innerHTML = `
      <h3 style="margin-top: 0">Student Display Tools</h3>
      <p>If students aren't visible, try these options:</p>
      <div id="fix-buttons" style="margin-top: 15px"></div>
      <div id="fix-status" style="margin-top: 10px; font-size: 14px;"></div>
      <div id="student-backup" style="margin-top: 15px"></div>
    `;
    
    // Insert before student list
    const studentList = document.getElementById('student-list');
    if (studentList && studentList.parentNode) {
      studentList.parentNode.insertBefore(manualSection, studentList);
      
      // Add action buttons
      const fixButtons = document.getElementById('fix-buttons');
      if (fixButtons) {
        // Button to directly fix display issues
        const directFixBtn = document.createElement('button');
        directFixBtn.textContent = 'Fix Display Issues';
        directFixBtn.style.marginRight = '10px';
        directFixBtn.style.backgroundColor = '#3b82f6';
        directFixBtn.style.color = 'white';
        directFixBtn.style.border = 'none';
        directFixBtn.style.borderRadius = '4px';
        directFixBtn.style.padding = '8px 16px';
        directFixBtn.style.cursor = 'pointer';
        directFixBtn.addEventListener('click', attemptToFixDisplay);
        fixButtons.appendChild(directFixBtn);
        
        // Button to manually load students
        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Load Students Directly';
        loadBtn.style.backgroundColor = '#8b5cf6';
        loadBtn.style.color = 'white';
        loadBtn.style.border = 'none';
        loadBtn.style.borderRadius = '4px';
        loadBtn.style.padding = '8px 16px';
        loadBtn.style.cursor = 'pointer';
        loadBtn.addEventListener('click', loadStudentsDirectly);
        fixButtons.appendChild(loadBtn);
      }
      
      console.log('[QUICK FIX] Added manual tools section before student list');
    }
  }
  
  // Check for student management tab
  const manageStudentsBtn = document.getElementById('manage-students-btn');
  if (manageStudentsBtn) {
    // Add listener to fix display when tab is clicked
    manageStudentsBtn.addEventListener('click', function() {
      console.log('[QUICK FIX] Manage Students clicked, scheduling fix');
      setTimeout(attemptToFixDisplay, 500);
    });
  }
  
  // Try to fix immediately and again after a delay
  setTimeout(attemptToFixDisplay, 1000);
});

// Attempt to fix student display issues
function attemptToFixDisplay() {
  console.log('[QUICK FIX] Attempting to fix student display...');
  
  const statusEl = document.getElementById('fix-status');
  if (statusEl) {
    statusEl.textContent = 'Fixing display issues...';
    statusEl.style.color = '#4b5563';
  }
  
  // Get student list element
  const studentList = document.getElementById('student-list');
  if (!studentList) {
    console.warn('[QUICK FIX] Student list element not found');
    if (statusEl) {
      statusEl.textContent = 'Error: Student list element not found';
      statusEl.style.color = '#ef4444';
    }
    return;
  }
  
  // Log current styles
  const computedStyle = window.getComputedStyle(studentList);
  console.log('[QUICK FIX] Current styles:', {
    display: computedStyle.display,
    visibility: computedStyle.visibility,
    opacity: computedStyle.opacity,
    position: computedStyle.position,
    zIndex: computedStyle.zIndex
  });
  
  // Hide any loading indicators
  const loadingIndicator = document.querySelector('.loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
    console.log('[QUICK FIX] Hidden loading indicator');
  }
  
  // Fix student list styles directly
  studentList.style.display = 'grid';
  studentList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
  studentList.style.gap = '1.5rem';
  studentList.style.opacity = '1';
  studentList.style.visibility = 'visible';
  studentList.style.position = 'static';
  studentList.style.zIndex = 'auto';
  studentList.style.overflow = 'visible';
  
  // Check if we have any students
  const numChildren = studentList.children.length;
  console.log(`[QUICK FIX] Student list has ${numChildren} children`);
  
  if (statusEl) {
    statusEl.textContent = `Fix applied. Student list has ${numChildren} items. ` + 
                         `Display is now: ${window.getComputedStyle(studentList).display}`;
    statusEl.style.color = '#059669';
  }
  
  // If no children, maybe we should try to load students directly
  if (numChildren === 0) {
    if (statusEl) {
      statusEl.textContent += ' - No students found, try using the "Load Students Directly" button.';
      statusEl.style.color = '#d97706';
    }
  }
  
  console.log('[QUICK FIX] Fix applied');
}

// Load students directly from API
async function loadStudentsDirectly() {
  console.log('[QUICK FIX] Loading students directly...');
  
  const statusEl = document.getElementById('fix-status');
  if (statusEl) {
    statusEl.textContent = 'Loading students directly from API...';
    statusEl.style.color = '#4b5563';
  }
  
  const studentList = document.getElementById('student-list');
  const studentBackup = document.getElementById('student-backup');
  
  if (!studentList) {
    console.warn('[QUICK FIX] Student list element not found for direct loading');
    if (statusEl) {
      statusEl.textContent = 'Error: Student list element not found';
      statusEl.style.color = '#ef4444';
    }
    return;
  }
  
  // First, try to fix display
  attemptToFixDisplay();
  
  try {
    // Fetch students from API
    const response = await fetch('/api/students');
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }
    
    const students = await response.json();
    console.log(`[QUICK FIX] Fetched ${students.length} students directly`);
    
    if (statusEl) {
      statusEl.textContent = `Loaded ${students.length} students. Displaying...`;
    }
    
    // Display students (but don't overwrite existing content if any)
    if (studentList.children.length === 0) {
      // No students in the main list, add them there
      displayStudentsInElement(students, studentList);
      
      if (statusEl) {
        statusEl.textContent = `Added ${students.length} students to main list.`;
        statusEl.style.color = '#059669';
      }
    } else {
      // Students already in main list, add to backup area
      if (studentBackup) {
        studentBackup.innerHTML = `<h3>Backup Student Display (${students.length} students)</h3>`;
        
        // Create a container with correct styling
        const backupGrid = document.createElement('div');
        backupGrid.style.display = 'grid';
        backupGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        backupGrid.style.gap = '1.5rem';
        
        // Add students to the backup grid
        displayStudentsInElement(students, backupGrid);
        studentBackup.appendChild(backupGrid);
        
        if (statusEl) {
          statusEl.textContent = `Main list already contains students. Created backup display with ${students.length} students.`;
          statusEl.style.color = '#059669';
        }
      }
    }
  } catch (error) {
    console.error('[QUICK FIX] Error loading students directly:', error);
    if (statusEl) {
      statusEl.textContent = `Error: ${error.message}`;
      statusEl.style.color = '#ef4444';
    }
  }
}

// Helper to display students in a specified element
function displayStudentsInElement(students, container) {
  // Limit to first 10 students to avoid overwhelming the display
  const displayCount = Math.min(10, students.length);
  
  for (let i = 0; i < displayCount; i++) {
    const student = students[i];
    
    const card = document.createElement('div');
    card.className = 'student-card';
    
    const imgSrc = student.imagePath || 'https://via.placeholder.com/150?text=No+Image';
    
    // Create HTML for student card
    card.innerHTML = `
      <img class="student-img" src="${imgSrc}" alt="${student.fullName}" style="width: 100%; height: 200px; object-fit: cover;">
      <div class="student-info" style="padding: 15px;">
        <div class="student-name" style="font-weight: bold; margin-bottom: 5px;">${student.fullName}</div>
        <div class="student-tags" style="display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px;">
          ${student.tags && Array.isArray(student.tags) ? 
            student.tags.map(tag => `<span class="tag" style="background-color: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${tag}</span>`).join('') : ''}
        </div>
      </div>
    `;
    
    container.appendChild(card);
  }
  
  // Add a note if there are more students
  if (students.length > displayCount) {
    const note = document.createElement('div');
    note.style.gridColumn = '1 / -1';
    note.style.textAlign = 'center';
    note.style.padding = '10px';
    note.style.backgroundColor = '#f9fafb';
    note.style.borderRadius = '4px';
    note.style.marginTop = '10px';
    note.innerHTML = `Showing ${displayCount} of ${students.length} students`;
    container.appendChild(note);
  }
}