# MATSS Local Server

This server stores all schedule data in a local JSON file and serves the app to all computers on your network.

## Option 1: Standalone (Express only)

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

### Custom Port

```bash
PORT=8080 npm start
```

## Option 2: IIS + iisnode

This runs the Express server through IIS using iisnode, so everything is on port 80 (one URL for the whole app).

### Prerequisites
- IIS installed with URL Rewrite module
- [iisnode](https://github.com/azure/iisnode/releases) installed
- Node.js installed (note the install path for `web.config`)

### Setup

1. Build the React app:
   ```bash
   npm run build
   ```

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. In IIS Manager:
   - Create a new Website or Application pointing to the **project root folder** (the folder containing `web.config`, `dist/`, and `server/`)
   - Set the Application Pool to "No Managed Code"
   - Ensure the Application Pool identity has read/write access to the `server/` folder (for `data.json`)

4. The `web.config` in the project root handles:
   - Routing `/api/*` requests to Express via iisnode
   - Serving static files from `dist/`
   - SPA fallback (all other routes serve `index.html`)

5. **Important**: Update the `nodeProcessCommandLine` path in `web.config` if Node.js is installed in a different location than `C:\Program Files\nodejs\node.exe`

6. Access the app at `http://<your-server-ip>/` — no port number needed!

### Troubleshooting iisnode

- Check `iisnode_logs/` folder for Node.js error output
- Ensure the IIS app pool identity has write permissions on the `server/` directory
- Verify URL Rewrite module is installed: `%windir%\system32\inetsrv\appcmd list module | findstr rewrite`
- If you see 500 errors, check Event Viewer → Windows Logs → Application

## Data Storage

All data is stored in `server/data.json`. Back up this file to preserve your schedule data.
