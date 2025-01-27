const express = require('express');
const axios = require('axios'); // For forwarding requests
const app = express();
const port = 3000;

// Middleware to parse JSON payloads
app.use(express.json());
 
// Middleware to set CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'POST'); // Allow POST requests only
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow these headers
  next();
});

// POST route to forward requests to the service worker
app.post('/proxy', async (req, res) => {
  try {
    // Forward the request to the service worker
    const response = await axios.post(
      'https://lym-dev.github.io/express/worker.js/worker-endpoint', // Replace with your service worker URL
      req.body, // Forward the request body as is
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '', // Forward authorization header if provided
        },
      }
    );

    // Respond back to the SDK with the worker's response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error forwarding request to the service worker:', error.message);
    res.status(500).json({ error: 'Failed to process the request' });
  }
});

// GET route for testing the server
app.get('/', (req, res) => {
  res.send('Welcome to My Server!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
