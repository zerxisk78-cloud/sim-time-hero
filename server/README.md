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

## Option 2: PM2 (Recommended for Production)

PM2 keeps the server running permanently, auto-restarts on crashes, and starts on boot.

### Setup

1. Install PM2 globally (one time):
   ```bash
   npm install -g pm2
   ```

2. Build the React app:
   ```bash
   npm run build
   ```

3. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

4. Start with PM2:
   ```bash
   npm run pm2:start
   ```

### PM2 Commands

```bash
cd server
npm run pm2:start     # Start the server
npm run pm2:stop      # Stop the server
npm run pm2:restart   # Restart the server
npm run pm2:logs      # View live logs
npm run pm2:status    # Check if running
```

### Auto-Start on Boot (Windows)

```bash
pm2 startup
pm2 save
```

### Custom Port with PM2

Edit `ecosystem.config.js` and change the `PORT` value, then restart:
```bash
npm run pm2:restart
```

## Option 3: IIS + iisnode

This runs the Express server through IIS using iisnode, so everything is on port 80.

### Prerequisites
- IIS installed with URL Rewrite module
- [iisnode](https://github.com/azure/iisnode/releases) installed
- Node.js installed

### Setup

1. Build the React app and install server deps (same as above)
2. In IIS Manager:
   - Create a Website pointing to the **project root folder**
   - Set the Application Pool to "No Managed Code"
   - Ensure the App Pool identity has read/write on `server/`
3. The `web.config` handles routing `/api/*` to Express and SPA fallback
4. Update `nodeProcessCommandLine` in `web.config` if Node.js path differs

### Troubleshooting iisnode

- Check `iisnode_logs/` folder for errors
- Verify URL Rewrite module: `%windir%\system32\inetsrv\appcmd list module | findstr rewrite`
- Check Event Viewer → Windows Logs → Application for 500 errors

## Data Storage

All data is stored in `server/data.json`. Back up this file to preserve your schedule data.
