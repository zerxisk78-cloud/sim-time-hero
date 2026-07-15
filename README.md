# MATSS Local Server Setup

## One-click Windows install/update

If this project is deployed on the Windows host at `C:\inetpub\wwwroot\sim-time-hero`, double-click:

- `install-or-update-server.bat`

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

### What you need installed once

- Node.js LTS
- Git for Windows (optional, but recommended for auto-updates)

### First install

1. Copy or clone the project to:
   - `C:\inetpub\wwwroot\sim-time-hero`
2. Right-click `install-or-update-server.bat` and choose **Run as administrator**
3. Approve the UAC prompt
4. Wait for the script to finish

### Future updates

After you pull new files from GitHub, just double-click:

- `install-or-update-server.bat`

It will rebuild the app and restart the live server automatically.

## Manual fallback: if the batch file fails

If the batch file does not work, or you need to troubleshoot, you can run the same steps manually in an elevated PowerShell or Command Prompt.

### 1. Open an elevated terminal

- Press `Win + X`, then choose **Terminal (Admin)** or **Command Prompt (Admin)**.
- Or right-click the Start button and choose **Windows PowerShell (Admin)**.

### 2. Go to the project folder

```cmd
cd /d C:\inetpub\wwwroot\sim-time-hero
```

### 3. Build the frontend

```cmd
npm install
npm run build
```

### 4. Install server dependencies

```cmd
cd server
npm install
```

### 5. Start the server manually

#### Option A: plain Node.js (simplest for testing)

```cmd
cd C:\inetpub\wwwroot\sim-time-hero\server
npm start
```

The server will run as long as this window is open.

#### Option B: PM2 (recommended for production)

If PM2 is not installed:

```cmd
npm install -g pm2
```

Then start the server with PM2:

```cmd
cd C:\inetpub\wwwroot\sim-time-hero\server
npm run pm2:start
```

To restart, stop, or check status:

```cmd
npm run pm2:restart
npm run pm2:stop
npm run pm2:status
npm run pm2:logs
```

To make PM2 start automatically after reboot:

```cmd
pm2 startup
pm2 save
```

### 6. Open Windows Firewall for port 3001

If the batch file did not create the firewall rule, run this in the same elevated PowerShell:

```powershell
New-NetFirewallRule -DisplayName "MATSS Server 3001" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001
```

## Live URLs on your network

After the script or manual steps complete, the app should be available at:

- `http://192.168.0.197:3001/`
- `http://192.168.0.197:3001/schedule`
- `http://192.168.0.197:3001/guard`
- `http://192.168.0.197:3001/admin`

Replace `192.168.0.197` with your Windows host's actual LAN IP (run `ipconfig` in a command prompt to find it under **IPv4 Address**).

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
- If you are using a custom port, change `PORT` in `server/ecosystem.config.js` and update the firewall rule to match
