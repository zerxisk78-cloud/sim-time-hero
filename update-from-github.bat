@echo off
setlocal
cd /d "%~dp0"
echo Updating MATSS server from GitHub...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-or-update-server.ps1"
endlocal
