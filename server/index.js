// Import dependencies
const express = require('express');   // Web framework
const cors = require('cors');         // Allow frontend/backend communication
const path = require('path');         // Work with file paths
require('dotenv').config();           // Load your .env file

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;  // Use Fly.io port or default to 3000

// Allow cross-origin requests
app.use(cors());

// Serve all static files from the public folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// Test route (optional)
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running 🎉' });
});

// Start the server
app.listen(PORT, () => {
  console.log(` Server is running at http://localhost:${PORT}`);
});