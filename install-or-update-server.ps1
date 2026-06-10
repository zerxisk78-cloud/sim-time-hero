param(
  [switch]$SkipGitPull
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::UTF8

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Require-Command([string]$Name, [string]$InstallHint) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "Missing required command: $Name" -ForegroundColor Red
    Write-Host $InstallHint -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
  }
}

function Resolve-CommandPath([string[]]$Names, [string]$InstallHint = '') {
  foreach ($name in $Names) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($command) {
      if ($command.Source) { return $command.Source }
      if ($command.Path) { return $command.Path }
      return $name
    }
  }

  if ($InstallHint) {
    Write-Host "Missing required command: $($Names -join ', ')" -ForegroundColor Red
    Write-Host $InstallHint -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
  }

  return $null
}

function Invoke-Step([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory) {
  Write-Host "Running: $FilePath $($Arguments -join ' ')" -ForegroundColor DarkGray
  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) {
    throw "Command failed with exit code $($process.ExitCode): $FilePath $($Arguments -join ' ')"
  }
}

try {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

  if (-not $isAdmin) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    $argumentList = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"")
    if ($SkipGitPull) { $argumentList += '-SkipGitPull' }
    Start-Process -FilePath 'powershell.exe' -ArgumentList $argumentList -Verb RunAs | Out-Null
    exit 0
  }

  Write-Host "MATSS one-click install/update starting..." -ForegroundColor Green
  Write-Host "Repo: $repoRoot" -ForegroundColor DarkGray

  $npmCmd = Resolve-CommandPath @('npm.cmd', 'npm') 'Install Node.js LTS first: https://nodejs.org/'
  $gitCmd = Resolve-CommandPath @('git.exe', 'git.cmd', 'git')

  Require-Command 'node' 'Install Node.js LTS first: https://nodejs.org/'

  Write-Step 'Update npm to the latest version'
  try {
    Invoke-Step $npmCmd @('install', '-g', 'npm@latest') $repoRoot
    # Re-resolve npm path in case the global update relocated the shim
    $npmCmd = Resolve-CommandPath @('npm.cmd', 'npm') 'npm not found after update.'
  } catch {
    Write-Host "npm self-update skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  if ((Test-Path (Join-Path $repoRoot '.git')) -and (-not $SkipGitPull)) {
    if ($gitCmd) {
      Write-Step 'Pull latest code from Git'
      try {
        Invoke-Step $gitCmd @('pull', '--ff-only') $repoRoot
      } catch {
        Write-Host "Git pull skipped: $($_.Exception.Message)" -ForegroundColor Yellow
      }
    } else {
      Write-Host "Git not found, so update pull was skipped." -ForegroundColor Yellow
    }
  }

  Write-Step 'Install frontend dependencies'
  Invoke-Step $npmCmd @('install') $repoRoot

  Write-Step 'Update frontend dependencies (npm update)'
  try {
    Invoke-Step $npmCmd @('update') $repoRoot
  } catch {
    Write-Host "npm update (frontend) skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  Write-Step 'Audit fix frontend dependencies'
  try {
    Invoke-Step $npmCmd @('audit', 'fix') $repoRoot
  } catch {
    Write-Host "npm audit fix (frontend) skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  Write-Step 'Build frontend'
  Invoke-Step $npmCmd @('run', 'build') $repoRoot

  $serverDir = Join-Path $repoRoot 'server'

  Write-Step 'Install server dependencies'
  Invoke-Step $npmCmd @('install') $serverDir

  Write-Step 'Update server dependencies (npm update)'
  try {
    Invoke-Step $npmCmd @('update') $serverDir
  } catch {
    Write-Host "npm update (server) skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  Write-Step 'Audit fix server dependencies'
  try {
    Invoke-Step $npmCmd @('audit', 'fix') $serverDir
  } catch {
    Write-Host "npm audit fix (server) skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  if (-not (Get-Command pm2.cmd -ErrorAction SilentlyContinue) -and -not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Step 'Install PM2 globally'
    Invoke-Step $npmCmd @('install', '-g', 'pm2') $repoRoot
  }

  $pm2Command = Resolve-CommandPath @('pm2.cmd', 'pm2.exe', 'pm2') 'PM2 installation failed. Try: npm install -g pm2'

  Write-Step 'Ensure Windows Firewall allows TCP port 3001'
  $ruleName = 'MATSS Server 3001'
  $existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
  if (-not $existingRule) {
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3001 | Out-Null
    Write-Host 'Firewall rule created.' -ForegroundColor Green
  } else {
    Write-Host 'Firewall rule already exists.' -ForegroundColor DarkGray
  }

  Write-Step 'Start or restart the PM2 server'
  $ecosystemConfig = Join-Path $serverDir 'ecosystem.config.js'

  # Robust check: inspect `pm2 jlist` stdout for the matss-server process name
  # rather than relying on `pm2 describe` exit codes (which are inconsistent across versions)
  $processExists = $false
  try {
    $jlistOutput = & $pm2Command jlist 2>$null | Out-String
    if ($jlistOutput -and $jlistOutput.Trim().StartsWith('[')) {
      $processes = $jlistOutput | ConvertFrom-Json
      if ($processes | Where-Object { $_.name -eq 'matss-server' }) {
        $processExists = $true
      }
    }
  } catch {
    Write-Host "pm2 jlist parse failed, falling back to fresh start: $($_.Exception.Message)" -ForegroundColor Yellow
    $processExists = $false
  }

  if ($processExists) {
    Write-Host "Existing matss-server process detected; restarting." -ForegroundColor DarkGray
    Invoke-Step $pm2Command @('restart', 'matss-server', '--update-env') $serverDir
  } else {
    Write-Host "No existing matss-server process; starting fresh from ecosystem config." -ForegroundColor DarkGray
    Invoke-Step $pm2Command @('start', $ecosystemConfig) $serverDir
  }

  Write-Step 'Configure PM2 to start on boot'
  try {
    # pm2-startup on Windows uses pm2-startup package or native scheduled task
    # First try the built-in startup command
    $startupResult = Start-Process -FilePath $pm2Command -ArgumentList @('startup') -WorkingDirectory $serverDir -NoNewWindow -Wait -PassThru
    if ($startupResult.ExitCode -ne 0) {
      Write-Host 'PM2 startup command returned non-zero; creating scheduled task fallback...' -ForegroundColor Yellow
    }
  } catch {
    Write-Host "PM2 startup setup skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }

  # Create/verify a Windows scheduled task for reliable boot persistence
  $taskName = 'MATSS PM2 Server'
  $nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
  if ($nodeCmd) {
    $pm2Module = Join-Path (Split-Path (Split-Path $nodeCmd)) 'node_modules\pm2\bin\pm2'
    $action = New-ScheduledTaskAction -Execute $nodeCmd -Argument "`"$pm2Module`" resurrect"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $taskPrincipal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

    $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($existingTask) {
      # Re-register to ensure it points to the current node/pm2 paths after Windows/Node updates
      Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
      Write-Host "Refreshing scheduled task '$taskName' to use current paths." -ForegroundColor DarkGray
    }
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $taskPrincipal | Out-Null
    Write-Host "Scheduled task '$taskName' registered for boot persistence." -ForegroundColor Green

    # Verify it is enabled and ready
    $verify = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    if ($verify -and $verify.State -eq 'Disabled') {
      Enable-ScheduledTask -TaskName $taskName | Out-Null
      Write-Host 'Scheduled task was disabled; re-enabled.' -ForegroundColor Yellow
    }
  } else {
    Write-Host 'Could not locate node.exe for scheduled task.' -ForegroundColor Yellow
  }

  Write-Step 'Save PM2 process list (so resurrect can restore on boot)'
  Invoke-Step $pm2Command @('save') $serverDir

  Write-Step 'Completed successfully'
  Write-Host 'Open these URLs from another computer on the LAN:' -ForegroundColor Green
  Write-Host '  http://192.168.0.197:3001/' -ForegroundColor White
  Write-Host '  http://192.168.0.197:3001/schedule' -ForegroundColor White
  Write-Host '  http://192.168.0.197:3001/guard' -ForegroundColor White
  Write-Host '  http://192.168.0.197:3001/admin' -ForegroundColor White
}
catch {
  Write-Host "`nInstall/update failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
finally {
  Read-Host "`nPress Enter to close"
}
