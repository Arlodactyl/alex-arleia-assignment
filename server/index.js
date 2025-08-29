// server/index.js
// Backend API for Clash Hub app (Fly.io ready)

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 3000; // Fly.io sets this automatically

// Enable CORS so frontend can call API
app.use(cors());

// Serve static files from public folder
app.use(express.static(path.join(process.cwd(), 'public')));

// ----------------------------
// Test route to check server
// ----------------------------
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// ----------------------------
// Fetch player data from Clash Royale API
// Example: /api/player/9U0L2QR0
// ----------------------------
app.get('/api/player/:tag', async (req, res) => {
  const playerTag = req.params.tag;
  const token = process.env.CLASH_API_TOKEN; // Use Fly.io secret

  if (!token) {
    return res.status(500).json({ error: 'Missing Clash API token' });
  }

  try {
    // Node 18+ has built-in fetch, no node-fetch required
    const response = await fetch(`https://api.clashroyale.com/v1/players/%23${playerTag}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Clash API', details: err.message });
  }
});

// Optional: root route
app.get('/', (req, res) => {
  res.send('Hello, Fly.io! Server is running.');
});

// ----------------------------
// Start server
// ----------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${PORT}`);
});
