# MATSS Local Server

This server stores all schedule data in a local JSON file and serves the app to all computers on your network.

## Setup

1. Build the React app:
   ```bash
   npm run build
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Access from any computer on your network:
   - Find your IP: `ipconfig` (Windows) or `ifconfig` / `ip addr` (Mac/Linux)
   - Visit `http://<your-ip>:3001`
   - Routes: `/schedule`, `/guard`, `/admin`

## Custom Port

```bash
PORT=8080 npm start
```

## Data Storage

All data is stored in `server/data.json`. Back up this file to preserve your schedule data.
