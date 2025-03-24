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

  // Student management elements
  const pdfUploadForm = document.getElementById('pdf-upload-form');
  const pdfUploadStatus = document.getElementById('pdf-upload-status');
  const addStudentForm = document.getElementById('add-student-form');
  const studentList = document.getElementById('student-list');
  const flushDbBtn = document.getElementById('flush-db-btn');

  // Game elements
  const gameModeSelect = document.getElementById('game-mode');
  const questionCountInput = document.getElementById('question-count');
  const startGameBtn = document.getElementById('start-game-btn');
  const questionDisplay = document.getElementById('question-display');
  const optionsDisplay = document.getElementById('options-display');
  const nextQuestionBtn = document.getElementById('next-question-btn');
  const finishGameBtn = document.getElementById('finish-game-btn');
  const scoreDisplay = document.getElementById('score-display');
  const resultDetails = document.getElementById('result-details');
  const playAgainBtn = document.getElementById('play-again-btn');

  // Game state
  let currentGame = null;
  let currentQuestionIndex = 0;
  let userAnswers = [];

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
  
  // Load students from the database
  async function loadStudents() {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      
      const students = await response.json();
      displayStudents(students);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Failed to load students. Please try again.');
    }
  }
  
  // Display students in the list
  function displayStudents(students) {
    studentList.innerHTML = '';
    
    if (students.length === 0) {
      studentList.innerHTML = '<p>No students added yet.</p>';
      return;
    }
    
    students.forEach(student => {
      const studentCard = document.createElement('div');
      studentCard.className = 'student-card';
      
      const imageSrc = student.imagePath 
        ? student.imagePath 
        : 'https://via.placeholder.com/150?text=No+Image';
      
      studentCard.innerHTML = `
        <img src="${imageSrc}" alt="${student.fullName}">
        <h4>${student.fullName}</h4>
        <div class="student-actions">
          <button class="edit-btn" data-id="${student.id}">Edit</button>
          <button class="delete-btn" data-id="${student.id}">Delete</button>
        </div>
      `;
      
      studentList.appendChild(studentCard);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => editStudent(e.target.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteStudent(e.target.dataset.id));
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
    const imageInput = document.getElementById('student-image');
    
    if (!firstName || !lastName) {
      alert('First name and last name are required');
      return;
    }
    
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    
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
  
  // Edit Student (placeholder - would need a modal form)
  async function editStudent(studentId) {
    alert(`Edit student functionality would open a modal form for student ID: ${studentId}`);
    // Actual implementation would involve a form and API call to update the student
  }
  
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
  // Game Logic
  // ======================
  
  // Start a new game
  startGameBtn.addEventListener('click', async () => {
    const mode = gameModeSelect.value;
    const questionCount = parseInt(questionCountInput.value, 10);
    
    if (isNaN(questionCount) || questionCount < 5) {
      alert('Please enter a valid number of questions (minimum 5)');
      return;
    }
    
    try {
      const response = await fetch('/api/game/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode, questionCount })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to start game');
      }
      
      currentGame = await response.json();
      currentQuestionIndex = 0;
      userAnswers = [];
      
      gameContainer.classList.remove('hidden');
      gameResults.classList.add('hidden');
      displayQuestion(currentQuestionIndex);
    } catch (error) {
      console.error('Error starting game:', error);
      alert(`Error: ${error.message}`);
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
    
    // Update buttons
    nextQuestionBtn.disabled = true;
    finishGameBtn.disabled = true;
    
    // Display the question prompt
    if (question.type === 'standard') {
      // Standard game mode: Show image, ask for name
      questionDisplay.innerHTML = `
        <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
        <p>Who is this?</p>
        <img src="${question.studentImage}" alt="Student">
      `;
      
      // Create option cards with names
      question.options.forEach(option => {
        const optionCard = document.createElement('div');
        optionCard.className = 'option-card';
        optionCard.dataset.id = option.id;
        optionCard.innerHTML = `<h4>${option.name}</h4>`;
        
        optionCard.addEventListener('click', () => selectOption(optionCard, question));
        optionsDisplay.appendChild(optionCard);
      });
    } else {
      // Reverse game mode: Show name, ask for image
      questionDisplay.innerHTML = `
        <h3>Question ${index + 1} of ${currentGame.questions.length}</h3>
        <p>Which photo shows ${question.studentName}?</p>
      `;
      
      // Create option cards with images
      question.options.forEach(option => {
        const optionCard = document.createElement('div');
        optionCard.className = 'option-card';
        optionCard.dataset.id = option.id;
        optionCard.innerHTML = `<img src="${option.imagePath}" alt="Student">`;
        
        optionCard.addEventListener('click', () => selectOption(optionCard, question));
        optionsDisplay.appendChild(optionCard);
      });
    }
  }
  
  // Handle option selection
  function selectOption(optionCard, question) {
    // Clear previous selections
    document.querySelectorAll('.option-card').forEach(card => {
      card.classList.remove('selected');
    });
    
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
    
    // Enable navigation buttons
    nextQuestionBtn.disabled = false;
    if (currentQuestionIndex === currentGame.questions.length - 1) {
      finishGameBtn.disabled = false;
    }
  }
  
  // Navigate to the next question
  nextQuestionBtn.addEventListener('click', () => {
    if (currentQuestionIndex < currentGame.questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion(currentQuestionIndex);
    }
  });
  
  // Finish the game and show results
  finishGameBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/game/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questions: currentGame.questions,
          answers: userAnswers
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to score game');
      }
      
      const scoreResult = await response.json();
      displayGameResults(scoreResult);
    } catch (error) {
      console.error('Error scoring game:', error);
      alert(`Error: ${error.message}`);
    }
  });
  
  // Display game results
  function displayGameResults(scoreResult) {
    gameContainer.classList.add('hidden');
    gameResults.classList.remove('hidden');
    
    scoreDisplay.textContent = `Score: ${scoreResult.score}/${scoreResult.totalQuestions} (${scoreResult.percentage}%)`;
    
    resultDetails.innerHTML = '';
    
    if (scoreResult.results && scoreResult.results.length > 0) {
      const resultsList = document.createElement('div');
      resultsList.className = 'results-list';
      
      scoreResult.results.forEach((result, index) => {
        const question = currentGame.questions.find(q => q.id === result.questionId);
        if (!question) return;
        
        // Create a result card for this question
        const resultCard = document.createElement('div');
        resultCard.className = `result-card ${result.correct ? 'correct' : 'incorrect'}`;
        
        // Question header
        const questionHeader = document.createElement('h4');
        questionHeader.textContent = `Question ${index + 1}: ${result.correct ? 'Correct!' : 'Incorrect'}`;
        resultCard.appendChild(questionHeader);
        
        // Create content based on game mode and correctness
        if (question.type === 'standard') {
          // Standard mode: shown a photo, asked for name
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
            // If correct, just show the right name
            answerElement.innerHTML = `
              <h5>You correctly identified:</h5>
              <p class="correct-name">${correctOption.name}</p>
            `;
          } else {
            // If incorrect, show both the chosen name and correct name
            // AND show the image of the person whose name you selected incorrectly
            answerElement.innerHTML = `
              <h5>You selected:</h5>
              <p class="wrong-name">${selectedOption.name}</p>
              <h5>This is ${selectedOption.name}:</h5>
              <img src="${selectedOption.imagePath}" alt="${selectedOption.name}">
              <h5>Correct answer:</h5>
              <p class="correct-name">${correctOption.name}</p>
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
          nameElement.innerHTML = `
            <h5>You were asked to find:</h5>
            <p class="student-name">${question.studentName}</p>
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
          } else {
            // If incorrect, show both the chosen photo and correct photo
            // AND include the name of the person whose photo you selected
            answerElement.innerHTML = `
              <h5>You selected:</h5>
              <img src="${selectedOption.imagePath}" alt="Wrong student">
              <p class="wrong-name">This is ${selectedOption.name}</p>
              <h5>Correct answer:</h5>
              <img src="${correctOption.imagePath}" alt="Correct student">
            `;
          }
          
          resultContent.appendChild(nameElement);
          resultContent.appendChild(answerElement);
          resultCard.appendChild(resultContent);
        }
        
        resultsList.appendChild(resultCard);
      });
      
      resultDetails.appendChild(resultsList);
    }
  }
  
  // Play again
  playAgainBtn.addEventListener('click', () => {
    gameResults.classList.add('hidden');
    gameContainer.classList.add('hidden');
  });
});
