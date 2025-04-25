/**
 * Name Game Student Display Fix
 * 
 * This script fixes issues with the student display in the Name Game application.
 * To use it, add the following to the end of your index.html file:
 * <script src="/js/fix-students.js"></script>
 */

(function() {
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Student display fix script loaded');
        
        // Functions to run after DOM is fully loaded
        setTimeout(initStudentFix, 500);
        
        // Add click handler for the tab button to ensure students load on tab switch
        const uploadTabBtn = document.getElementById('upload-tab-btn');
        if (uploadTabBtn) {
            uploadTabBtn.addEventListener('click', function() {
                setTimeout(fixStudentDisplay, 500);
            });
        }
        
        // Add button to manually fix student display
        addFixButton();
    });
    
    // Initialize fixes
    function initStudentFix() {
        // Monitor for student list changes (helps with dynamically loaded content)
        setupMutationObserver();
        
        // Add diagnostic info
        addDiagnosticInfo();
    }
    
    // Add a button to manually trigger the fix
    function addFixButton() {
        const adminActions = document.querySelector('.admin-actions');
        if (adminActions) {
            const fixButton = document.createElement('button');
            fixButton.textContent = 'Fix Student Display';
            fixButton.style.backgroundColor = '#48bb78';
            fixButton.addEventListener('click', fixStudentDisplay);
            
            adminActions.appendChild(fixButton);
            console.log('Fix button added to admin actions');
        } else {
            console.warn('Admin actions element not found');
        }
    }
    
    // Set up mutation observer to detect when student list changes
    function setupMutationObserver() {
        const studentList = document.getElementById('student-list');
        if (!studentList) {
            console.warn('Student list element not found for mutation observer');
            return;
        }
        
        // Create observer to watch for changes to the student list
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    console.log('Student list modified - fixing display');
                    fixStudentDisplay();
                }
            });
        });
        
        // Start observing
        observer.observe(studentList, { childList: true });
        console.log('Mutation observer set up for student list');
    }
    
    // Display diagnostic information
    function addDiagnosticInfo() {
        const studentList = document.getElementById('student-list');
        if (!studentList) {
            console.warn('Student list element not found for diagnostics');
            return;
        }
        
        // Create diagnostic element
        const diagDiv = document.createElement('div');
        diagDiv.style.padding = '10px';
        diagDiv.style.margin = '10px 0';
        diagDiv.style.backgroundColor = '#f8f9fa';
        diagDiv.style.border = '1px solid #dee2e6';
        diagDiv.style.borderRadius = '4px';
        
        // Get computed style
        const style = window.getComputedStyle(studentList);
        
        // Show key styles 
        diagDiv.innerHTML = `
            <strong>Student List Element Diagnostics:</strong><br>
            Display: ${style.display}<br>
            Visibility: ${style.visibility}<br>
            Opacity: ${style.opacity}<br>
            Position: ${style.position}<br>
            Z-Index: ${style.zIndex}<br>
            Grid Template Columns: ${style.gridTemplateColumns}<br>
            Height: ${style.height}<br>
            Max-Height: ${style.maxHeight}<br>
            Overflow: ${style.overflow}<br>
        `;
        
        // Insert after student list
        if (studentList.parentNode) {
            studentList.parentNode.insertBefore(diagDiv, studentList.nextSibling);
            console.log('Diagnostic info added');
        }
    }
    
    // Fix student display issues
    function fixStudentDisplay() {
        const studentList = document.getElementById('student-list');
        if (!studentList) {
            console.warn('Student list element not found for fixing');
            return;
        }
        
        console.log('Fixing student display...');
        
        // Print current styles
        const beforeStyle = window.getComputedStyle(studentList);
        console.log('Before fix - Display:', beforeStyle.display);
        console.log('Before fix - Visibility:', beforeStyle.visibility);
        console.log('Before fix - Opacity:', beforeStyle.opacity);
        
        // Apply fixes to force proper display
        studentList.style.display = 'grid';
        studentList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        studentList.style.gap = '1.5rem';
        studentList.style.opacity = '1';
        studentList.style.visibility = 'visible';
        studentList.style.overflow = 'visible';
        studentList.style.position = 'static';
        
        // Test with students if empty
        if (studentList.children.length === 0) {
            loadTestStudents();
        }
        
        // Print styles after fix
        const afterStyle = window.getComputedStyle(studentList);
        console.log('After fix - Display:', afterStyle.display);
        console.log('After fix - Visibility:', afterStyle.visibility);
        console.log('After fix - Opacity:', afterStyle.opacity);
        
        console.log('Student display fix applied');
    }
    
    // Load test students if none are displayed
    async function loadTestStudents() {
        const studentList = document.getElementById('student-list');
        if (!studentList) return;
        
        try {
            console.log('Loading test students...');
            const response = await fetch('/api/students');
            
            if (!response.ok) {
                throw new Error(`Failed to fetch students: ${response.status}`);
            }
            
            const students = await response.json();
            console.log(`Fetched ${students.length} students for test display`);
            
            // Display only a few test students
            for (let i = 0; i < Math.min(4, students.length); i++) {
                const student = students[i];
                const card = document.createElement('div');
                card.className = 'student-card';
                card.style.backgroundColor = '#f0f4f8'; // Highlight test cards
                
                const imgSrc = student.imagePath || '/uploads/student-images/placeholder.png';
                
                card.innerHTML = `
                    <img class="student-img" src="${imgSrc}" alt="${student.fullName}">
                    <div class="student-info">
                        <div class="student-name">${student.fullName} (Test)</div>
                    </div>
                `;
                
                studentList.appendChild(card);
            }
            
            console.log('Test students added to display');
        } catch (error) {
            console.error('Error loading test students:', error);
        }
    }
})();