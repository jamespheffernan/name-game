# Name Game Test Suite

This directory contains tests for the Name Game application, specifically focusing on the slideshow functionality for reviewing incorrect answers.

## Available Tests

### 1. Slideshow HTML Test Page (`slideshow_test.html`)

This is an interactive test page that allows testing the slideshow functionality in isolation.

**How to run:**
Open the file in a web browser:
```
open tests/slideshow_test.html
```

The page includes the following test scenarios:

1. **Basic Slideshow** - Tests the basic slideshow functionality with 3 wrong answers
2. **Override Answers** - Tests overriding answers (marking wrong answers as correct)
3. **Multiple Overrides** - Tests multiple overrides to check if slideshow skips all overridden answers
4. **Different Game Modes** - Tests all game modes in slideshow (standard, hard, reverse, shortAnswer)
5. **Edge Cases** - Tests edge cases (empty wrong answers, all overridden, etc.)

Each test scenario can be run independently, and test output is logged to the page.

### 2. Mark Answer Helper Function Test (`mark_answer_test.js`)

This is a Node.js test script that verifies the behavior of the `markAnswerAsCorrect` helper function that is used when overriding an answer in the slideshow.

**How to run:**
```
node tests/mark_answer_test.js
```

The test script includes the following test cases:

1. **Standard Wrong Answer** - Tests overriding a standard wrong answer
2. **"Don't Know" Answer** - Tests overriding a "Don't Know" answer
3. **Missing Performance Data** - Tests behavior when performance data is missing
4. **Result Not Found** - Tests behavior when the result is not found in the results array

## Key Functionality Being Tested

### Slideshow Functionality
- Correctly displaying questions from different game modes
- Proper navigation between slides (next, skip)
- Progress tracking and visual indicators
- Overriding incorrect answers
- Skipping overridden answers
- Handling edge cases (empty arrays, all overridden)
- Proper transition to full results view

### Mark Answer As Correct Helper Function
- Updating the result's correct status
- Incrementing the overall score and percentage
- Updating "Don't Know" counts if applicable
- Updating student performance data
- Marking the result as overridden
- Handling missing data and edge cases

## Additional Testing Notes

These tests focus on the client-side functionality and do not require a server to run. The slideshow test includes mock data to simulate a game session.

For comprehensive testing of the entire application, these tests should be used in conjunction with manual testing of the application with a live server and database.