const express = require('express');
const http = require('http');
const app = express();
const PORT = 3000; // Different port for the proxy

// Display connection information
app.get('/', (req, res) => {
  const serverAddress = '10.228.0.53'; // Your computer's IP address
  const serverPort = 8080;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Name Game Mobile Connection</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; margin: 20px; line-height: 1.6; }
        .button { 
          display: block; padding: 15px; margin: 20px 0; 
          background: #4CAF50; color: white; text-align: center;
          text-decoration: none; font-size: 18px; border-radius: 4px; 
        }
        .info { padding: 10px; background: #f8f8f8; border-left: 4px solid #2196F3; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Name Game Mobile Connection</h1>
      <div class="info">
        <p>Server detected at: ${serverAddress}:${serverPort}</p>
        <p>Your proxy is running at: ${req.headers.host}</p>
      </div>
      <a href="/connect" class="button">Connect to Name Game</a>
      <a href="/test" class="button">Test Connection</a>
      
      <div style="margin-top:30px;">
        <h3>Troubleshooting:</h3>
        <ul>
          <li>Make sure your computer and phone are on the same network</li>
          <li>If connection fails, try connecting directly to http://${serverAddress}:${serverPort}</li>
          <li>Check if your computer's firewall is blocking connections</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Proxy to the test page
app.get('/test', (req, res) => {
  proxyRequest(req, res, '/mobile-test.html');
});

// Proxy to the main app
app.get('/connect', (req, res) => {
  proxyRequest(req, res, '/');
});

// Proxy API requests
app.use('/api', (req, res) => {
  proxyRequest(req, res, req.url);
});

// Proxy static files
app.use('/uploads', (req, res) => {
  proxyRequest(req, res, req.url);
});

app.use('/css', (req, res) => {
  proxyRequest(req, res, req.url);
});

app.use('/js', (req, res) => {
  proxyRequest(req, res, req.url);
});

// Create proxy function
function proxyRequest(req, res, path) {
  const options = {
    hostname: '10.228.0.53', // Your computer's IP
    port: 8080,
    path: path,
    method: req.method,
    headers: req.headers
  };

  console.log(`Proxying request to: ${path}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq, { end: true });
  } else {
    proxyReq.end();
  }
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mobile proxy running at http://0.0.0.0:${PORT}`);
  console.log(`Connect using your device's browser to http://10.228.0.53:${PORT}`);
});