// Test script for game generation API
const http = require('http');

function testGenerateGame() {
  // Create the request payload
  const data = JSON.stringify({
    mode: 'connectionTrivia',
    questionCount: 5,
    focusDifficult: false,
    onlyUntried: false,
    tagName: null,
    excludeTag: false,
    advancedFilters: {
      nationality: '',
      language: '',
      gender: ''
    }
  });

  // Set up the request options
  const options = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/game/generate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  // Make the request
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('RESPONSE COMPLETED');
      
      try {
        // Try to parse the response as JSON
        const jsonResponse = JSON.parse(responseBody);
        
        if (res.statusCode >= 400) {
          console.log('ERROR RESPONSE:', jsonResponse);
        } else {
          console.log('SUCCESS! Game generated with:');
          console.log(`- Mode: ${jsonResponse.mode}`);
          console.log(`- Questions: ${jsonResponse.questions.length}`);
          console.log('First question type:', jsonResponse.questions[0].type);
        }
      } catch (e) {
        console.log('Error parsing response:', e);
        console.log('Raw response:', responseBody);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  // Write data to request body
  req.write(data);
  req.end();
}

testGenerateGame();