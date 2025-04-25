/**
 * Name Game - Parent Element Fix
 * 
 * This script fixes the issue where the student list's parent element has display:none
 */

(function() {
  console.log('Parent element fix loaded');
  
  // Function to fix the parent element 
  function fixParentElement() {
    console.log('Checking for hidden parent...');
    
    // Get the student list
    const studentList = document.getElementById('student-list');
    if (!studentList) {
      console.warn('Student list element not found');
      return false;
    }
    
    // Check the parent element
    const parent = studentList.parentElement;
    if (!parent) {
      console.warn('Student list has no parent element');
      return false;
    }
    
    // Get computed styles
    const parentStyle = window.getComputedStyle(parent);
    console.log('Parent display style:', parentStyle.display);
    
    // Check if parent is hidden
    if (parentStyle.display === 'none') {
      console.log('Found hidden parent element, fixing...');
      
      // Show the parent element
      parent.style.display = 'block';
      
      // Also make sure student list is visible
      studentList.style.display = 'grid';
      studentList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
      studentList.style.gap = '1.5rem';
      
      console.log('Parent element fixed!');
      return true;
    } else {
      console.log('Parent element is already visible');
      return false;
    }
  }
  
  // Run the fix when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    // Try to run the fix after a short delay to ensure all elements are loaded
    setTimeout(fixParentElement, 500);
    
    // Also add a button to manually run the fix
    const header = document.querySelector('.main-header');
    if (header) {
      const fixButton = document.createElement('button');
      fixButton.textContent = 'Fix Parent Element';
      fixButton.style.marginLeft = '10px';
      fixButton.addEventListener('click', fixParentElement);
      header.appendChild(fixButton);
    }
    
    // Monitor for tab changes
    const uploadTabBtn = document.getElementById('upload-tab-btn');
    if (uploadTabBtn) {
      uploadTabBtn.addEventListener('click', function() {
        setTimeout(fixParentElement, 200);
      });
    }
    
    // Monitor for Manage Students button clicks
    const manageStudentsBtn = document.getElementById('manage-students-btn');
    if (manageStudentsBtn) {
      manageStudentsBtn.addEventListener('click', function() {
        // Run the fix after a delay to ensure tab switching is complete
        setTimeout(fixParentElement, 500);
      });
    }
  });
  
  // Expose the fix function globally so it can be called from console
  window.fixParentElement = fixParentElement;
})();