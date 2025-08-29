// Import dependencies
const express = require('express');   // Express is a framework for building web servers
const cors = require('cors');         // CORS allows the frontend (your website) to talk to this server
const path = require('path');         // Helps work with file paths
const fetch = require('node-fetch');  // Used to make HTTP requests to external APIs
require('dotenv').config();           // Loads environment variables from a .env file

// Create an Express app
const app = express();

// Use the port Fly.io gives us, or default to 3000 if testing locally
const PORT = process.env.PORT || 3000;

// Allow cross-origin requests (so the frontend can call our API)
app.use(cors());

// Serve all files from the "public" folder as static files (HTML, JS, CSS)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ----------------------------
// Test route to check server is running
// ----------------------------
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// ----------------------------
// Route to fetch player data from Clash Royale API
// Example: /api/player/9U0L2QR0
// ----------------------------
app.get('/api/player/:tag', async (req, res) => {
  const playerTag = req.params.tag;       // Get player tag from the URL
  const token = process.env.CLASH_API_TOKEN;  // Get your API token from Fly.io environment

  // If token is missing, return an error
  if (!token) {
    return res.status(500).json({ error: 'Missing Clash API token' });
  }

  try {
    // Make a request to the Clash Royale API
    const response = await fetch(`https://api.clashroyale.com/v1/players/%23${playerTag}`, {
      headers: {
        Authorization: `Bearer ${token}`   // Send the token as a bearer token
      }
    });

    // If the API returns an error, forward it to the client
    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    // Parse the JSON response and send it to the client
    const data = await response.json();
    res.json(data);

  } catch (err) {
    // Catch any network errors
    res.status(500).json({ error: 'Failed to fetch from Clash API', details: err.message });
  }
});

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
