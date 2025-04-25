/**
 * Name Game - Tab System Fix
 * 
 * This script fixes the issue where the tab-content class has display:none
 */

(function() {
  console.log('Tab system fix loaded');
  
  // Function to fix the tab system
  function fixTabSystem() {
    console.log('Fixing tab system...');
    
    // Find the upload tab (parent of student list)
    const uploadTab = document.getElementById('upload-tab');
    if (!uploadTab) {
      console.warn('Upload tab not found');
      return false;
    }
    
    // Check if it's hidden
    const uploadTabStyle = window.getComputedStyle(uploadTab);
    if (uploadTabStyle.display === 'none') {
      console.log('Upload tab is hidden, fixing...');
      
      // Add the active class to make it visible
      uploadTab.classList.add('active');
      
      // Also ensure the tab button is marked as active
      const uploadTabBtn = document.getElementById('upload-tab-btn');
      if (uploadTabBtn) {
        uploadTabBtn.classList.add('active');
      }
      
      // Make sure the student list is displayed as a grid
      const studentList = document.getElementById('student-list');
      if (studentList) {
        studentList.style.display = 'grid';
        studentList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        studentList.style.gap = '1.5rem';
      }
      
      console.log('Tab system fixed!');
      return true;
    } else {
      console.log('Upload tab is already visible');
    }
    
    return false;
  }
  
  // Fix tab switching to properly add/remove active class
  function fixTabSwitching() {
    // Get tab buttons
    const uploadTabBtn = document.getElementById('upload-tab-btn');
    const addTabBtn = document.getElementById('add-tab-btn');
    const tagTabBtn = document.getElementById('tag-tab-btn');
    
    // Get tab content elements
    const uploadTab = document.getElementById('upload-tab');
    const addTab = document.getElementById('add-tab');
    const tagTab = document.getElementById('tags-tab');
    
    if (!uploadTabBtn || !addTabBtn || !tagTabBtn) {
      console.warn('Tab buttons not found');
      return;
    }
    
    // Fix upload tab button
    uploadTabBtn.addEventListener('click', function() {
      // Remove active class from all buttons
      uploadTabBtn.classList.add('active');
      addTabBtn.classList.remove('active');
      tagTabBtn.classList.remove('active');
      
      // Remove active class from all content
      if (uploadTab) uploadTab.classList.add('active');
      if (addTab) addTab.classList.remove('active');
      if (tagTab) tagTab.classList.remove('active');
      
      // Ensure student list is visible
      const studentList = document.getElementById('student-list');
      if (studentList) {
        studentList.style.display = 'grid';
      }
      
      console.log('Switched to upload tab');
    });
    
    // Fix add tab button
    addTabBtn.addEventListener('click', function() {
      // Remove active class from all buttons
      uploadTabBtn.classList.remove('active');
      addTabBtn.classList.add('active');
      tagTabBtn.classList.remove('active');
      
      // Remove active class from all content
      if (uploadTab) uploadTab.classList.remove('active');
      if (addTab) addTab.classList.add('active');
      if (tagTab) tagTab.classList.remove('active');
      
      console.log('Switched to add tab');
    });
    
    // Fix tag tab button
    tagTabBtn.addEventListener('click', function() {
      // Remove active class from all buttons
      uploadTabBtn.classList.remove('active');
      addTabBtn.classList.remove('active');
      tagTabBtn.classList.add('active');
      
      // Remove active class from all content
      if (uploadTab) uploadTab.classList.remove('active');
      if (addTab) addTab.classList.remove('active');
      if (tagTab) tagTab.classList.add('active');
      
      console.log('Switched to tag tab');
    });
    
    console.log('Tab switching fixed');
  }
  
  // Run the fix when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    // Try to run the fix after a short delay to ensure all elements are loaded
    setTimeout(function() {
      fixTabSystem();
      fixTabSwitching();
    }, 500);
    
    // Also add a button to manually run the fix
    const header = document.querySelector('.main-header');
    if (header) {
      const fixButton = document.createElement('button');
      fixButton.textContent = 'Fix Tab System';
      fixButton.style.marginLeft = '10px';
      fixButton.addEventListener('click', fixTabSystem);
      header.appendChild(fixButton);
    }
    
    // Monitor for Manage Students button clicks
    const manageStudentsBtn = document.getElementById('manage-students-btn');
    if (manageStudentsBtn) {
      manageStudentsBtn.addEventListener('click', function() {
        // Run the fix after a delay to ensure tab switching is complete
        setTimeout(fixTabSystem, 500);
      });
    }
  });
  
  // Expose the fix function globally so it can be called from console
  window.fixTabSystem = fixTabSystem;
})();