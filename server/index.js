const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

// Serve the built React app from ../dist
const DIST_DIR = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Data helpers ---
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading data file:', e.message);
  }
  return {};
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// --- API Routes ---

// Get all data
app.get('/api/data', (req, res) => {
  res.json(readData());
});

// Get a specific key
app.get('/api/data/:key', (req, res) => {
  const data = readData();
  const value = data[req.params.key];
  res.json({ value: value !== undefined ? value : null });
});

// Set a specific key
app.put('/api/data/:key', (req, res) => {
  const data = readData();
  data[req.params.key] = req.body.value;
  writeData(data);
  res.json({ ok: true });
});

// Delete a specific key
app.delete('/api/data/:key', (req, res) => {
  const data = readData();
  delete data[req.params.key];
  writeData(data);
  res.json({ ok: true });
});

// Bulk update (merge multiple keys at once)
app.post('/api/data/bulk', (req, res) => {
  const data = readData();
  const updates = req.body; // { key1: value1, key2: value2, ... }
  Object.assign(data, updates);
  writeData(data);
  res.json({ ok: true });
});

// --- Serve React App (SPA fallback) ---
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  
  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('MATSS Server running. Build the React app first: npm run build');
  });
}

// iisnode sets PORT to a named pipe; standalone uses a numeric port
const listener = app.listen(PORT, () => {
  const addr = listener.address();
  if (typeof addr === 'string') {
    // Named pipe (iisnode)
    console.log(`MATSS server running via iisnode on pipe: ${addr}`);
  } else {
    console.log(`MATSS server running on http://0.0.0.0:${addr.port}`);
    console.log(`Other computers can access at http://<your-ip>:${addr.port}`);
  }
  console.log(`  /schedule - Schedule page`);
  console.log(`  /guard    - Guard page`);
  console.log(`  /admin    - Admin page`);
});
