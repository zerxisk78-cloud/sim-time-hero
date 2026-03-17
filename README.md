# MATSS Local Server Setup

## One-click Windows install/update

If this project is deployed on the Windows host at `C:\inetpub\wwwroot\sim-time-hero`, you can now run:

- `install-or-update-server.bat` for normal use
- or `install-or-update-server.ps1` directly in PowerShell

The script will automatically:

1. Request Administrator access
2. Optionally pull the latest Git changes
3. Install root dependencies
4. Build the React frontend
5. Install `server` dependencies
6. Install PM2 globally if missing
7. Open Windows Firewall for TCP port `3001`
8. Start or restart the PM2 server
9. Save the PM2 process list

## What you need installed once

- Node.js LTS
- Git for Windows (optional, but recommended for auto-updates)

## How to use it

### First install

1. Copy or clone the project to:
   - `C:\inetpub\wwwroot\sim-time-hero`
2. Double-click:
   - `install-or-update-server.bat`
3. Approve the Administrator prompt
4. Wait for the script to finish

### Future updates

After you pull new files from GitHub, just double-click:

- `install-or-update-server.bat`

It will rebuild the app and restart the live server automatically.

## Live URLs on your network

After the script completes, the app should be available at:

- `http://192.168.0.197:3001/`
- `http://192.168.0.197:3001/schedule`
- `http://192.168.0.197:3001/guard`
- `http://192.168.0.197:3001/admin`

## PM2 manual commands

If you ever need them manually:

```bat
cd C:\inetpub\wwwroot\sim-time-hero\server
npm run pm2:status
npm run pm2:restart
npm run pm2:logs
```

## Notes

- Shared data is stored in `server/data.json`
- The firewall rule created by the script is `MATSS Server 3001`
- If Git is not installed, the script skips `git pull` and still completes the install/update