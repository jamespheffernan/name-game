/**
 * Test script for the markAnswerAsCorrect helper function
 * 
 * Run this with:
 * node tests/mark_answer_test.js
 */

// The markAnswerAsCorrect function from app.js
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

// Test suite
function runTests() {
  console.log('Running tests for markAnswerAsCorrect helper function...');
  
  // Test 1: Standard wrong answer
  function testStandardWrongAnswer() {
    console.log('\nTest 1: Standard wrong answer');
    
    const result = {
      questionId: 'q1',
      selectedOptionId: '2',
      correct: false
    };
    
    const scoreResult = {
      score: 1,
      totalQuestions: 3,
      percentage: 33,
      results: [result, { questionId: 'q2', correct: true }, { questionId: 'q3', correct: false }],
      performanceData: {
        '1': { attemptCount: 5, correctCount: 2, incorrectCount: 3, successRate: 40 }
      }
    };
    
    const question = {
      id: 'q1',
      studentId: '1'
    };
    
    console.log('Before:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      overridden: result.overridden,
      studentPerformance: scoreResult.performanceData['1']
    }, null, 2));
    
    markAnswerAsCorrect(result, scoreResult, question);
    
    console.log('After:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      overridden: result.overridden,
      studentPerformance: scoreResult.performanceData['1']
    }, null, 2));
    
    // Assertions
    console.assert(result.overridden === true, 'Result should be marked as overridden');
    console.assert(scoreResult.score === 2, 'Score should be incremented to 2');
    console.assert(scoreResult.percentage === 67, 'Percentage should be 67%');
    console.assert(scoreResult.results[0].correct === true, 'Result should be marked as correct');
    console.assert(scoreResult.performanceData['1'].correctCount === 3, 'Student correct count should be incremented');
    console.assert(scoreResult.performanceData['1'].incorrectCount === 2, 'Student incorrect count should be decremented');
    console.assert(scoreResult.performanceData['1'].successRate === 60, 'Student success rate should be updated');
  }
  
  // Test 2: "Don't Know" answer
  function testDontKnowAnswer() {
    console.log('\nTest 2: "Don\'t Know" answer');
    
    const result = {
      questionId: 'q1',
      selectedOptionId: 'dont-know',
      dontKnow: true,
      correct: false
    };
    
    const scoreResult = {
      score: 1,
      totalQuestions: 3,
      percentage: 33,
      dontKnowCount: 1,
      dontKnowPercentage: 33,
      results: [result, { questionId: 'q2', correct: true }, { questionId: 'q3', correct: false }],
      performanceData: {
        '1': { attemptCount: 5, correctCount: 2, incorrectCount: 3, successRate: 40 }
      }
    };
    
    const question = {
      id: 'q1',
      studentId: '1'
    };
    
    console.log('Before:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      dontKnowCount: scoreResult.dontKnowCount,
      dontKnowPercentage: scoreResult.dontKnowPercentage,
      overridden: result.overridden,
      studentPerformance: scoreResult.performanceData['1']
    }, null, 2));
    
    markAnswerAsCorrect(result, scoreResult, question);
    
    console.log('After:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      dontKnowCount: scoreResult.dontKnowCount,
      dontKnowPercentage: scoreResult.dontKnowPercentage,
      overridden: result.overridden,
      studentPerformance: scoreResult.performanceData['1']
    }, null, 2));
    
    // Assertions
    console.assert(result.overridden === true, 'Result should be marked as overridden');
    console.assert(scoreResult.score === 2, 'Score should be incremented to 2');
    console.assert(scoreResult.percentage === 67, 'Percentage should be 67%');
    console.assert(scoreResult.dontKnowCount === 0, 'dontKnowCount should be decremented');
    console.assert(scoreResult.dontKnowPercentage === 0, 'dontKnowPercentage should be 0%');
    console.assert(scoreResult.results[0].correct === true, 'Result should be marked as correct');
    console.assert(scoreResult.performanceData['1'].correctCount === 3, 'Student correct count should be incremented');
    console.assert(scoreResult.performanceData['1'].incorrectCount === 2, 'Student incorrect count should be decremented');
    console.assert(scoreResult.performanceData['1'].successRate === 60, 'Student success rate should be updated');
  }
  
  // Test 3: Missing performance data
  function testMissingPerformanceData() {
    console.log('\nTest 3: Missing performance data');
    
    const result = {
      questionId: 'q1',
      selectedOptionId: '2',
      correct: false
    };
    
    const scoreResult = {
      score: 1,
      totalQuestions: 3,
      percentage: 33,
      results: [result, { questionId: 'q2', correct: true }, { questionId: 'q3', correct: false }]
      // No performanceData field
    };
    
    const question = {
      id: 'q1',
      studentId: '1'
    };
    
    console.log('Before:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      overridden: result.overridden
    }, null, 2));
    
    markAnswerAsCorrect(result, scoreResult, question);
    
    console.log('After:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      overridden: result.overridden
    }, null, 2));
    
    // Assertions
    console.assert(result.overridden === true, 'Result should be marked as overridden');
    console.assert(scoreResult.score === 2, 'Score should be incremented to 2');
    console.assert(scoreResult.percentage === 67, 'Percentage should be 67%');
    console.assert(scoreResult.results[0].correct === true, 'Result should be marked as correct');
    // Should not error with missing performance data
  }
  
  // Test 4: Result not found
  function testResultNotFound() {
    console.log('\nTest 4: Result not found');
    
    const result = {
      questionId: 'q4', // This ID doesn't exist in the results array
      selectedOptionId: '2',
      correct: false
    };
    
    const scoreResult = {
      score: 1,
      totalQuestions: 3,
      percentage: 33,
      results: [
        { questionId: 'q1', correct: false }, 
        { questionId: 'q2', correct: true }, 
        { questionId: 'q3', correct: false }
      ],
      performanceData: {
        '1': { attemptCount: 5, correctCount: 2, incorrectCount: 3, successRate: 40 }
      }
    };
    
    const question = {
      id: 'q4',
      studentId: '1'
    };
    
    const scoreBefore = scoreResult.score;
    const percentageBefore = scoreResult.percentage;
    
    console.log('Before:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      overridden: result.overridden,
      studentPerformance: scoreResult.performanceData['1']
    }, null, 2));
    
    markAnswerAsCorrect(result, scoreResult, question);
    
    console.log('After:', JSON.stringify({
      resultCorrect: result.correct,
      score: scoreResult.score,
      percentage: scoreResult.percentage,
      overridden: result.overridden,
      studentPerformance: scoreResult.performanceData['1']
    }, null, 2));
    
    // Assertions
    console.assert(scoreResult.score === scoreBefore, 'Score should remain unchanged');
    console.assert(scoreResult.percentage === percentageBefore, 'Percentage should remain unchanged');
    // No other assertions since the function should do nothing when result not found
  }
  
  // Run all tests
  testStandardWrongAnswer();
  testDontKnowAnswer();
  testMissingPerformanceData();
  testResultNotFound();
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests();