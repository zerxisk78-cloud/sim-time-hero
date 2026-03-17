@echo off
setlocal
cd /d "%~dp0"
echo Launching MATSS installer/updater...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-or-update-server.ps1"
endlocal
