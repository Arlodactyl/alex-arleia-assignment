// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Load your .env variables

const app = express();
const PORT = process.env.PORT || 3000;

// Allow frontend to make requests
app.use(cors());

// Serve static frontend files (from public folder)
app.use(express.static(path.join(process.cwd(), 'public')));

// ----------------------------
// Test route
// ----------------------------
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// ----------------------------
// Fetch player from Clash Royale API
// Example: /api/player/9U0L2QR0
// ----------------------------
app.get('/api/player/:tag', async (req, res) => {
  const playerTag = req.params.tag;
  const token = process.env.CLASH_API_TOKEN;

  if (!token) {
    return res.status(500).json({ error: 'Missing Clash API token' });
  }

  try {
    // Use built-in fetch in Node 18+
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

// Optional root route
app.get('/', (req, res) => {
  res.send('Hello, Fly.io! Server is running.');
});

// ----------------------------
// Start server on 0.0.0.0 (required for Fly.io)
// ----------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
