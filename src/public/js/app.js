document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const welcomeSection = document.getElementById('welcome');
  const studentManagementSection = document.getElementById('student-management');
  const gameSection = document.getElementById('game-section');
  const gameContainer = document.getElementById('game-container');
  const gameResults = document.getElementById('game-results');

  // Navigation buttons
  const manageStudentsBtn = document.getElementById('manage-students-btn');
  const playGameBtn = document.getElementById('play-game-btn');
  const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
  const backFromGameBtn = document.getElementById('back-from-game-btn');
  
  // Batch tagging elements
  const enableBatchTaggingCheckbox = document.getElementById('enable-batch-tagging');
  const batchTaggingPanel = document.getElementById('batch-tagging-panel');
  const batchTagSelect = document.getElementById('batch-tag-select');
  const applyBatchTagBtn = document.getElementById('apply-batch-tag-btn');
  const cancelBatchTaggingBtn = document.getElementById('cancel-batch-tagging');
  const selectAllStudentsCheckbox = document.getElementById('select-all-students');
  const batchSelectionInfo = document.getElementById('batch-selection-info');
  
  // Batch tagging state
  let batchTaggingEnabled = false;
  let selectedStudents = [];

  // Student management elements
  const pdfUploadForm = document.getElementById('pdf-upload-form');
  const pdfUploadStatus = document.getElementById('pdf-upload-status');
  const addStudentForm = document.getElementById('add-student-form');
  const studentList = document.getElementById('student-list');
  const flushDbBtn = document.getElementById('flush-db-btn');
  const repairDbBtn = document.getElementById('repair-db-btn');
  const filterTagSelect = document.getElementById('filter-tag');

  // Tab elements
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const studentsTab = document.getElementById('students-tab');
  const tagsTab = document.getElementById('tags-tab');
  const addTagForm = document.getElementById('add-tag-form');
  const tagList = document.getElementById('tag-list');

  // Game elements
  const gameModeSelect = document.getElementById('game-mode');
  const questionCountInput = document.getElementById('question-count');
  const tagSelect = document.getElementById('tag-select');
  const focusDifficultCheckbox = document.getElementById('focus-difficult');
  const onlyUntriedCheckbox = document.getElementById('only-untried');
  const startGameBtn = document.getElementById('start-game-btn');
  const questionDisplay = document.getElementById('question-display');
  const optionsDisplay = document.getElementById('options-display');
  const continueBtn = document.getElementById('continue-btn');
  const scoreDisplay = document.getElementById('score-display');
  const resultDetails = document.getElementById('result-details');
  const playAgainBtn = document.getElementById('play-again-btn');
  
  // Advanced filters elements
  // Note: The filter selects are already defined in the student management section
  
  // Performance stats elements
  const viewPerformanceBtn = document.getElementById('view-performance-btn');
  const performanceStats = document.getElementById('performance-stats');
  const resetStatsBtn = document.getElementById('reset-stats-btn');
  const closeStatsBtn = document.getElementById('close-stats-btn');
  const sortPerformanceSelect = document.getElementById('sort-performance');
  const studentPerformanceList = document.getElementById('student-performance-list');

  // Game state
  let currentGame = null;
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let isGameActive = false; // Flag to track if the game is active for keyboard controls

  // Navigation
  manageStudentsBtn.addEventListener('click', () => {
    welcomeSection.classList.add('hidden');
    studentManagementSection.classList.remove('hidden');
    gameSection.classList.add('hidden');
    loadStudents();
  });

  playGameBtn.addEventListener('click', () => {
    welcomeSection.classList.add('hidden');
    studentManagementSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    gameResults.classList.add('hidden');
  });

  backToWelcomeBtn.addEventListener('click', () => {
    welcomeSection.classList.remove('hidden');
    studentManagementSection.classList.add('hidden');
    gameSection.classList.add('hidden');
  });

  backFromGameBtn.addEventListener('click', () => {
    welcomeSection.classList.remove('hidden');
    studentManagementSection.classList.add('hidden');
    gameSection.classList.add('hidden');
  });

  // ======================
  // Student Management 
  // ======================
  
  // Tab navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Tab clicked:', btn.dataset.tab);
      // Remove active class from all buttons
      tabBtns.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Hide all tab contents
      tabContents.forEach(content => content.classList.add('hidden'));
      
      // Show the content for the clicked tab
      const tabId = btn.dataset.tab;
      console.log('Showing tab content:', tabId);
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.remove('hidden');
      } else {
        console.error('Tab content not found:', tabId);
      }
      
      // Load appropriate data
      if (tabId === 'students-tab') {
        console.log('Loading students data...');
        loadStudents();
      } else if (tabId === 'tags-tab') {
        console.log('Loading tags data...');
        loadTags();
      }
    });
  });

  // Load all available tags
  async function loadTags() {
    try {
      console.log('Fetching tags from server...');
      // Use the full URL with hostname and port
      const serverUrl = window.location.origin; // This will use whatever origin the browser is currently on
      
      // Try main endpoint first
      console.log('Fetching student tags from primary endpoint:', `${serverUrl}/api/students/tags`);
      let response;
      let usedBackup = false;
      
      try {
        response = await fetch(`${serverUrl}/api/students/tags`);
        
        // Log detailed response info for debugging
        console.log(`Tags response status: ${response.status}`);
        console.log(`Tags response ok: ${response.ok}`);
        
        // If main endpoint returns 404, try backup
        if (response.status === 404) {
          console.log('Primary tags endpoint not found (404), trying backup endpoint...');
          usedBackup = 'backup';
          response = await fetch(`${serverUrl}/api/students/tags-backup`);
          console.log(`Backup tags response status: ${response.status}`);
          console.log(`Backup tags response ok: ${response.ok}`);
          
          // If backup endpoint returns 404, try direct endpoint
          if (response.status === 404) {
            console.log('Backup tags endpoint not found (404), trying direct endpoint...');
            usedBackup = 'direct';
            response = await fetch(`${serverUrl}/api/students/tags-direct`);
            console.log(`Direct tags response status: ${response.status}`);
            console.log(`Direct tags response ok: ${response.ok}`);
          }
        }
      } catch (fetchError) {
        console.error('Error fetching from primary endpoint:', fetchError);
        console.log('Trying backup endpoint after fetch error...');
        
        try {
          usedBackup = 'backup';
          response = await fetch(`${serverUrl}/api/students/tags-backup`);
          console.log(`Backup tags response status: ${response.status}`);
          console.log(`Backup tags response ok: ${response.ok}`);
        } catch (backupError) {
          console.error('Error fetching from backup endpoint:', backupError);
          console.log('Trying direct endpoint after backup fetch error...');
          usedBackup = 'direct';
          response = await fetch(`${serverUrl}/api/students/tags-direct`);
          console.log(`Direct tags response status: ${response.status}`);
          console.log(`Direct tags response ok: ${response.ok}`);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let endpointName = 'primary';
        if (usedBackup === 'backup') endpointName = 'backup';
        if (usedBackup === 'direct') endpointName = 'direct';
        console.error(`Error response from ${endpointName} tags API: ${errorText}`);
        throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
      }
      
      const tags = await response.json();
      let endpointName = 'primary';
      if (usedBackup === 'backup') endpointName = 'backup';
      if (usedBackup === 'direct') endpointName = 'direct';
      console.log(`Successfully loaded tags from ${endpointName} endpoint:`, 
                 Object.keys(tags).length, 'tags found');
      
      // Handle empty or invalid tags object
      if (!tags || typeof tags !== 'object') {
        console.warn('Tags response is not a valid object:', tags);
        // Use empty tags object as fallback
        displayTags({});
        populateTagDropdowns({});
        return;
      }
      
      displayTags(tags);
      
      // Also populate tag dropdowns, including batch tag select
      populateTagDropdowns(tags);
    } catch (error) {
      console.error('Error loading tags from all endpoints:', error);
      // Use empty tags as fallback to prevent UI from breaking completely
      displayTags({});
      populateTagDropdowns({});
      // Show error to user with more context
      alert(`Failed to load tags from all endpoints (primary, backup, and direct): ${error.message}`);
    }
  }
  
  // Handle batch student selection
  function handleBatchStudentSelection(e) {
    // Don't handle clicks on buttons
    if (e.target.tagName === 'BUTTON') return;
    
    // Prevent handling if batch tagging is disabled
    if (!batchTaggingEnabled) return;
    
    // Get the student card and ID
    const studentCard = e.currentTarget;
    const studentId = studentCard.dataset.id;
    
    // Toggle selection
    if (selectedStudents.includes(studentId)) {
      // Remove from selection
      selectedStudents = selectedStudents.filter(id => id !== studentId);
      studentCard.classList.remove('selected-for-batch');
    } else {
      // Add to selection
      selectedStudents.push(studentId);
      studentCard.classList.add('selected-for-batch');
    }
    
    // Update info text and button state
    updateBatchSelectionInfo();
  }
  
  // Update the batch selection info text
  function updateBatchSelectionInfo() {
    const count = selectedStudents.length;
    const studentCards = document.querySelectorAll('.student-card');
    const totalVisible = studentCards.length;
    
    if (count === 0) {
      batchSelectionInfo.textContent = 'No students selected. Click on student cards to select them for batch tagging.';
      applyBatchTagBtn.disabled = true;
      selectAllStudentsCheckbox.checked = false;
    } else if (count === totalVisible && totalVisible > 0) {
      batchSelectionInfo.textContent = `All ${count} students selected. Choose a tag to apply.`;
      applyBatchTagBtn.disabled = batchTagSelect.value === '';
      selectAllStudentsCheckbox.checked = true;
    } else {
      batchSelectionInfo.textContent = `${count} of ${totalVisible} student${count === 1 ? '' : 's'} selected. Choose a tag to apply.`;
      applyBatchTagBtn.disabled = batchTagSelect.value === '';
      selectAllStudentsCheckbox.checked = false;
    }
  }
  
  // Display tags in the tags list
  function displayTags(tags) {
    tagList.innerHTML = '';
    
    if (Object.keys(tags).length === 0) {
      tagList.innerHTML = '<p>No tags created yet.</p>';
      return;
    }
    
    for (const [tagName, studentIds] of Object.entries(tags)) {
      const tagItem = document.createElement('div');
      tagItem.className = 'tag-item';
      
      tagItem.innerHTML = `
        <div class="tag-info">
          <h4 class="tag-name">${tagName}</h4>
          <div class="tag-stats">
            ${Array.isArray(studentIds) ? studentIds.length : 0} students assigned
          </div>
        </div>
        <div class="tag-actions">
          <button class="view-tag-btn" data-tag="${tagName}">View Students</button>
          <button class="delete-tag-btn" data-tag="${tagName}">Delete</button>
        </div>
      `;
      
      tagList.appendChild(tagItem);
    }
    
    // Add event listeners for tag actions
    document.querySelectorAll('.view-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Switch to students tab with filter
        document.querySelector('.tab-btn[data-tab="students-tab"]').click();
        filterTagSelect.value = e.target.dataset.tag;
        filterStudentsByTag(e.target.dataset.tag);
      });
    });
    
    document.querySelectorAll('.delete-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteTag(e.target.dataset.tag));
    });
  }
  
  // Create new tag
  addTagForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tagNameInput = document.getElementById('tag-name');
    const tagName = tagNameInput.value.trim();
    
    if (!tagName) {
      alert('Tag name is required');
      return;
    }
    
    try {
      const response = await fetch('/api/students/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tagName })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tag');
      }
      
      addTagForm.reset();
      loadTags();
      alert(`Tag "${tagName}" created successfully`);
    } catch (error) {
      console.error('Error creating tag:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Delete a tag
  async function deleteTag(tagName) {
    if (!confirm(`Are you sure you want to delete the tag "${tagName}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/students/tags/${tagName}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete tag');
      }
      
      loadTags();
      alert(`Tag "${tagName}" deleted successfully`);
      
      // If the current filter is the deleted tag, reset it
      if (filterTagSelect.value === tagName) {
        filterTagSelect.value = '';
        loadStudents();
      }
      
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Populate tag select dropdowns
  function populateTagDropdowns(tags) {
    const dropdowns = [filterTagSelect, tagSelect, document.getElementById('filter-performance-tag'), batchTagSelect];
    
    dropdowns.forEach(dropdown => {
      if (!dropdown) return;
      
      // Save the current value
      const currentValue = dropdown.value;
      
      // Clear all options except the first one
      while (dropdown.options.length > 1) {
        dropdown.remove(1);
      }
      
      // Add tag options
      for (const tagName of Object.keys(tags)) {
        const option = document.createElement('option');
        option.value = tagName;
        option.textContent = tagName;
        dropdown.appendChild(option);
      }
      
      // Restore the selected value if it still exists
      if (currentValue && Object.keys(tags).includes(currentValue)) {
        dropdown.value = currentValue;
      }
    });
    
    // Update batch apply button state
    if (batchTaggingEnabled) {
      applyBatchTagBtn.disabled = batchTagSelect.value === '' || selectedStudents.length === 0;
    }
  }
  
  // Advanced filters
  const filterNationalitySelect = document.getElementById('filter-nationality');
  const filterLanguageSelect = document.getElementById('filter-language');
  const filterGenderSelect = document.getElementById('filter-gender');
  
  // Event listeners for filter changes
  filterTagSelect.addEventListener('change', applyFilters);
  
  if (filterNationalitySelect) filterNationalitySelect.addEventListener('change', applyFilters);
  if (filterLanguageSelect) filterLanguageSelect.addEventListener('change', applyFilters);
  if (filterGenderSelect) filterGenderSelect.addEventListener('change', applyFilters);
  
  // Toggle advanced filters visibility in student management
  const studentManagementToggleBtn = document.querySelector('#student-management #toggle-advanced-filters');
  const studentManagementFilterContainer = document.querySelector('#student-management #advanced-filters');
  
  if (studentManagementToggleBtn && studentManagementFilterContainer) {
    studentManagementToggleBtn.addEventListener('click', () => {
      studentManagementFilterContainer.classList.toggle('visible');
      studentManagementToggleBtn.textContent = studentManagementFilterContainer.classList.contains('visible') 
        ? 'Hide Advanced Filters' 
        : 'Advanced Filters';
    });
  }
  
  // Load nationality and language options when students are loaded
  async function populateFilterOptions() {
    try {
      // Get all students to extract nationalities and languages
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const students = await response.json();
      
      // Extract unique nationalities and languages from tags
      const nationalities = new Set();
      const languages = new Set();
      
      students.forEach(student => {
        if (student.tags && Array.isArray(student.tags)) {
          student.tags.forEach(tag => {
            if (tag.startsWith('nationality:')) {
              const nationality = tag.replace('nationality:', '');
              nationalities.add(nationality);
            } else if (tag.startsWith('language:')) {
              const language = tag.replace('language:', '');
              languages.add(language);
            }
          });
        }
      });
      
      // Populate nationality dropdown
      if (filterNationalitySelect) {
        // Clear existing options except the first one
        while (filterNationalitySelect.options.length > 1) {
          filterNationalitySelect.remove(1);
        }
        
        // Add nationality options
        Array.from(nationalities).sort().forEach(nationality => {
          const option = document.createElement('option');
          option.value = `nationality:${nationality}`;
          option.textContent = nationality.charAt(0).toUpperCase() + nationality.slice(1);
          filterNationalitySelect.appendChild(option);
        });
      }
      
      // Populate language dropdown
      if (filterLanguageSelect) {
        // Clear existing options except the first one
        while (filterLanguageSelect.options.length > 1) {
          filterLanguageSelect.remove(1);
        }
        
        // Add language options
        Array.from(languages).sort().forEach(language => {
          const option = document.createElement('option');
          option.value = `language:${language}`;
          option.textContent = language.charAt(0).toUpperCase() + language.slice(1);
          filterLanguageSelect.appendChild(option);
        });
      }
      
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }
  
  // Apply all filters
  function applyFilters() {
    const tagFilter = filterTagSelect.value;
    const nationalityFilter = filterNationalitySelect?.value || '';
    const languageFilter = filterLanguageSelect?.value || '';
    const genderFilter = filterGenderSelect?.value || '';
    
    filterStudentsByMultipleCriteria(tagFilter, nationalityFilter, languageFilter, genderFilter);
  }
  
  // For backward compatibility
  async function filterStudentsByTag(tagName) {
    return filterStudentsByMultipleCriteria(tagName, '', '', '');
  }
  
  // Filter students by multiple criteria
  async function filterStudentsByMultipleCriteria(tagName, nationalityTag, languageTag, genderTag) {
    try {
      // Show loading indicator
      displayLoadingIndicator();
      
      // Start with all students
      let students = [];
      
      // First, get either filtered by tag or all students
      if (tagName) {
        // Fetch students with the selected tag
        console.log(`Fetching students with tag: ${tagName}`);
        
        // Use simpler API path for debugging - get all students first
        const response = await fetch('/api/students');
        
        // Log detailed response info for debugging
        console.log(`Response status: ${response.status}`);
        console.log(`Response ok: ${response.ok}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response: ${errorText}`);
          throw new Error(`Failed to fetch students: ${response.statusText}`);
        }
        
        const allStudents = await response.json();
        console.log(`Fetched ${allStudents.length} total students`);
        
        // Filter on client-side for the specific tag instead of using the tag endpoint
        students = allStudents.filter(student => 
          student.tags && Array.isArray(student.tags) && student.tags.includes(tagName)
        );
        console.log(`Found ${students.length} students with tag ${tagName}`);
      } else {
        // Fetch all students
        console.log('Fetching all students');
        const response = await fetch('/api/students');
        
        // Log detailed response info for debugging
        console.log(`All students response status: ${response.status}`);
        console.log(`All students response ok: ${response.ok}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response for all students: ${errorText}`);
          throw new Error(`Failed to fetch students: ${response.statusText}`);
        }
        
        students = await response.json();
        console.log(`Found ${students.length} total students`);
      }
      
      // Then apply additional filters on the client side
      if (nationalityTag || languageTag || genderTag) {
        console.log(`Applying additional filters: nationality=${nationalityTag}, language=${languageTag}, gender=${genderTag}`);
        
        students = students.filter(student => {
          // Skip students without tags
          if (!student.tags || !Array.isArray(student.tags)) {
            return false;
          }
          
          // Apply nationality filter if provided
          if (nationalityTag && !student.tags.includes(nationalityTag)) {
            return false;
          }
          
          // Apply language filter if provided
          if (languageTag && !student.tags.includes(languageTag)) {
            return false;
          }
          
          // Apply gender filter if provided
          if (genderTag && !student.tags.includes(genderTag)) {
            return false;
          }
          
          return true;
        });
        
        console.log(`After applying filters, found ${students.length} matching students`);
      }
      
      // Validate students array
      if (!Array.isArray(students)) {
        console.warn('Students data is not an array:', students);
        students = []; // Use empty array as fallback
      }
      
      // Ensure tags property exists on all students
      students = students.map(student => {
        if (!student || typeof student !== 'object') {
          console.warn('Invalid student object in data:', student);
          return { id: 'unknown-' + Math.random(), firstName: 'Error', lastName: 'Loading', tags: [] };
        }
        
        if (!student.tags) {
          student.tags = [];
        }
        return student;
      });
      
      // If in batch tagging mode, reset selections when filter changes
      if (batchTaggingEnabled) {
        selectedStudents = [];
        selectAllStudentsCheckbox.checked = false;
      }
      
      displayStudents(students);
      
      // Update selection info if in batch mode
      if (batchTaggingEnabled) {
        updateBatchSelectionInfo();
      }
      
      // Hide loading indicator on success
      hideLoadingIndicator();
    } catch (error) {
      console.error('Error filtering students:', error);
      // Display an empty list as fallback
      displayStudents([]);
      // Show more detailed error
      alert(`Error loading students: ${error.message}`);
      // Always hide loading indicator, even on error
      hideLoadingIndicator();
    }
  }
  
  // Helper function to display loading indicator
  function displayLoadingIndicator() {
    const container = document.getElementById('student-list');
    if (container) {
      // Create loading indicator if it doesn't exist
      let loader = document.getElementById('students-loading');
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'students-loading';
        loader.className = 'loading-indicator';
        loader.innerHTML = '<div class="spinner"></div><p>Loading students...</p>';
        container.parentNode.insertBefore(loader, container);
      }
      // Show the loader
      loader.style.display = 'flex';
      // Fade the container slightly
      container.style.opacity = '0.5';
    }
  }
  
  // Helper function to hide loading indicator
  function hideLoadingIndicator() {
    const loader = document.getElementById('students-loading');
    const container = document.getElementById('student-list');
    
    if (loader) {
      loader.style.display = 'none';
    }
    
    if (container) {
      container.style.opacity = '1';
    }
  }
  
  // Load students from the database
  async function loadStudents() {
    console.log('loadStudents() function called');
    try {
      // Display loading indicator to show progress
      displayLoadingIndicator();
      
      // Get filter values
      console.log('Reading filter values...');
      const selectedTag = filterTagSelect.value;
      const nationalityFilter = filterNationalitySelect?.value || '';
      const languageFilter = filterLanguageSelect?.value || '';
      const genderFilter = filterGenderSelect?.value || '';
      
      console.log('Filter values:', { 
        tag: selectedTag, 
        nationality: nationalityFilter, 
        language: languageFilter, 
        gender: genderFilter 
      });
      
      // Populate the filter dropdowns
      console.log('Populating filter options...');
      await populateFilterOptions();
      
      // Apply any active filters
      console.log('Applying filters to student data...');
      await filterStudentsByMultipleCriteria(selectedTag, nationalityFilter, languageFilter, genderFilter);
      
      // Also load tags to keep everything in sync
      console.log('Loading tags to keep in sync...');
      await loadTags();
      
      console.log('loadStudents completed successfully');
    } catch (error) {
      console.error('Error loading students:', error);
      console.error('Error stack:', error.stack);
      alert('Failed to load students. Please try again.');
      // Make sure loading indicator is hidden in case of error
      hideLoadingIndicator();
    }
  }
  
  // Display students in the list
  function displayStudents(students) {
    console.log(`Displaying ${students ? students.length : 0} students`);
    
    // Make sure studentList element exists
    if (!studentList) {
      console.error('Student list element not found in DOM');
      return;
    }
    
    console.log('Student list element:', studentList);
    console.log('Student list visibility:', getComputedStyle(studentList).display);
    console.log('Student list parent visibility:', studentList.parentElement ? 
      getComputedStyle(studentList.parentElement).display : 'No parent');
    
    // Debug output for troubleshooting
    if (students && students.length > 0) {
      console.log('Sample student data:', students[0]);
    } else {
      console.warn('No student data to display');
    }
    
    studentList.innerHTML = '';
    
    if (!students || students.length === 0) {
      console.log('No students to display, showing message');
      studentList.innerHTML = '<p>No students found. Please check database connection.</p>';
      return;
    }
    
    // Apply batch tagging mode class if enabled
    if (batchTaggingEnabled) {
      studentList.classList.add('batch-tagging-mode');
    } else {
      studentList.classList.remove('batch-tagging-mode');
    }
    
    students.forEach(student => {
      const studentCard = document.createElement('div');
      studentCard.className = 'student-card';
      studentCard.dataset.id = student.id;
      
      // Check if this student is in the selected list for batch tagging
      if (batchTaggingEnabled && selectedStudents.includes(student.id)) {
        studentCard.classList.add('selected-for-batch');
      }
      
      const imageSrc = student.imagePath 
        ? student.imagePath 
        : 'https://via.placeholder.com/150?text=No+Image';
      
      // Format the student name with preferred name styling if needed
      let displayName = formatNameWithPreferred(student);
      
      // Format tags if available
      let tagsHtml = '';
      if (student.tags && Array.isArray(student.tags) && student.tags.length > 0) {
        const tagBadges = student.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('');
        tagsHtml = `<div class="student-tags">${tagBadges}</div>`;
      }
      
      studentCard.innerHTML = `
        <img src="${imageSrc}" alt="${student.fullName}">
        <h4>${displayName}</h4>
        ${tagsHtml}
        <div class="student-actions">
          <button class="edit-btn" data-id="${student.id}">Edit</button>
          <button class="delete-btn" data-id="${student.id}">Delete</button>
        </div>
      `;
      
      // Add click handler for batch tagging mode
      if (batchTaggingEnabled) {
        studentCard.addEventListener('click', handleBatchStudentSelection);
      }
      
      studentList.appendChild(studentCard);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEditButtonClick);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent triggering the student card click in batch mode
        deleteStudent(this.dataset.id);
      });
    });
  }
  
  // PDF Upload
  pdfUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('pdf-file');
    if (!fileInput.files[0]) {
      alert('Please select a PDF file');
      return;
    }
    
    const formData = new FormData();
    formData.append('pdf', fileInput.files[0]);
    
    pdfUploadStatus.textContent = 'Uploading and processing PDF...';
    
    try {
      const response = await fetch('/api/students/upload-pdf', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process PDF');
      }
      
      const result = await response.json();
      
      pdfUploadStatus.textContent = `Successfully added ${result.studentsAdded} students!`;
      pdfUploadForm.reset();
      loadStudents();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      pdfUploadStatus.textContent = `Error: ${error.message}`;
    }
  });
  
  // Add Student Manually
  addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const preferredName = document.getElementById('preferred-name').value.trim();
    const imageInput = document.getElementById('student-image');
    const tagsInput = document.getElementById('student-tags').value.trim();
    
    if (!firstName || !lastName) {
      alert('First name and last name are required');
      return;
    }
    
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    
    // Only add preferred name if it's provided
    if (preferredName) {
      formData.append('preferredName', preferredName);
    }
    
    if (tagsInput) {
      // Convert comma-separated tags to array and trim whitespace
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formData.append('tags', JSON.stringify(tags));
    }
    
    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }
    
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add student');
      }
      
      addStudentForm.reset();
      loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Edit Student Modal Elements
  const editStudentModal = document.getElementById('edit-student-modal');
  const editStudentForm = document.getElementById('edit-student-form');
  const closeModalBtn = document.querySelector('.close-modal');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const currentImagePreview = document.getElementById('current-image-preview');
  
  // Handle Edit Button Click
  function handleEditButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    const studentId = button.getAttribute('data-id');
    
    console.log("Edit button clicked for student ID:", studentId);
    
    if (!studentId) {
      console.error("No student ID found on button");
      return;
    }
    
    // Fetch the student data and open the modal
    fetchStudentAndOpenModal(studentId);
  }
  
  // Fetch student data and open the modal
  async function fetchStudentAndOpenModal(studentId) {
    try {
      // Fetch all students
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const students = await response.json();
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }
      
      console.log("Found student:", student);
      
      // Populate the modal form
      document.getElementById('edit-student-id').value = student.id;
      document.getElementById('edit-first-name').value = student.firstName || '';
      document.getElementById('edit-last-name').value = student.lastName || '';
      document.getElementById('edit-preferred-name').value = student.preferredName || '';
      
      // Populate tags
      if (student.tags && Array.isArray(student.tags)) {
        document.getElementById('edit-student-tags').value = student.tags.join(', ');
      } else {
        document.getElementById('edit-student-tags').value = '';
      }
      
      // Show current image
      if (student.imagePath) {
        currentImagePreview.innerHTML = `
          <p>Current image:</p>
          <img src="${student.imagePath}" alt="${student.fullName}">
        `;
      } else {
        currentImagePreview.innerHTML = '<p>No image currently set</p>';
      }
      
      // Show the modal
      document.body.style.overflow = 'hidden';
      editStudentModal.classList.remove('hidden');
      editStudentModal.style.display = 'flex';
      
    } catch (error) {
      console.error('Error opening edit form:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Function to close the modal
  function closeEditModal() {
    console.log("Closing modal");
    
    // Simply hide the modal and restore scrolling
    editStudentModal.classList.add('hidden');
    editStudentModal.style.display = 'none';
    document.body.style.overflow = ''; // Enable scrolling again
  }
  
  // Close modal when clicking the X button
  closeModalBtn.addEventListener('click', closeEditModal);
  
  // Close modal when clicking the Cancel button
  cancelEditBtn.addEventListener('click', closeEditModal);
  
  // Close modal when clicking outside the modal content
  editStudentModal.addEventListener('click', (e) => {
    if (e.target === editStudentModal) {
      closeEditModal();
    }
  });
  
  // Edit Student Function
  async function editStudent(studentId) {
    try {
      console.log("Edit student called with ID:", studentId);
      
      // Get student data
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const students = await response.json();
      const student = students.find(s => s.id === studentId);
      
      console.log("Found student:", student);
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Populate the form with student data
      document.getElementById('edit-student-id').value = student.id;
      document.getElementById('edit-first-name').value = student.firstName || '';
      document.getElementById('edit-last-name').value = student.lastName || '';
      document.getElementById('edit-preferred-name').value = student.preferredName || '';
      
      // Populate tags (comma-separated string)
      if (student.tags && Array.isArray(student.tags)) {
        document.getElementById('edit-student-tags').value = student.tags.join(', ');
      } else {
        document.getElementById('edit-student-tags').value = '';
      }
      
      // Show current image if it exists
      if (student.imagePath) {
        currentImagePreview.innerHTML = `
          <p>Current image:</p>
          <img src="${student.imagePath}" alt="${student.fullName}">
        `;
      } else {
        currentImagePreview.innerHTML = '<p>No image currently set</p>';
      }
      
      // Show the modal
      console.log("Showing modal");
      
      // Make sure the modal is completely reset
      editStudentModal.classList.remove('hidden');
      editStudentModal.style.display = 'flex';
      editStudentModal.style.opacity = '1';
      editStudentModal.style.visibility = 'visible';
      
      document.body.style.overflow = 'hidden'; // Prevent scrolling while modal is open
      
      console.log("Modal visibility:", editStudentModal.style.display, editStudentModal.style.visibility, editStudentModal.style.opacity);
      
      // Also add a slight delay to ensure the modal is fully rendered
      setTimeout(() => {
        console.log("Modal should be visible now");
        // Double check
        editStudentModal.style.display = 'flex';
        editStudentModal.style.opacity = '1';
      }, 50);
      
    } catch (error) {
      console.error('Error opening edit form:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Submit updated student data
  editStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const studentId = document.getElementById('edit-student-id').value;
    const firstName = document.getElementById('edit-first-name').value.trim();
    const lastName = document.getElementById('edit-last-name').value.trim();
    const preferredName = document.getElementById('edit-preferred-name').value.trim();
    const imageInput = document.getElementById('edit-student-image');
    const tagsInput = document.getElementById('edit-student-tags').value.trim();
    
    if (!firstName || !lastName) {
      alert('First name and last name are required');
      return;
    }
    
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    
    // Only add preferred name if it's provided
    if (preferredName) {
      formData.append('preferredName', preferredName);
    }
    
    if (tagsInput) {
      // Convert comma-separated tags to array and trim whitespace
      const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      formData.append('tags', JSON.stringify(tags));
    } else {
      // If tags input is empty, set an empty array
      formData.append('tags', JSON.stringify([]));
    }
    
    if (imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }
    
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update student');
      }
      
      // Close the modal
      closeEditModal();
      
      // Reload the student list to reflect changes
      loadStudents();
      
      // Show success message
      alert('Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Delete Student
  async function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete student');
      }
      
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(`Error: ${error.message}`);
    }
  }
  
  // Repair database
  repairDbBtn.addEventListener('click', async () => {
    if (!confirm('This will repair any data issues in the database. Continue?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/students/repair', {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to repair the database');
      }
      
      alert('Database repaired successfully. The page will reload to apply the changes.');
      window.location.reload();
    } catch (error) {
      console.error('Error repairing database:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Flush all students from the database
  flushDbBtn.addEventListener('click', async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL students from the database. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }
    
    // Double confirmation for destructive actions
    if (!confirm('Please confirm once more that you want to delete ALL student data.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/students', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to flush the database');
      }
      
      alert('All students have been removed from the database.');
      loadStudents();
    } catch (error) {
      console.error('Error flushing database:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // ======================
  // Batch Tagging Controls
  // ======================
  
  // Toggle batch tagging mode
  enableBatchTaggingCheckbox.addEventListener('change', () => {
    batchTaggingEnabled = enableBatchTaggingCheckbox.checked;
    
    if (batchTaggingEnabled) {
      batchTaggingPanel.classList.remove('hidden');
      selectedStudents = []; // Reset selections
      selectAllStudentsCheckbox.checked = false; // Reset select all checkbox
      updateBatchSelectionInfo();
    } else {
      batchTaggingPanel.classList.add('hidden');
    }
    
    // Reload the student list to apply/remove the batch tagging mode
    loadStudents();
  });
  
  // Handle tag selection in batch mode
  batchTagSelect.addEventListener('change', () => {
    applyBatchTagBtn.disabled = batchTagSelect.value === '' || selectedStudents.length === 0;
  });
  
  // Cancel batch tagging
  cancelBatchTaggingBtn.addEventListener('click', () => {
    // Reset the batch tagging state
    enableBatchTaggingCheckbox.checked = false;
    batchTaggingEnabled = false;
    batchTaggingPanel.classList.add('hidden');
    selectedStudents = [];
    selectAllStudentsCheckbox.checked = false;
    
    // Reload the student list to remove the batch tagging mode
    loadStudents();
  });
  
  // Handle select all students
  selectAllStudentsCheckbox.addEventListener('change', () => {
    if (!batchTaggingEnabled) return;
    
    const isChecked = selectAllStudentsCheckbox.checked;
    const studentCards = document.querySelectorAll('.student-card');
    
    // Clear current selections first
    selectedStudents = [];
    
    // If checked, add all visible students to the selection
    if (isChecked) {
      studentCards.forEach(card => {
        const studentId = card.dataset.id;
        selectedStudents.push(studentId);
        card.classList.add('selected-for-batch');
      });
    } else {
      // If unchecked, remove all selections
      studentCards.forEach(card => {
        card.classList.remove('selected-for-batch');
      });
    }
    
    // Update the info text
    updateBatchSelectionInfo();
  });
  
  // Apply tag to selected students
  applyBatchTagBtn.addEventListener('click', async () => {
    const selectedTag = batchTagSelect.value;
    const studentsToTag = [...selectedStudents]; // Create a copy to use after reset
    const totalStudents = studentsToTag.length;
    
    if (!selectedTag || totalStudents === 0) {
      return;
    }
    
    try {
      console.log(`Applying tag "${selectedTag}" to ${totalStudents} students`);
      
      // Instead of using the batch endpoint, we'll add one by one for reliability
      let successCount = 0;
      let failCount = 0;
      
      // Show a loading indicator since this could take time
      const originalButtonText = applyBatchTagBtn.textContent;
      applyBatchTagBtn.textContent = 'Applying tags...';
      applyBatchTagBtn.disabled = true;
      
      // Show progress indicator
      const batchProgress = document.getElementById('batch-progress');
      const progressFill = batchProgress.querySelector('.progress-fill');
      const progressText = batchProgress.querySelector('.progress-text');
      batchProgress.classList.remove('hidden');
      progressFill.style.width = '0%';
      progressText.textContent = `Processing 0/${totalStudents} students...`;
      
      // Smaller batch size to prevent overwhelming the server
      const batchSize = 2;
      
      // Introduce a sleep function for adding small delays
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Add a retry mechanism
      const fetchWithRetry = async (studentId, retries = 2) => {
        try {
          const response = await fetch('/api/students/tags/add-student', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              studentId: studentId,
              tagName: selectedTag
            })
          });
          
          if (response.ok) return { success: true, studentId };
          return { success: false, studentId };
        } catch (error) {
          console.error(`Error tagging student ${studentId}:`, error);
          if (retries > 0) {
            // Wait before retrying
            await sleep(500);
            return fetchWithRetry(studentId, retries - 1);
          }
          return { success: false, studentId, error: error.message };
        }
      };
      
      // Process each batch with a small delay between batches
      for (let i = 0; i < studentsToTag.length; i += batchSize) {
        const batch = studentsToTag.slice(i, i + batchSize);
        
        // Process each batch concurrently
        const results = await Promise.allSettled(
          batch.map(studentId => fetchWithRetry(studentId))
        );
        
        // Process the results
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to add tag to student ${result.value?.studentId || 'unknown'}`, 
                         result.value?.error ? `Error: ${result.value.error}` : '');
          }
        }
        
        // Update progress
        const processed = Math.min(i + batchSize, totalStudents);
        const percentage = Math.round((processed / totalStudents) * 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Processing ${processed}/${totalStudents} students...`;
        
        // Add a small delay between batches to prevent overwhelming the server
        if (i + batchSize < studentsToTag.length) {
          await sleep(300);
        }
      }
      
      // Complete progress with appropriate styling
      progressFill.style.width = '100%';
      
      if (failCount === 0) {
        // All operations successful
        progressFill.style.backgroundColor = '#48bb78'; // Green
        progressText.textContent = `Success! Applied tag to all ${successCount} students.`;
      } else if (successCount === 0) {
        // All operations failed
        progressFill.style.backgroundColor = '#f56565'; // Red
        progressText.textContent = `Failed: All ${failCount} operations failed.`;
      } else {
        // Mixed results
        progressFill.style.backgroundColor = '#ecc94b'; // Yellow
        progressText.textContent = `Completed: ${successCount} successful, ${failCount} failed`;
      }
      
      // Restore button text but keep disabled for a moment
      applyBatchTagBtn.textContent = originalButtonText;
      
      // Add a delay before resetting the UI to show the completion message clearly
      await sleep(1500);
      
      // Reset selections
      selectedStudents = [];
      updateBatchSelectionInfo();
      
      // Re-enable the button
      applyBatchTagBtn.disabled = true;
      
      // Reload the student list to show updated tags
      await loadStudents();
      
      // Keep the progress bar visible for reference, will be hidden on next operation
      // This lets users see the results until they do something else
    } catch (error) {
      console.error('Error in batch tagging operation:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // ======================
  // Game Logic
  // ======================
  
  // Function to load game tags
  async function loadGameTags() {
    // Show loading indicator for tags
    const tagSelect = document.getElementById('tag-select');
    if (!tagSelect) {
      console.error('Could not find tag-select element');
      return;
    }
    
    const tagSelectWrapper = tagSelect.parentNode;
    let tagLoadingIndicator = document.getElementById('tags-loading');
    
    if (!tagLoadingIndicator) {
      tagLoadingIndicator = document.createElement('div');
      tagLoadingIndicator.id = 'tags-loading';
      tagLoadingIndicator.className = 'loading-indicator';
      tagLoadingIndicator.innerHTML = '<div class="spinner"></div><p>Loading tags...</p>';
      tagLoadingIndicator.style.margin = '5px 0';
      tagSelectWrapper.appendChild(tagLoadingIndicator);
    } else {
      tagLoadingIndicator.style.display = 'flex';
    }
    
    try {
      // Use the full URL with hostname and port
      const serverUrl = window.location.origin; // This will use whatever origin the browser is currently on
      console.log('Fetching game tags from:', `${serverUrl}/api/game/tags`);
      
      // Try the main endpoint first
      let response;
      try {
        response = await fetch(`${serverUrl}/api/game/tags`);
        if (!response.ok) throw new Error(`Main endpoint failed: ${response.status}`);
      } catch (mainError) {
        console.warn('Main game tags endpoint failed, trying backup:', mainError);
        // If the main endpoint fails, try the backup
        response = await fetch(`${serverUrl}/api/game/tags-backup`);
        if (!response.ok) throw new Error(`Backup endpoint also failed: ${response.status} ${response.statusText}`);
      }
      
      
      const tags = await response.json();
      
      // Populate game tag selector
      const tagSelect = document.getElementById('tag-select');
      
      // Clear all options except the first one
      while (tagSelect.options.length > 1) {
        tagSelect.remove(1);
      }
      
      // Add tag options with availability information
      for (const [tagName, tagInfo] of Object.entries(tags)) {
        const option = document.createElement('option');
        option.value = tagName;
        
        // Add information about how many students with images are in the tag
        let displayText = tagName;
        if (tagInfo.imageCount < 5) {
          displayText += ` (${tagInfo.imageCount}/5 students with images)`;
          option.disabled = true;
        } else {
          displayText += ` (${tagInfo.imageCount} students)`;
        }
        
        option.textContent = displayText;
        tagSelect.appendChild(option);
      }
    } catch (error) {
      console.error('Error loading game tags:', error);
      alert('Failed to load game tags. Please try again.');
      
      // Hide loading indicator even on error
      if (tagLoadingIndicator) {
        tagLoadingIndicator.style.display = 'none';
      }
    }
    
    // Hide loading indicator
    if (tagLoadingIndicator) {
      tagLoadingIndicator.style.display = 'none';
    }
  }
  
  // Load game tags when opening the game section
  playGameBtn.addEventListener('click', () => {
    loadGameTags();
  });
  
  // Advanced filters feature removed while preserving nationality and language data in students.json
  
  // Start a new game
  startGameBtn.addEventListener('click', async () => {
    const mode = gameModeSelect.value;
    const questionCount = parseInt(questionCountInput.value, 10);
    const focusDifficult = focusDifficultCheckbox.checked;
    const onlyUntried = onlyUntriedCheckbox.checked;
    const tagName = tagSelect.value || null;
    // Get the exclude tag checkbox and ensure its value is a boolean
    const excludeTagCheckbox = document.getElementById('exclude-tag');
    const excludeTag = excludeTagCheckbox ? excludeTagCheckbox.checked : false;
    // Get the similar wrong answers checkbox
    const useSimilarWrongAnswersCheckbox = document.getElementById('use-similar-wrong-answers');
    const useSimilarWrongAnswers = useSimilarWrongAnswersCheckbox ? useSimilarWrongAnswersCheckbox.checked : true;
    
      // Advanced filters removed
    const nationalityFilter = '';
    const languageFilter = '';
    const genderFilter = '';
    
    if (isNaN(questionCount) || questionCount < 5) {
      alert('Please enter a valid number of questions (minimum 5)');
      return;
    }
    
    // Show loading indicator
    const gameOptions = document.querySelector('.game-options');
    let loadingIndicator = document.getElementById('game-loading');
    
    if (!loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'game-loading';
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = '<div class="spinner"></div><p>Generating game...</p>';
      
      // Append to the game options
      if (gameOptions) {
        gameOptions.appendChild(loadingIndicator);
      } else {
        // Fallback - append directly after the start game button
        const nextSibling = startGameBtn.nextSibling;
        if (nextSibling) {
          startGameBtn.parentNode.insertBefore(loadingIndicator, nextSibling);
        } else {
          // If there's no next sibling, just append to the parent
          startGameBtn.parentNode.appendChild(loadingIndicator);
        }
      }
    } else {
      loadingIndicator.style.display = 'flex';
    }
    
    // Disable start button while loading
    startGameBtn.disabled = true;
    
    // Log the game options for debugging
    console.log('Starting game with options:', {
      mode,
      questionCount,
      focusDifficult,
      onlyUntried,
      tagName,
      excludeTag,
      useSimilarWrongAnswers
    });
    
    try {
      // Check if advanced filters are active
      const hasAdvancedFilters = nationalityFilter || languageFilter || genderFilter;
      if (hasAdvancedFilters) {
        console.log('Using advanced filters:', { nationalityFilter, languageFilter, genderFilter });
      }
      
      const response = await fetch('/api/game/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode, 
          questionCount, 
          focusDifficult, 
          onlyUntried, 
          tagName, 
          excludeTag,
          useSimilarWrongAnswers,
          advancedFilters: {
            nationality: nationalityFilter,
            language: languageFilter,
            gender: genderFilter
          }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Game generation failed:', error);
        throw new Error(error.message || error.error || 'Failed to start game');
      }
      
      currentGame = await response.json();
      currentQuestionIndex = 0;
      userAnswers = [];
      isGameActive = true; // Game is now active
      
      // Hide loading indicator when game is ready to start
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      // Re-enable start button
      startGameBtn.disabled = false;
      
      gameContainer.classList.remove('hidden');
      gameResults.classList.add('hidden');
      performanceStats.classList.add('hidden'); // Hide performance stats if they were open
      
      // Show the active tag banner if a tag was selected
      const activeBanner = document.getElementById('active-tag-banner');
      const activeTagName = document.querySelector('.active-tag-name');
      
      if (currentGame.tagName) {
        // Show whether we're including or excluding the tag
        if (currentGame.excludeTag) {
          activeTagName.textContent = `NOT ${currentGame.tagName} (excluding)`;
          activeBanner.style.backgroundColor = '#f56565'; // Red background for exclusion
        } else {
          activeTagName.textContent = currentGame.tagName;
          activeBanner.style.backgroundColor = ''; // Reset to default
        }
        activeBanner.classList.remove('hidden');
      } else {
        activeBanner.classList.add('hidden');
      }
      
      displayQuestion(currentQuestionIndex);
    } catch (error) {
      console.error('Error starting game:', error);
      
      // Hide loading indicator in case of error
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Re-enable start button
      startGameBtn.disabled = false;
      
      // Show a more detailed error message
      if (mode === 'connectionTrivia') {
        alert(`Connection Trivia Error: ${error.message}\n\nMake sure the server is running and has been restarted after implementing the connectionTrivia mode.`);
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  });
  
  // Display a game question
  function displayQuestion(index) {
    if (!currentGame || !currentGame.questions || index >= currentGame.questions.length) {
      return;
    }
    
    const question = currentGame.questions[index];
    questionDisplay.innerHTML = '';
    optionsDisplay.innerHTML = '';
    
    // Update continue button
    continueBtn.disabled = true;
    
    // Update button text based on whether this is the last question
    const isLastQuestion = index === currentGame.questions.length - 1;
    continueBtn.textContent = isLastQuestion ? 'Finish Game' : 'Next Question';
    
    // Reset options display to visible
    optionsDisplay.style.display = '';
    
    // Check for special modes and apply appropriate classes
    if (question.type === 'hard') {
      optionsDisplay.className = 'hard-mode-grid';
    } else if (question.type === 'connectionTrivia') {
      optionsDisplay.className = 'connection-options';
    } else {
      optionsDisplay.className = '';
    }
    
    // Display the question prompt based on game type
    if (question.type === 'connectionTrivia') {
      // Connection Trivia mode: Show two students and ask about their connection
      displayConnectionTrivia(question, index);
    } else if (question.type === 'shortAnswer') {
      // Short answer mode: Show image, ask for name with text input
      const studentImage = question.studentImage;
      
      // Hide the continue button for short answer mode as it's not needed
      continueBtn.style.display = 'none';
      
      questionDisplay.innerHTML = `
        <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
        <p>What is this person's first name?</p>
        <p class="short-answer-hint">(Either first name or preferred name is accepted)</p>
        <img src="${studentImage}" alt="Student">
        <p class="short-answer-hint">Type your answer below:</p>
      `;
      
      // Create text input for short answer
      const answerForm = document.createElement('div'); // Changed to div to avoid nested form issues
      answerForm.className = 'short-answer-form';
      answerForm.innerHTML = `
        <form id="short-answer-form">
          <input type="text" id="short-answer-input" placeholder="Type first or preferred name" autocomplete="off">
          <button type="submit" id="submit-answer-btn">Submit Answer</button>
        </form>
      `;
      
      // Append the form directly to the question display instead of options display
      questionDisplay.appendChild(answerForm);
      
      // Clear the options display completely for short answer mode
      optionsDisplay.innerHTML = '';
      optionsDisplay.style.display = 'none';
      
      // Now add the submission handler to the actual form
      const shortAnswerForm = document.getElementById('short-answer-form');
      const textInput = document.getElementById('short-answer-input');
      
      // Ensure input has focus on page load
      setTimeout(() => {
        textInput.focus();
      }, 100);
      
      shortAnswerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const userAnswer = textInput.value.trim();
        
        if (userAnswer) {
          // Record the answer
          const existingAnswerIndex = userAnswers.findIndex(a => a.questionId === question.id);
          
          if (existingAnswerIndex !== -1) {
            userAnswers[existingAnswerIndex].textAnswer = userAnswer;
            delete userAnswers[existingAnswerIndex].dontKnow;
          } else {
            userAnswers.push({
              questionId: question.id,
              textAnswer: userAnswer
            });
          }
          
          // Auto-advance without using the continue button
          const isLastQuestion = currentQuestionIndex === currentGame.questions.length - 1;
          if (isLastQuestion) {
            finishGame();
          } else {
            // Store reference to input field for focus after new question loads
            const oldInput = textInput;
            
            // Go to next question
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
            
            // Focus on the new input field after a brief delay
            setTimeout(() => {
              const newInput = document.getElementById('short-answer-input');
              if (newInput) newInput.focus();
            }, 100);
          }
        }
      });
    } else if (question.type === 'standard' || question.type === 'hard') {
      // Multiple Choice or Hard game mode: Show image, ask for name
      const studentImage = question.studentImage || question.options.find(opt => opt.id === question.studentId)?.imagePath;
      
      // Show the continue button for standard/hard modes
      continueBtn.style.display = '';
      
      questionDisplay.innerHTML = `
        <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
        <p>Who is this?</p>
        <img src="${studentImage}" alt="Student">
      `;
      
      // Create option cards with names - note that hard mode will have many more options
      question.options.forEach((option, idx) => {
        const optionCard = document.createElement('div');
        
        // Add different class for hard mode options (smaller size)
        optionCard.className = question.type === 'hard' ? 'option-card hard-mode' : 'option-card';
        optionCard.dataset.id = option.id;
        
        // Only show numbers 1-9 for keyboard selection, even in hard mode
        const showNumber = idx < 9;
        const numberHtml = showNumber ? `<span class="option-number">${idx + 1}</span>` : '';
        
        // Format name with preferred name styling if needed
        let displayName = formatNameWithPreferred(option);
        
        optionCard.innerHTML = `
          ${numberHtml}
          <h4>${displayName}</h4>
        `;
        
        optionCard.addEventListener('click', () => selectOption(optionCard, question));
        optionsDisplay.appendChild(optionCard);
      });
    } else {
      // Reverse game mode: Show name, ask for image
      // Show the continue button for reverse mode
      continueBtn.style.display = '';
      
      // Format the student name with preferred name styling
      const studentObj = {
        fullName: question.studentName,
        firstName: question.firstName,
        lastName: question.lastName,
        preferredName: question.preferredName
      };
      
      const formattedName = formatNameWithPreferred(studentObj);
      
      // Add reverse-mode class for sticky positioning
      questionDisplay.className = 'reverse-mode';
      
      // Create and insert mobile name banner for reverse mode
      const isMobile = window.innerWidth <= 576;
      if (isMobile) {
        // Clear any existing mobile banners first
        const existingBanner = document.getElementById('mobile-name-banner');
        if (existingBanner) existingBanner.remove();
        
        // Create mobile-specific fixed header
        const mobileBanner = document.createElement('div');
        mobileBanner.id = 'mobile-name-banner';
        mobileBanner.innerHTML = `
          <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
          <p class="name-banner">Which photo shows <strong>${formattedName}</strong>?</p>
        `;
        
        // Insert at the beginning of body to ensure it's on top
        document.body.insertBefore(mobileBanner, document.body.firstChild);
      }
      
      // Still keep the regular question display for non-mobile
      questionDisplay.innerHTML = `
        <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
        <p class="name-banner">Which photo shows <strong>${formattedName}</strong>?</p>
      `;
      
      // Set special class for reverse mode options display to improve mobile layout
      optionsDisplay.className = 'reverse-mode';
      
      // Hide continue button for reverse mode - we'll auto-advance
      continueBtn.style.display = 'none';
      
      // Create option cards with images
      question.options.forEach((option, idx) => {
        const optionCard = document.createElement('div');
        optionCard.className = 'option-card';
        optionCard.dataset.id = option.id;
        
        // Only show numbers 1-9 for keyboard selection
        const showNumber = idx < 9;
        const numberHtml = showNumber ? `<span class="option-number">${idx + 1}</span>` : '';
        
        optionCard.innerHTML = `
          ${numberHtml}
          <img src="${option.imagePath}" alt="Student" loading="lazy">
          <span class="tap-to-select">Tap to select</span>
        `;
        
        optionCard.addEventListener('click', () => selectOption(optionCard, question));
        optionsDisplay.appendChild(optionCard);
      });
    }
    
    // Add "Don't Know" button for all question types
    addDontKnowButton(question);
  }
  
  // Add "Don't Know" button for the current question
  function addDontKnowButton(question) {
    // Remove any existing "Don't Know" button first
    const existingBtn = document.querySelector('.dont-know-container');
    if (existingBtn) {
      existingBtn.remove();
    }
    
    // Create new "Don't Know" button
    const dontKnowContainer = document.createElement('div');
    dontKnowContainer.className = 'dont-know-container';
    
    const dontKnowBtn = document.createElement('button');
    dontKnowBtn.className = 'dont-know-btn';
    dontKnowBtn.textContent = "I Don't Know";
    dontKnowBtn.addEventListener('click', () => handleDontKnow(question));
    
    dontKnowContainer.appendChild(dontKnowBtn);
    
    // Insert after options display
    if (optionsDisplay.nextSibling) {
      optionsDisplay.parentNode.insertBefore(dontKnowContainer, optionsDisplay.nextSibling);
    } else {
      optionsDisplay.parentNode.appendChild(dontKnowContainer);
    }
  }
  
  // Handle "Don't Know" button click
  function handleDontKnow(question) {
    // Record a "don't know" answer - use a special ID like "dont-know"
    const existingAnswerIndex = userAnswers.findIndex(a => a.questionId === question.id);
    
    if (existingAnswerIndex !== -1) {
      userAnswers[existingAnswerIndex].selectedOptionId = 'dont-know';
      userAnswers[existingAnswerIndex].dontKnow = true;
    } else {
      userAnswers.push({
        questionId: question.id,
        selectedOptionId: 'dont-know',
        dontKnow: true
      });
    }
    
    // Enable the continue button
    continueBtn.disabled = false;
    
    // Add visual indication that "Don't Know" was selected
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const dontKnowBtn = document.querySelector('.dont-know-btn');
    if (dontKnowBtn) {
      dontKnowBtn.classList.add('selected');
      dontKnowBtn.style.backgroundColor = '#4a5568';
    }
    
    // Auto-advance to next question for shortAnswer or reverse mode
    if (question.type === 'shortAnswer' || question.type === 'reverse') {
      // Add a slight delay before auto-advancing to allow the user to see their selection
      setTimeout(() => {
        // Remove mobile banner if it exists
        const mobileBanner = document.getElementById('mobile-name-banner');
        if (mobileBanner) {
          mobileBanner.remove();
        }
        
        // If this is the last question, finish the game
        const isLastQuestion = currentQuestionIndex === currentGame.questions.length - 1;
        if (isLastQuestion) {
          finishGame();
        } else {
          // Move to the next question
          currentQuestionIndex++;
          displayQuestion(currentQuestionIndex);
        }
      }, 500);
    }
  }
  
  // Handle option selection
  function selectOption(optionCard, question) {
    // Clear previous selections
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Reset "Don't Know" button if it was selected
    const dontKnowBtn = document.querySelector('.dont-know-btn');
    if (dontKnowBtn) {
      dontKnowBtn.classList.remove('selected');
      dontKnowBtn.style.backgroundColor = '';
    }
    
    // Mark this option as selected
    optionCard.classList.add('selected');
    
    // Record the answer
    const selectedOptionId = optionCard.dataset.id;
    const existingAnswerIndex = userAnswers.findIndex(a => a.questionId === question.id);
    
    if (existingAnswerIndex !== -1) {
      userAnswers[existingAnswerIndex].selectedOptionId = selectedOptionId;
    } else {
      userAnswers.push({
        questionId: question.id,
        selectedOptionId
      });
    }
    
    // Enable the continue button
    continueBtn.disabled = false;
    
    // For reverse mode, auto-advance to next question after a brief delay
    if (question.type === 'reverse') {
      // Add visual feedback before advancing
      setTimeout(() => {
        // Remove mobile banner if it exists
        const mobileBanner = document.getElementById('mobile-name-banner');
        if (mobileBanner) {
          mobileBanner.remove();
        }
        
        // If this is the last question, finish the game
        const isLastQuestion = currentQuestionIndex === currentGame.questions.length - 1;
        if (isLastQuestion) {
          finishGame();
        } else {
          // Move to the next question
          currentQuestionIndex++;
          displayQuestion(currentQuestionIndex);
        }
      }, 500); // Half-second delay for visual feedback
    }
  }
  
  // Finish the game and show results
  async function finishGame() {
    // Remove any mobile name banner if it exists
    const mobileBanner = document.getElementById('mobile-name-banner');
    if (mobileBanner) {
      mobileBanner.remove();
    }
    
    try {
      // Debug what we're sending
      console.log('=== SUBMITTING GAME RESULTS ===');
      console.log('Current game questions:', currentGame.questions.length);
      console.log('User answers:', userAnswers.length);
      console.log('Sample wrong answers:', userAnswers
        .filter(a => a.dontKnow !== true && a.correct !== true)
        .slice(0, 2).map(a => JSON.stringify(a)));
      
      // Create a structured payload to easily debug
      const payload = {
        questions: currentGame.questions,
        answers: userAnswers
      };
      
      console.log('Sending payload to /api/game/score');
      
      const response = await fetch('/api/game/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Error response from server:', error);
        throw new Error(error.error || 'Failed to score game');
      }
      
      console.log('Response ok, getting JSON...');
      const scoreResult = await response.json();
      console.log('Score result received:', 
        scoreResult.score + '/' + scoreResult.totalQuestions,
        scoreResult.percentage + '%');
      
      // Check if performance data is returned
      if (scoreResult.performanceData) {
        console.log('Performance data received for', 
          Object.keys(scoreResult.performanceData).length, 'students');
          
        // Check for wrong answers
        Object.entries(scoreResult.performanceData).forEach(([studentId, data]) => {
          if (data.wrongAnswers && data.wrongAnswers.length > 0) {
            console.log(`Student ${studentId} has ${data.wrongAnswers.length} wrong answers`);
          }
        });
      }
      
      // Display the results
      displayGameResults(scoreResult);
    } catch (error) {
      console.error('Error scoring game:', error);
      alert(`Error: ${error.message}`);
    }
  }

  // Handle the continue button (next question or finish game)
  continueBtn.addEventListener('click', () => {
    const isLastQuestion = currentQuestionIndex === currentGame.questions.length - 1;
    
    if (isLastQuestion) {
      // This is the last question, so finish the game
      finishGame();
    } else {
      // Move to the next question
      currentQuestionIndex++;
      displayQuestion(currentQuestionIndex);
    }
  });
  
  // Display connection trivia question
  function displayConnectionTrivia(question, index) {
    // Show the continue button for connection trivia
    continueBtn.style.display = '';
    
    // Create the header and question display
    questionDisplay.innerHTML = `
      <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
      <p class="connection-question">${question.question}</p>
      <div class="student-connection-pair">
        <div class="connection-student">
          <img src="${question.student1.imagePath}" alt="${question.student1.name}">
          <p>${question.student1.name}</p>
        </div>
        <div class="connection-and">
          <div class="connection-line"></div>
          <div class="connection-circle">?</div>
          <div class="connection-line"></div>
        </div>
        <div class="connection-student">
          <img src="${question.student2.imagePath}" alt="${question.student2.name}">
          <p>${question.student2.name}</p>
        </div>
      </div>
    `;
    
    // Create options for the connection explanations
    question.options.forEach((option, idx) => {
      const optionCard = document.createElement('div');
      optionCard.className = 'option-card connection-option';
      optionCard.dataset.id = option.id;
      
      // Only show numbers 1-4 for keyboard selection
      const showNumber = idx < 4;
      const numberHtml = showNumber ? `<span class="option-number">${idx + 1}</span>` : '';
      
      optionCard.innerHTML = `
        ${numberHtml}
        <p class="connection-text">${option.text}</p>
      `;
      
      optionCard.addEventListener('click', () => selectOption(optionCard, question));
      optionsDisplay.appendChild(optionCard);
    });
  }
  
  // Display slideshow of wrong answers before showing full results
  function displayGameResults(scoreResult) {
    gameContainer.classList.add('hidden');
    isGameActive = false; // Game is no longer active when results are shown
    
    // Sort results - wrong answers first (including "Don't Know"), then correct ones
    const sortedResults = [...scoreResult.results].sort((a, b) => {
      if (a.correct && !b.correct) return 1; // a is correct, b is wrong → push a down
      if (!a.correct && b.correct) return -1; // a is wrong, b is correct → push a up
      return 0; // maintain original order for items of same correctness
    });
    
    // Filter only wrong answers for the slideshow
    const wrongAnswers = sortedResults.filter(result => !result.correct);
    
    if (wrongAnswers.length > 0) {
      // Show slideshow first
      showWrongAnswerSlideshow(wrongAnswers, scoreResult);
    } else {
      // No wrong answers, go straight to results
      showFullResults(sortedResults, scoreResult);
    }
  }
  
  // Helper function to mark an answer as correct
  function markAnswerAsCorrect(result, scoreResult, question) {
    // Mark this result as correct in the original results
    const resultIndex = scoreResult.results.findIndex(r => r.questionId === result.questionId);
    if (resultIndex !== -1) {
      // Update the result to be correct
      scoreResult.results[resultIndex].correct = true;
      
      // Update the scoreResult's score and percentage
      scoreResult.score += 1;
      scoreResult.percentage = Math.round((scoreResult.score / scoreResult.totalQuestions) * 100);
      
      // If it was previously a "Don't Know", update the dontKnowCount
      if (scoreResult.results[resultIndex].dontKnow) {
        scoreResult.dontKnowCount -= 1;
        scoreResult.dontKnowPercentage = Math.round((scoreResult.dontKnowCount / scoreResult.totalQuestions) * 100);
      }
      
      // Update the performance data for this student
      if (question.studentId && scoreResult.performanceData && scoreResult.performanceData[question.studentId]) {
        const perfData = scoreResult.performanceData[question.studentId];
        perfData.correctCount += 1;
        perfData.incorrectCount -= 1;
        perfData.successRate = (perfData.correctCount / perfData.attemptCount) * 100;
      }
      
      // Mark as overridden to skip in the slideshow
      result.overridden = true;
    }
  }
  
  // Slideshow for wrong answers review
  function showWrongAnswerSlideshow(wrongAnswers, scoreResult) {
    // Create slideshow container
    const slideContainer = document.createElement('div');
    slideContainer.className = 'slideshow-container';
    slideContainer.innerHTML = `
      <div class="slideshow-header">
        <h2>Review Mistakes</h2>
        <p>Let's review each wrong answer to help you learn</p>
        <div class="slideshow-progress">
          <div class="slideshow-progress-text">1/${wrongAnswers.length}</div>
          <div class="slideshow-progress-bar">
            <div class="slideshow-progress-fill" style="width: ${100 / wrongAnswers.length}%"></div>
          </div>
        </div>
      </div>
      <div class="slideshow-content"></div>
      <div class="slideshow-controls">
        <button class="slideshow-next-btn">Next</button>
        <button class="slideshow-skip-btn">Skip to Results</button>
      </div>
    `;
    
    // Replace game container with slideshow
    gameSection.insertBefore(slideContainer, gameResults);
    
    const slideContent = slideContainer.querySelector('.slideshow-content');
    const progressText = slideContainer.querySelector('.slideshow-progress-text');
    const progressFill = slideContainer.querySelector('.slideshow-progress-fill');
    const nextButton = slideContainer.querySelector('.slideshow-next-btn');
    const skipButton = slideContainer.querySelector('.slideshow-skip-btn');
    
    let currentSlideIndex = 0;
    
    // Show the first slide
    showSlide(currentSlideIndex);
    
    // Keep track of the original total wrong answers count
    const totalWrongAnswers = wrongAnswers.length;
    let remainingAnswersToShow = totalWrongAnswers;
    
    // Event listener for Next button
    nextButton.addEventListener('click', () => {
      currentSlideIndex++;
      remainingAnswersToShow--; // Decrement counter
      
      // Check if we've gone through all wrong answers
      if (currentSlideIndex >= wrongAnswers.length || remainingAnswersToShow <= 0) {
        // End of slideshow, show full results
        slideContainer.remove();
        showFullResults([...wrongAnswers, ...scoreResult.results.filter(r => r.correct)], scoreResult);
      } else {
        showSlide(currentSlideIndex);
      }
    });
    
    // Event listener for Skip button
    skipButton.addEventListener('click', () => {
      slideContainer.remove();
      showFullResults([...wrongAnswers, ...scoreResult.results.filter(r => r.correct)], scoreResult);
    });
    
    // Function to show a specific slide
    function showSlide(index) {
      // Skip overridden answers or undefined elements (if some were deleted)
      while (index < wrongAnswers.length && 
             (wrongAnswers[index] === undefined || 
              wrongAnswers[index].overridden)) {
        index++;
        currentSlideIndex = index; // Update the current slide index
      }
      
      // Check if we've reached the end
      if (index >= wrongAnswers.length) {
        // End of slideshow, show full results
        slideContainer.remove();
        showFullResults([...wrongAnswers, ...scoreResult.results.filter(r => r.correct)], scoreResult);
        return;
      }
      
      const result = wrongAnswers[index];
      const question = currentGame.questions.find(q => q.id === result.questionId);
      
      if (!question) return;
      
      // Update progress indicators
      progressText.textContent = `${index + 1}/${wrongAnswers.length}`;
      progressFill.style.width = `${((index + 1) / wrongAnswers.length) * 100}%`;
      
      // Update next button text for last slide
      if (index === wrongAnswers.length - 1) {
        nextButton.textContent = 'See Full Results';
      }
      
      slideContent.innerHTML = '';
      
      // Create the slide content based on question type
      if (question.type === 'shortAnswer') {
        // Short answer question
        const correctAnswers = question.acceptableAnswers.map(a => a[0].toUpperCase() + a.slice(1)); // Capitalize
        const userAnswer = result.userTextAnswer || "No answer";
        
        // First show just the image prominently
        slideContent.innerHTML = `
          <div class="slide-phase phase-1">
            <img src="${question.studentImage}" alt="Student" class="slide-image">
            <p class="slide-instruction">This student is...</p>
          </div>
        `;
        
        // Add reveal button
        const revealBtn = document.createElement('button');
        revealBtn.className = 'slide-reveal-btn';
        revealBtn.textContent = 'Reveal Name';
        slideContent.querySelector('.phase-1').appendChild(revealBtn);
        
        // Event listener for reveal button
        revealBtn.addEventListener('click', () => {
          // Replace with phase 2 content (showing the correct name)
          slideContent.innerHTML = `
            <div class="slide-phase phase-2">
              <img src="${question.studentImage}" alt="Student" class="slide-image">
              <div class="slide-answer">
                <h3 class="correct-name">${question.firstName}${question.preferredName ? ` <span class="preferred-name">'${question.preferredName}'</span> ` : ' '}${question.lastName}</h3>
                <p class="slide-note">Acceptable answers: ${correctAnswers.join(' or ')}</p>
                <p class="slide-note">You typed: <span class="wrong-name">${userAnswer}</span></p>
                <button class="override-result-btn correct-btn">I got this right</button>
                <button class="override-result-btn continue-btn">Continue</button>
              </div>
            </div>
          `;
          
          // Add event listeners for the override buttons
          const correctBtn = slideContent.querySelector('.override-result-btn.correct-btn');
          const continueBtn = slideContent.querySelector('.override-result-btn.continue-btn');
          
          if (correctBtn) {
            correctBtn.addEventListener('click', () => {
              // Use the helper function to mark this answer as correct
              markAnswerAsCorrect(result, scoreResult, question);
              
              // Proceed to next slide
              nextButton.click();
            });
          }
          
          if (continueBtn) {
            continueBtn.addEventListener('click', () => {
              // Just proceed to next slide
              nextButton.click();
            });
          }
        });
      }
      else if (question.type === 'standard' || question.type === 'hard') {
        // Photo → Name question
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        const selectedOption = result.dontKnow ? 
          { name: "Don't Know" } : 
          question.options.find(opt => opt.id === result.selectedOptionId);
          
        // Format names with preferred styling
        let correctName = formatNameWithPreferred(correctOption);
        
        // First show just the image prominently
        slideContent.innerHTML = `
          <div class="slide-phase phase-1">
            <img src="${question.studentImage}" alt="Student" class="slide-image">
            <p class="slide-instruction">This student is...</p>
          </div>
        `;
        
        // Add reveal button
        const revealBtn = document.createElement('button');
        revealBtn.className = 'slide-reveal-btn';
        revealBtn.textContent = 'Reveal Name';
        slideContent.querySelector('.phase-1').appendChild(revealBtn);
        
        // Event listener for reveal button
        revealBtn.addEventListener('click', () => {
          // Replace with phase 2 content (showing the correct name)
          slideContent.innerHTML = `
            <div class="slide-phase phase-2">
              <img src="${question.studentImage}" alt="Student" class="slide-image">
              <div class="slide-answer">
                <h3 class="correct-name">${correctName}</h3>
                ${result.dontKnow ? 
                  `<p class="slide-note">You answered: <span class="dont-know-response">Don't Know</span></p>` : 
                  `<p class="slide-note">You answered: <span class="wrong-name">${selectedOption.name}</span></p>`
                }
                <button class="override-result-btn correct-btn">I got this right</button>
                <button class="override-result-btn continue-btn">Continue</button>
              </div>
            </div>
          `;
          
          // Add event listeners for the override buttons
          const correctBtn = slideContent.querySelector('.override-result-btn.correct-btn');
          const continueBtn = slideContent.querySelector('.override-result-btn.continue-btn');
          
          if (correctBtn) {
            correctBtn.addEventListener('click', () => {
              // Use the helper function to mark this answer as correct
              markAnswerAsCorrect(result, scoreResult, question);
              
              // Proceed to next slide
              nextButton.click();
            });
          }
          
          if (continueBtn) {
            continueBtn.addEventListener('click', () => {
              // Just proceed to next slide
              nextButton.click();
            });
          }
        });
      } else {
        // Reverse mode (Name → Photo)
        const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
        const selectedOption = result.dontKnow ? 
          { imagePath: "/images/question-mark.png" } : 
          question.options.find(opt => opt.id === result.selectedOptionId);
        
        // Format the student name with preferred name styling
        const studentObj = {
          fullName: question.studentName,
          firstName: question.firstName,
          lastName: question.lastName,
          preferredName: question.preferredName
        };
        
        const formattedName = formatNameWithPreferred(studentObj);
        
        // First show just the name prominently
        slideContent.innerHTML = `
          <div class="slide-phase phase-1">
            <h2 class="slide-name">${formattedName}</h2>
            <p class="slide-instruction">Looks like...</p>
          </div>
        `;
        
        // Add reveal button
        const revealBtn = document.createElement('button');
        revealBtn.className = 'slide-reveal-btn';
        revealBtn.textContent = 'Reveal Photo';
        slideContent.querySelector('.phase-1').appendChild(revealBtn);
        
        // Event listener for reveal button
        revealBtn.addEventListener('click', () => {
          // Replace with phase 2 content (showing the correct photo)
          slideContent.innerHTML = `
            <div class="slide-phase phase-2">
              <h2 class="slide-name">${formattedName}</h2>
              <div class="slide-answer">
                <img src="${correctOption.imagePath}" alt="Correct student" class="slide-image">
                ${result.dontKnow ? 
                  `<p class="slide-note">You answered: <span class="dont-know-response">Don't Know</span></p>` : 
                  `<p class="slide-note">You selected a different photo</p>`
                }
                <button class="override-result-btn correct-btn">I got this right</button>
                <button class="override-result-btn continue-btn">Continue</button>
              </div>
            </div>
          `;
          
          // Add event listeners for the override buttons
          const correctBtn = slideContent.querySelector('.override-result-btn.correct-btn');
          const continueBtn = slideContent.querySelector('.override-result-btn.continue-btn');
          
          if (correctBtn) {
            correctBtn.addEventListener('click', () => {
              // Use the helper function to mark this answer as correct
              markAnswerAsCorrect(result, scoreResult, question);
              
              // Proceed to next slide
              nextButton.click();
            });
          }
          
          if (continueBtn) {
            continueBtn.addEventListener('click', () => {
              // Just proceed to next slide
              nextButton.click();
            });
          }
        });
      }
    }
  }
  
  // Display full game results after slideshow
  function showFullResults(sortedResults, scoreResult) {
    gameResults.classList.remove('hidden');
    
    // Include "Don't Know" count in the score display if applicable
    let scoreText = `Score: ${scoreResult.score}/${scoreResult.totalQuestions} (${scoreResult.percentage}%)`;
    if (scoreResult.dontKnowCount > 0) {
      scoreText += ` • Don't Know: ${scoreResult.dontKnowCount} (${scoreResult.dontKnowPercentage}%)`;
    }
    scoreDisplay.textContent = scoreText;
    
    resultDetails.innerHTML = '';
    
    if (scoreResult.results && scoreResult.results.length > 0) {
      const resultsList = document.createElement('div');
      resultsList.className = 'results-list';
      
      sortedResults.forEach((result, index) => {
        const question = currentGame.questions.find(q => q.id === result.questionId);
        if (!question) return;
        
        // Create a result card for this question
        const resultCard = document.createElement('div');
        
        // Add special class for "Don't Know" answers
        if (result.dontKnow) {
          resultCard.className = 'result-card dont-know';
        } else {
          resultCard.className = `result-card ${result.correct ? 'correct' : 'incorrect'}`;
        }
        
        // Question header
        const questionHeader = document.createElement('h4');
        if (result.dontKnow) {
          questionHeader.textContent = `Question ${index + 1}: Don't Know`;
        } else {
          questionHeader.textContent = `Question ${index + 1}: ${result.correct ? 'Correct!' : 'Incorrect'}`;
        }
        resultCard.appendChild(questionHeader);
        
        // Create content based on game mode and correctness
        if (question.type === 'shortAnswer') {
          // Short Answer mode: shown a photo, asked to type name
          const correctAnswers = question.acceptableAnswers.map(a => a[0].toUpperCase() + a.slice(1)); // Capitalize
          const userAnswer = result.userTextAnswer || "No answer";
          
          // Create the result content
          const resultContent = document.createElement('div');
          resultContent.className = 'result-content';
          
          // The question was about this photo
          const photoElement = document.createElement('div');
          photoElement.className = 'result-photo';
          photoElement.innerHTML = `
            <h5>You were shown:</h5>
            <img src="${question.studentImage}" alt="Student">
          `;
          
          // The answer section
          const answerElement = document.createElement('div');
          answerElement.className = 'result-answer';
          
          if (result.correct) {
            // Format the name with preferred name styling
            let displayName = formatNameWithPreferred({
              firstName: question.firstName,
              lastName: question.lastName,
              preferredName: question.preferredName
            });
            
            // If correct, show the right name and their answer
            answerElement.innerHTML = `
              <h5>You correctly identified:</h5>
              <p class="correct-name">${displayName}</p>
              <p class="slide-note">You typed: <span class="correct-name">${userAnswer}</span></p>
            `;
          } else {
            // Format the student name
            let displayName = formatNameWithPreferred({
              firstName: question.firstName,
              lastName: question.lastName,
              preferredName: question.preferredName
            });
            
            // If incorrect, show what they typed and the correct answer
            answerElement.innerHTML = `
              <h5>You typed:</h5>
              <p class="wrong-name">${userAnswer}</p>
              <h5>Correct answers:</h5>
              <p class="correct-name">${displayName}</p>
              <p class="slide-note">Acceptable: ${correctAnswers.join(' or ')}</p>
            `;
          }
          
          resultContent.appendChild(photoElement);
          resultContent.appendChild(answerElement);
          resultCard.appendChild(resultContent);
          
        } else if (question.type === 'standard' || question.type === 'hard') {
          // Standard or Hard mode: shown a photo, asked for name
          // Find the name options
          const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
          const selectedOption = question.options.find(opt => opt.id === result.selectedOptionId);
          
          // Create the result content
          const resultContent = document.createElement('div');
          resultContent.className = 'result-content';
          
          // The question was about this photo
          const photoElement = document.createElement('div');
          photoElement.className = 'result-photo';
          photoElement.innerHTML = `
            <h5>You were shown:</h5>
            <img src="${question.studentImage}" alt="Student">
          `;
          
          // The answer section
          const answerElement = document.createElement('div');
          answerElement.className = 'result-answer';
          
          if (result.correct) {
            // Format the name with preferred name styling if needed
            let displayName = formatNameWithPreferred(correctOption);
            
            // If correct, just show the right name
            answerElement.innerHTML = `
              <h5>You correctly identified:</h5>
              <p class="correct-name">${displayName}</p>
            `;
          } else if (result.dontKnow) {
            // Format the name with preferred name styling if needed
            let correctDisplayName = formatNameWithPreferred(correctOption);
            
            // If "Don't Know" was selected
            answerElement.innerHTML = `
              <h5>You selected "Don't Know"</h5>
              <h5>Correct answer:</h5>
              <p class="correct-name">${correctDisplayName}</p>
            `;
          } else {
            // Format the names with preferred name styling if needed
            let selectedDisplayName = formatNameWithPreferred(selectedOption);
            let correctDisplayName = formatNameWithPreferred(correctOption);
            
            // If incorrect, show both the chosen name and correct name
            // AND show the image of the person whose name you selected incorrectly
            answerElement.innerHTML = `
              <h5>You selected:</h5>
              <p class="wrong-name">${selectedDisplayName}</p>
              <h5>This is ${selectedOption.name}:</h5>
              <img src="${selectedOption.imagePath}" alt="${selectedOption.name}">
              <h5>Correct answer:</h5>
              <p class="correct-name">${correctDisplayName}</p>
            `;
          }
          
          resultContent.appendChild(photoElement);
          resultContent.appendChild(answerElement);
          resultCard.appendChild(resultContent);
          
        } else {
          // Reverse mode: shown a name, asked for photo
          // Find the photo options
          const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
          const selectedOption = question.options.find(opt => opt.id === result.selectedOptionId);
          
          // Create the result content
          const resultContent = document.createElement('div');
          resultContent.className = 'result-content';
          
          // The question was about this name
          const nameElement = document.createElement('div');
          nameElement.className = 'result-name';
          // Format the student name with preferred name styling if needed
          let studentDisplayName = question.studentName;
          
          // Check if we can access the correct student directly
          const correctStudent = question.options.find(opt => opt.id === question.studentId);
          if (correctStudent) {
            studentDisplayName = formatNameWithPreferred(correctStudent);
          } else if (typeof question.studentName === 'string' && question.studentName.includes("'")) {
            // Format if it has quotes indicating a preferred name
            const firstQuote = question.studentName.indexOf("'");
            const secondQuote = question.studentName.lastIndexOf("'");
            
            if (firstQuote !== secondQuote) {
              const preName = question.studentName.substring(0, firstQuote);
              const preferredName = question.studentName.substring(firstQuote, secondQuote + 1);
              const postName = question.studentName.substring(secondQuote + 1);
              
              studentDisplayName = `${preName}<span class="preferred-name">${preferredName}</span>${postName}`;
            }
          }
          
          nameElement.innerHTML = `
            <h5>You were asked to find:</h5>
            <p class="student-name">${studentDisplayName}</p>
          `;
          
          // The answer section
          const answerElement = document.createElement('div');
          answerElement.className = 'result-answer';
          
          if (result.correct) {
            // If correct, just show the right photo
            answerElement.innerHTML = `
              <h5>You correctly selected:</h5>
              <img src="${correctOption.imagePath}" alt="Correct student">
            `;
          } else if (result.dontKnow) {
            // If "Don't Know" was selected
            answerElement.innerHTML = `
              <h5>You selected "Don't Know"</h5>
              <h5>Correct answer:</h5>
              <img src="${correctOption.imagePath}" alt="Correct student">
            `;
          } else {
            // Format the names with preferred name styling if needed
            let selectedDisplayName = formatNameWithPreferred(selectedOption);
            
            // If incorrect, show both the chosen photo and correct photo
            // AND include the name of the person whose photo you selected
            answerElement.innerHTML = `
              <h5>You selected:</h5>
              <img src="${selectedOption.imagePath}" alt="Wrong student">
              <p class="wrong-name">This is ${selectedDisplayName}</p>
              <h5>Correct answer:</h5>
              <img src="${correctOption.imagePath}" alt="Correct student">
            `;
          }
          
          resultContent.appendChild(nameElement);
          resultContent.appendChild(answerElement);
          resultCard.appendChild(resultContent);
        }
        
        // Add performance data if available
        if (scoreResult.performanceData && question.studentId) {
          const performanceData = scoreResult.performanceData[question.studentId];
          
          if (performanceData) {
            const performanceInfo = document.createElement('div');
            performanceInfo.className = 'performance-info';
            
            // Calculate their difficulty level based on success rate
            const successRate = performanceData.successRate;
            let difficultyLevel = '';
            let difficultyClass = '';
            
            if (successRate >= 90) {
              difficultyLevel = 'Excellent';
              difficultyClass = 'excellent';
            } else if (successRate >= 75) {
              difficultyLevel = 'Good';
              difficultyClass = 'good';
            } else if (successRate >= 50) {
              difficultyLevel = 'Average';
              difficultyClass = 'average';
            } else if (successRate >= 25) {
              difficultyLevel = 'Poor';
              difficultyClass = 'poor';
            } else {
              difficultyLevel = 'Difficult';
              difficultyClass = 'difficult';
            }
            
            performanceInfo.innerHTML = `
              <h5>Performance History: <span class="difficulty-badge ${difficultyClass}">${difficultyLevel}</span></h5>
              <div class="performance-meter">
                <div class="performance-meter-fill ${difficultyClass}" style="width: ${successRate}%"></div>
              </div>
              <div class="performance-stats">
                Success rate: <span>${Math.round(successRate)}%</span> (${performanceData.correctCount} correct out of ${performanceData.attemptCount} attempts)
              </div>
            `;
            
            resultCard.appendChild(performanceInfo);
          }
        }
        
        resultsList.appendChild(resultCard);
      });
      
      // Add headlines for wrong and correct answer sections
      if (scoreResult.score < scoreResult.totalQuestions) {
        const wrongHeading = document.createElement('h3');
        wrongHeading.className = 'result-section-heading incorrect';
        wrongHeading.textContent = `Incorrect Answers (${scoreResult.totalQuestions - scoreResult.score})`;
        resultDetails.appendChild(wrongHeading);
      }
      
      resultDetails.appendChild(resultsList);
      
      if (scoreResult.score > 0) {
        const correctHeading = document.createElement('h3');
        correctHeading.className = 'result-section-heading correct';
        correctHeading.textContent = `Correct Answers (${scoreResult.score})`;
        correctHeading.style.marginTop = '2.5rem';
        resultDetails.appendChild(correctHeading);
      }
    }
  }
  
  // Play again
  playAgainBtn.addEventListener('click', () => {
    gameResults.classList.add('hidden');
    gameContainer.classList.add('hidden');
  });
  
  // Make checkboxes mutually exclusive
  focusDifficultCheckbox.addEventListener('change', () => {
    if (focusDifficultCheckbox.checked) {
      onlyUntriedCheckbox.checked = false;
    }
  });
  
  onlyUntriedCheckbox.addEventListener('change', () => {
    if (onlyUntriedCheckbox.checked) {
      focusDifficultCheckbox.checked = false;
    }
  });
  
  // Add keyboard shortcut for "Don't Know" button (press '5')
  document.addEventListener('keydown', (e) => {
    // Only process keyboard events when the game is active
    if (!isGameActive) return;
    
    // Skip if we're typing in the short answer input
    if (document.activeElement.id === 'short-answer-input') {
      return;
    }
    
    if (e.key === '5') {
      // Find the current question and the "Don't Know" button
      const question = currentGame.questions[currentQuestionIndex];
      const dontKnowBtn = document.querySelector('.dont-know-btn');
      
      if (question && dontKnowBtn) {
        // Trigger click on the "Don't Know" button
        dontKnowBtn.click();
        
        // Add a slight delay before auto-advancing to allow the user to see their selection
        setTimeout(() => {
          // Auto-advance if button is enabled
          if (!continueBtn.disabled) {
            continueBtn.click();
          }
        }, 300);
      }
    }
  });
  
  // ===========================
  // Helper Functions
  // ===========================
  
  // Display an error message toast notification
  function showErrorMessage(message, duration = 5000) {
    // Check if we already have a toast container
    let toastContainer = document.querySelector('.toast-container');
    
    // Create container if it doesn't exist
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-message error';
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">⚠️</span>
        <span class="toast-text">${message}</span>
        <button class="toast-close">&times;</button>
      </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    });
    
    // Automatically remove after duration
    setTimeout(() => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('toast-visible');
    }, 50);
  }
  
  // Display wrong answers history for a student with enhanced error handling
  function displayWrongAnswersHistory(student) {
    try {
      // Validate student data
      if (!student) {
        console.error('Error: Student data is missing');
        showErrorMessage('Unable to display student data: Student not found');
        return;
      }

      // Validate performance data
      if (!student.performance) {
        console.error('Error: Student performance data is missing', student);
        showErrorMessage('Unable to display performance data: Data not found');
        return;
      }

      // Create a modal to display wrong answers
      const modal = document.createElement('div');
      modal.className = 'modal wrong-answers-modal';
      
      // Get properly formatted name with fallback
      let studentName = 'Unknown Student';
      try {
        studentName = formatNameWithPreferred(student);
      } catch (nameErr) {
        console.error('Error formatting student name:', nameErr);
        studentName = student.fullName || student.firstName + ' ' + student.lastName || 'Unknown Student';
      }
      
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Wrong Answers History: ${studentName}</h3>
            <button class="close-modal-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="wrong-answers-list"></div>
          </div>
          <div class="modal-status-bar hidden">
            <div class="status-message">Loading...</div>
            <div class="status-spinner"></div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Add keyboard support for closing modal with Escape key
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          modal.remove();
          document.removeEventListener('keydown', handleKeyDown);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      
      // Add event listener to close the modal
      const closeBtn = modal.querySelector('.close-modal-btn');
      closeBtn.addEventListener('click', () => {
        modal.remove();
        document.removeEventListener('keydown', handleKeyDown);
      });
      
      // Also close when clicking outside the modal content
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
          document.removeEventListener('keydown', handleKeyDown);
        }
      });
      
      // Get wrong answers list container
      const wrongAnswersList = modal.querySelector('.wrong-answers-list');
      
      // Add loading indicator for better UX
      const statusBar = modal.querySelector('.modal-status-bar');
      const showLoading = () => {
        statusBar.classList.remove('hidden');
        statusBar.classList.add('loading');
      };
      
      const hideLoading = () => {
        statusBar.classList.add('hidden');
        statusBar.classList.remove('loading', 'error');
      };
      
      const showStatus = (message, isError = false) => {
        const statusMessage = statusBar.querySelector('.status-message');
        statusMessage.textContent = message;
        statusBar.classList.remove('hidden');
        
        if (isError) {
          statusBar.classList.add('error');
          statusBar.classList.remove('loading');
        }
      };
      
      // Show loading indicator
      showLoading();
      
      // Wrap the rest in a try/catch block to handle errors
      try {
        // Check if there are any wrong answers to display
        if (!Array.isArray(student.performance.wrongAnswers) || student.performance.wrongAnswers.length === 0) {
          // Hide loading indicator when finished
          hideLoading();
          
          // For debugging purposes, add a simulated wrong answer
          const simulateBtn = document.createElement('button');
      simulateBtn.className = 'simulate-wrong-answer-btn';
      simulateBtn.textContent = 'Simulate Wrong Answer (For Testing)';
      simulateBtn.style.marginTop = '20px';
      simulateBtn.style.padding = '10px 15px';
      simulateBtn.style.backgroundColor = '#4a5568';
      simulateBtn.style.color = 'white';
      simulateBtn.style.border = 'none';
      simulateBtn.style.borderRadius = '4px';
      simulateBtn.style.cursor = 'pointer';
      
      simulateBtn.addEventListener('click', async function() {
        try {
          // Create a sample wrong answer
          const sampleAnswer = {
            timestamp: new Date().toISOString(),
            questionType: 'standard',
            selectedName: 'Wrong Person',
            selectedId: 'wrong_id',
            correctName: student.fullName,
            correctId: student.id
          };
          
          // Add it to the student record
          student.performance.wrongAnswers = student.performance.wrongAnswers || [];
          student.performance.wrongAnswers.push(sampleAnswer);
          
          // Save it to the DB via API
          await fetch('/api/game/performance/add-wrong-answer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              studentId: student.id,
              wrongAnswer: sampleAnswer
            })
          });
          
          // Refresh the view
          displayWrongAnswersHistory(student);
        } catch (error) {
          console.error('Error simulating wrong answer:', error);
          alert('Error simulating wrong answer: ' + error.message);
        }
      });
      
      wrongAnswersList.innerHTML = '<p class="no-wrong-answers">No detailed wrong answer history available yet. Play more games to collect data about incorrect answers.</p>';
      wrongAnswersList.appendChild(simulateBtn);
      return;
    }
    
    // Sort wrong answers by date (most recent first)
    const sortedWrongAnswers = [...student.performance.wrongAnswers].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Display each wrong answer
    sortedWrongAnswers.forEach((wrongAnswer, index) => {
      const wrongAnswerItem = document.createElement('div');
      wrongAnswerItem.className = 'wrong-answer-item';
      
      // Format timestamp
      const date = new Date(wrongAnswer.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Create content based on question type
      let answerContent = '';
      
      if (wrongAnswer.questionType === 'shortAnswer') {
        // Short answer format - what they typed vs correct answers
        const correctAnswers = wrongAnswer.correctAnswers 
          ? wrongAnswer.correctAnswers.map(a => a[0].toUpperCase() + a.slice(1)).join(' or ')
          : 'N/A';
        
        answerContent = `
          <div class="wrong-answer-details">
            <p>You typed: <span class="wrong-text">${wrongAnswer.userAnswer || 'N/A'}</span></p>
            <p>Correct answer(s): <span class="correct-text">${correctAnswers}</span></p>
          </div>
        `;
      } else if (wrongAnswer.questionType === 'standard' || wrongAnswer.questionType === 'hard') {
        // Standard/hard mode - which name they selected
        answerContent = `
          <div class="wrong-answer-details">
            <p>You selected: <span class="wrong-text">${wrongAnswer.selectedName || 'N/A'}</span></p>
            <p>Correct answer: <span class="correct-text">${wrongAnswer.correctName || 'N/A'}</span></p>
            <p class="question-mode">${wrongAnswer.questionType === 'hard' ? 'Hard Mode' : 'Multiple Choice Mode'}</p>
          </div>
        `;
      } else if (wrongAnswer.questionType === 'reverse') {
        // For reverse mode, we'll need to look up the student names if they're missing
        let selectedName = wrongAnswer.selectedName;
        let correctName = wrongAnswer.correctName;
        
        // If we're missing names, we need to look them up from the allStudents array
        if (!selectedName || !correctName) {
          // Improved approach to get names reliably
          const lookupNameById = async (studentId) => {
            if (!studentId) return "Unknown";
            
            // First try to extract info from the ID
            const idMatch = studentId.match(/student_(\d+)_(\d+)/);
            if (idMatch && idMatch[2]) {
              const studentNumber = idMatch[2];
              return `Student #${studentNumber}`; // Fallback to using just the number
            }
            
            // Check if we have students in memory (in window.performanceStatsData)
            if (window.performanceStatsData && Array.isArray(window.performanceStatsData)) {
              const student = window.performanceStatsData.find(s => s.id === studentId);
              if (student) {
                console.log(`Found student in window.performanceStatsData:`, student);
                if (student.preferredName) {
                  return `${student.firstName} '${student.preferredName}' ${student.lastName}`;
                } else {
                  return `${student.firstName} ${student.lastName}`;
                }
              }
            }
            
            // If we don't have it in memory, try to fetch it directly
            try {
              console.log(`Looking up student with ID: ${studentId}`);
              // Try to fetch this specific student first
              const response = await fetch(`/api/students/${studentId}`);
              
              if (response.ok) {
                const student = await response.json();
                console.log(`Found student via API:`, student);
                
                if (student.preferredName) {
                  return `${student.firstName} '${student.preferredName}' ${student.lastName}`;
                } else {
                  return `${student.firstName} ${student.lastName}`;
                }
              } else {
                console.warn(`Failed to fetch student with ID ${studentId}, trying to get all students`);
              }
            } catch (error) {
              console.error(`Error looking up individual student ${studentId}:`, error);
            }
            
            // Fallback: fetch all students
            try {
              console.log(`Looking up all students to find ID: ${studentId}`);
              const response = await fetch(`/api/students`);
              if (!response.ok) {
                console.error(`Failed to fetch students`);
                return "Unknown Student";
              }
              
              const allStudents = await response.json();
              const student = allStudents.find(s => s.id === studentId);
              console.log(`Found student in all students:`, student);
              
              if (!student) return "Unknown Student";
              
              // Return formatted name
              if (student.preferredName) {
                return `${student.firstName} '${student.preferredName}' ${student.lastName}`;
              } else {
                return `${student.firstName} ${student.lastName}`;
              }
            } catch (error) {
              console.error(`Error looking up student ${studentId} in all students:`, error);
              return "Unknown Student";
            }
          };
          
          // Update the names by looking them up (this is asynchronous)
          const updateNames = async () => {
            try {
              // First, show loading state
              const targetElement = document.querySelector(`[data-wrong-answer-id="${wrongAnswer.timestamp}"]`);
              if (targetElement) {
                if (!selectedName && wrongAnswer.selectedId) {
                  const wrongNameElem = targetElement.querySelector('.wrong-name');
                  if (wrongNameElem) wrongNameElem.textContent = "Loading...";
                }
                if (!correctName && wrongAnswer.correctId) {
                  const correctNameElem = targetElement.querySelector('.correct-name');
                  if (correctNameElem) correctNameElem.textContent = "Loading...";
                }
              }
              
              // Fetch both names in parallel for better performance
              let [newSelectedName, newCorrectName] = ["Unknown", "Unknown"];
              
              if (!selectedName && wrongAnswer.selectedId) {
                newSelectedName = await lookupNameById(wrongAnswer.selectedId);
              } else {
                newSelectedName = selectedName || "Unknown";
              }
              
              if (!correctName && wrongAnswer.correctId) {
                newCorrectName = await lookupNameById(wrongAnswer.correctId);
              } else {
                newCorrectName = correctName || "Unknown";
              }
              
              // Now update the content with the retrieved names
              const nameDebugInfo = JSON.stringify({
                lookupPerformed: true,
                selectedId: wrongAnswer.selectedId,
                correctId: wrongAnswer.correctId,
                lookupSelectedName: newSelectedName,
                lookupCorrectName: newCorrectName,
                timestamp: new Date().toISOString()
              });
              
              // Target the specific element and update it
              if (targetElement) {
                const wrongNameElem = targetElement.querySelector('.wrong-name');
                const correctNameElem = targetElement.querySelector('.correct-name');
                const debugInfoElem = targetElement.querySelector('.debug-info');
                
                if (wrongNameElem) wrongNameElem.textContent = newSelectedName;
                if (correctNameElem) correctNameElem.textContent = newCorrectName;
                if (debugInfoElem) debugInfoElem.textContent = nameDebugInfo;
              } else {
                console.warn(`Element with data-wrong-answer-id="${wrongAnswer.timestamp}" not found for updating`);
              }
            } catch (err) {
              console.error("Error in updateNames:", err);
              
              // Make sure we still update the UI even if there was an error
              const targetElement = document.querySelector(`[data-wrong-answer-id="${wrongAnswer.timestamp}"]`);
              if (targetElement) {
                const wrongNameElem = targetElement.querySelector('.wrong-name');
                const correctNameElem = targetElement.querySelector('.correct-name');
                
                if (wrongNameElem && (!selectedName && wrongAnswer.selectedId)) 
                  wrongNameElem.textContent = "Error loading name";
                  
                if (correctNameElem && (!correctName && wrongAnswer.correctId)) 
                  correctNameElem.textContent = "Error loading name";
              }
            }
          };
          
          // Start the name lookup process
          setTimeout(updateNames, 100);
        }
        
        // For now, use what we have, the updateNames function will update the DOM later
        selectedName = selectedName || "Loading...";
        correctName = correctName || "Loading...";
        
        // Add debug for developers to diagnose the issue
        let debugInfo;
        try {
          debugInfo = JSON.stringify({
            timestamp: wrongAnswer.timestamp,
            hasStudentName: !!wrongAnswer.studentName,
            studentName: wrongAnswer.studentName,
            hasSelectedName: !!wrongAnswer.selectedName,
            selectedName: wrongAnswer.selectedName,
            selectedId: wrongAnswer.selectedId,
            hasCorrectName: !!wrongAnswer.correctName,
            correctName: wrongAnswer.correctName
          });
        } catch (err) {
          console.error("Error creating debug info:", err);
          debugInfo = JSON.stringify({error: "Could not create debug info"});
        }
        
        try {
          const uniqueId = wrongAnswer.timestamp || Math.random().toString(36).substring(2, 15);
          
          answerContent = `
            <div class="wrong-answer-details" data-wrong-answer-id="${uniqueId}">
              <p>Name: <span class="name-text">${wrongAnswer.studentName || 'N/A'}</span></p>
              <p>You selected: <span class="wrong-text wrong-name">${selectedName}</span></p>
              <p>Correct student: <span class="correct-text correct-name">${correctName}</span></p>
              <p class="question-mode">Reverse Mode (Name → Photo)</p>
              <p class="debug-info" style="font-size: 8px; color: #ccc; max-width: 100%; word-wrap: break-word;">${debugInfo}</p>
            </div>
          `;
        } catch (err) {
          console.error("Error creating answer content:", err);
          answerContent = `
            <div class="wrong-answer-details">
              <p>Error rendering wrong answer details</p>
              <p>Student: ${wrongAnswer.studentName || 'Unknown'}</p>
            </div>
          `;
        }
      } else {
        // Generic format if details are incomplete
        answerContent = `
          <div class="wrong-answer-details">
            <p>Answered incorrectly</p>
            <p class="question-mode">Details not available</p>
          </div>
        `;
      }
      
      wrongAnswerItem.innerHTML = `
        <div class="wrong-answer-header">
          <span class="wrong-answer-number">#${index + 1}</span>
          <span class="wrong-answer-date">${formattedDate}</span>
        </div>
        ${answerContent}
      `;
      
      wrongAnswersList.appendChild(wrongAnswerItem);
    });
    
        // Hide loading indicator when finished
        hideLoading();
      } catch (innerError) {
        console.error('Error rendering wrong answers:', innerError);
        showStatus('Error loading wrong answers. Please try again.', true);
      }
    } catch (error) {
      console.error('Error displaying wrong answers history:', error);
      showErrorMessage('Failed to display wrong answers. Please try again later.');
    }
  }
  
  // Format a name with preferred name styling if needed
  function formatNameWithPreferred(option) {
    if (!option) return 'Unknown';
    
    // Get the base name to work with
    let displayName = option.name || option.fullName || 
                     (option.firstName && option.lastName ? `${option.firstName} ${option.lastName}` : 'Unknown');
    
    // CASE 1: Object has a preferredName property and firstName/lastName for formatting
    if (option.preferredName && option.firstName && option.lastName) {
      return `${option.firstName} <span class="preferred-name">'${option.preferredName}'</span> ${option.lastName}`;
    }
    
    // CASE 2: Name is in the format "First 'Preferred' Last"
    if (typeof displayName === 'string' && displayName.includes("'")) {
      const firstQuote = displayName.indexOf("'");
      const secondQuote = displayName.lastIndexOf("'");
      
      // Check if there are actually two quotes (preferred name exists)
      if (firstQuote !== secondQuote) {
        const preName = displayName.substring(0, firstQuote);
        const preferredName = displayName.substring(firstQuote, secondQuote + 1);
        const postName = displayName.substring(secondQuote + 1);
        
        return `${preName}<span class="preferred-name">${preferredName}</span>${postName}`;
      }
    }
    
    // CASE 3: No preferred name found, return the name as is
    return displayName;
  }
  
  // ===========================
  // Performance Statistics
  // ===========================
  
  // View performance statistics
  viewPerformanceBtn.addEventListener('click', async () => {
    try {
      // Hide game container and results if they're shown
      gameContainer.classList.add('hidden');
      gameResults.classList.add('hidden');
      
      // Load performance data
      await loadPerformanceStats();
      
      // Load tags for filtering
      await loadTags();
      
      // Show the performance stats section
      performanceStats.classList.remove('hidden');
    } catch (error) {
      console.error('Error loading performance stats:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Close performance statistics
  closeStatsBtn.addEventListener('click', () => {
    performanceStats.classList.add('hidden');
  });
  
  // Reset performance statistics
  resetStatsBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset all performance data? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/game/performance', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset performance data');
      }
      
      alert('Performance data has been reset successfully.');
      await loadPerformanceStats(); // Reload the stats
    } catch (error) {
      console.error('Error resetting performance data:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Sort performance data
  sortPerformanceSelect.addEventListener('change', () => {
    renderPerformanceStats();
  });
  
  // Filter performance data by tag
  document.getElementById('filter-performance-tag').addEventListener('change', () => {
    renderPerformanceStats();
  });
  
  // Load performance statistics
  async function loadPerformanceStats() {
    try {
      // Load all students first
      const studentsResponse = await fetch('/api/students');
      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }
      const students = await studentsResponse.json();
      
      // Load performance data
      const perfResponse = await fetch('/api/game/performance');
      if (!perfResponse.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const performanceData = await perfResponse.json();
      
      // Combine student data with performance data
      const combinedData = students.map(student => {
        const performance = performanceData[student.id] || {
          correctCount: 0,
          incorrectCount: 0,
          dontKnowCount: 0,
          attemptCount: 0,
          successRate: 0,
          wrongAnswers: []
        };
        
        // Ensure wrongAnswers array exists
        if (!performance.wrongAnswers) {
          performance.wrongAnswers = [];
        }
        
        return {
          ...student,
          performance
        };
      });
      
      // Store the combined data for rendering
      window.performanceStatsData = combinedData;
      
      // Render the performance statistics
      renderPerformanceStats();
    } catch (error) {
      console.error('Error loading performance stats:', error);
      throw error;
    }
  }
  
  // Render performance statistics
  function renderPerformanceStats() {
    if (!window.performanceStatsData) return;
    
    const students = [...window.performanceStatsData];
    const sortBy = sortPerformanceSelect.value;
    const filterTag = document.getElementById('filter-performance-tag').value;
    
    // First filter by tag if needed
    let filteredStudents = students;
    if (filterTag) {
      filteredStudents = students.filter(student => {
        return student.tags && Array.isArray(student.tags) && student.tags.includes(filterTag);
      });
    }
    
    // Sort the students based on the selected criteria
    if (sortBy === 'difficulty') {
      // Sort by success rate (ascending)
      filteredStudents.sort((a, b) => {
        // First check if they have attempts
        const aHasAttempts = a.performance.attemptCount > 0;
        const bHasAttempts = b.performance.attemptCount > 0;
        
        // Put students with attempts first
        if (aHasAttempts && !bHasAttempts) return -1;
        if (!aHasAttempts && bHasAttempts) return 1;
        
        // If neither has attempts or both have attempts, sort by success rate
        if (!aHasAttempts && !bHasAttempts) {
          return a.fullName.localeCompare(b.fullName); // Sort by name if no attempts
        }
        
        return a.performance.successRate - b.performance.successRate;
      });
    } else if (sortBy === 'name') {
      // Sort by name (ascending)
      filteredStudents.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === 'attempts') {
      // Sort by attempt count (descending)
      filteredStudents.sort((a, b) => b.performance.attemptCount - a.performance.attemptCount);
    }
    
    // Clear the current list
    studentPerformanceList.innerHTML = '';
    
    // Check if there are no students after filtering
    if (filteredStudents.length === 0) {
      studentPerformanceList.innerHTML = `
        <div class="empty-state">
          <p>No students found ${filterTag ? `with tag "${filterTag}"` : ''}.</p>
        </div>
      `;
      return;
    }
    
    // Add student performance cards
    filteredStudents.forEach(student => {
      // Skip students without images
      if (!student.imagePath) return;
      
      const performanceCard = document.createElement('div');
      performanceCard.className = 'student-performance-card';
      
      // Determine difficulty level for the student
      const successRate = student.performance.successRate;
      let difficultyLevel = '';
      let difficultyClass = '';
      
      if (student.performance.attemptCount === 0) {
        difficultyLevel = 'No Data';
        difficultyClass = 'average';
      } else if (successRate >= 90) {
        difficultyLevel = 'Excellent';
        difficultyClass = 'excellent';
      } else if (successRate >= 75) {
        difficultyLevel = 'Good';
        difficultyClass = 'good';
      } else if (successRate >= 50) {
        difficultyLevel = 'Average';
        difficultyClass = 'average';
      } else if (successRate >= 25) {
        difficultyLevel = 'Poor';
        difficultyClass = 'poor';
      } else {
        difficultyLevel = 'Difficult';
        difficultyClass = 'difficult';
      }
      
      // Format the student name with preferred name styling
      let displayName = formatNameWithPreferred(student);
      
      // Check if student has any wrong answers
      const hasWrongAnswers = Array.isArray(student.performance.wrongAnswers) && 
                             student.performance.wrongAnswers.length > 0;
      
      performanceCard.innerHTML = `
        <img src="${student.imagePath}" alt="${student.fullName}">
        <div class="student-performance-info">
          <h4>${displayName} <span class="difficulty-badge ${difficultyClass}">${difficultyLevel}</span></h4>
          <div class="performance-meter">
            <div class="performance-meter-fill ${difficultyClass}" style="width: ${student.performance.attemptCount ? successRate : 0}%"></div>
          </div>
          <div class="performance-stats">
            ${student.performance.attemptCount > 0 
              ? `Success rate: <span>${Math.round(successRate)}%</span> (${student.performance.correctCount} correct out of ${student.performance.attemptCount} attempts)`
              : 'No attempts yet'}
          </div>
          ${hasWrongAnswers ? 
            `<div class="wrong-answers-indicator">
              <button class="view-wrong-answers-btn" data-student-id="${student.id}">
                View Wrong Answers (${student.performance.wrongAnswers.length})
              </button>
            </div>` : 
            student.performance.incorrectCount > 0 ? 
              `<div class="wrong-answers-indicator">
                <span class="no-detail-note">Wrong answers: ${student.performance.incorrectCount} (Play more games to collect details)</span>
              </div>` : ''}
        </div>
      `;
      
      studentPerformanceList.appendChild(performanceCard);
      
      // Add event listener for viewing wrong answers
      if (hasWrongAnswers) {
        const viewWrongAnswersBtn = performanceCard.querySelector('.view-wrong-answers-btn');
        if (viewWrongAnswersBtn) {
          viewWrongAnswersBtn.addEventListener('click', () => {
            displayWrongAnswersHistory(student);
          });
        }
      }
    });
  }
  
  // Keyboard controls for the game
  document.addEventListener('keydown', (e) => {
    // Only process keyboard events when the game is active
    if (!isGameActive) return;
    
    // Check if we're in short answer mode by looking for the input field
    const shortAnswerInput = document.getElementById('short-answer-input');
    
    // If we're in short answer mode AND the input is focused, don't process game keyboard shortcuts
    if (shortAnswerInput && (document.activeElement === shortAnswerInput)) {
      return; // Exit early - don't process any keyboard shortcuts while typing
    }
    
    const key = e.key;
    
    // Check if '5' key was pressed to select "Don't Know" (changed from 'd' key)
    if (key === '5') {
      const dontKnowBtn = document.querySelector('.dont-know-btn');
      if (dontKnowBtn) {
        dontKnowBtn.click();
        
        // Add a slight delay before auto-advancing
        setTimeout(() => {
          if (!continueBtn.disabled) {
            continueBtn.click();
          }
        }, 300);
        
        return; // Skip the rest of the handler after processing "Don't Know"
      }
    }
    
    // Get all option cards
    const optionCards = Array.from(document.querySelectorAll('.option-card'));
    if (optionCards.length === 0) return;
    
    // Check if a number key 1-9 was pressed and there's a corresponding option
    if (key >= '1' && key <= '9') {
      const index = parseInt(key) - 1;
      if (index < optionCards.length) {
        // Simulate click on the corresponding option
        optionCards[index].click();
        
        // Add a visual indicator for keyboard selection
        optionCards.forEach((card, i) => {
          if (i === index) {
            card.setAttribute('data-keyboard-selected', 'true');
          } else {
            card.removeAttribute('data-keyboard-selected');
          }
        });
        
        // Add a slight delay before auto-advancing to allow the user to see their selection
        setTimeout(() => {
          // Auto-advance if button is enabled
          if (!continueBtn.disabled) {
            continueBtn.click();
          }
        }, 300); // 300ms delay - enough to see the selection but quick enough to feel responsive
      }
    }
    
    // Check if Enter key was pressed and continue button is enabled
    if (key === 'Enter' && !continueBtn.disabled) {
      continueBtn.click();
    }
  });

// Fix to ensure upload tab is active and student list displays correctly on page load
document.addEventListener('DOMContentLoaded', function() {
  // Set upload tab as active on page load
  const uploadTab = document.getElementById('upload-tab');
  if (uploadTab) {
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Find and activate the upload tab button
    const uploadTabBtn = document.querySelector('.tab-btn[data-tab="upload-tab"]');
    if (uploadTabBtn) {
      uploadTabBtn.classList.add('active');
    }
    
    // Make upload tab visible
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    uploadTab.classList.remove('hidden');
  }
  
  // Ensure student list displays as a grid
  const studentList = document.getElementById('student-list');
  if (studentList) {
    studentList.style.display = 'grid';
  }
});
});
