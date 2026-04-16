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

  Write-Step 'Build frontend'
  Invoke-Step $npmCmd @('run', 'build') $repoRoot

  $serverDir = Join-Path $repoRoot 'server'

  Write-Step 'Install server dependencies'
  Invoke-Step $npmCmd @('install') $serverDir

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
  $describe = Start-Process -FilePath $pm2Command -ArgumentList @('describe', 'matss-server') -WorkingDirectory $serverDir -NoNewWindow -Wait -PassThru
  if ($describe.ExitCode -eq 0) {
    Invoke-Step $pm2Command @('restart', 'matss-server') $serverDir
  } else {
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

  # Create a Windows scheduled task as a reliable fallback
  $taskName = 'MATSS PM2 Server'
  $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  if (-not $existingTask) {
    $nodeCmd = (Get-Command node -ErrorAction SilentlyContinue).Source
    if ($nodeCmd) {
      $pm2Module = Join-Path (Split-Path (Split-Path $nodeCmd)) 'node_modules\pm2\bin\pm2'
      $ecosystemFull = Join-Path $serverDir 'ecosystem.config.js'
      $action = New-ScheduledTaskAction -Execute $nodeCmd -Argument "`"$pm2Module`" resurrect"
      $trigger = New-ScheduledTaskTrigger -AtStartup
      $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
      $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
      Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal | Out-Null
      Write-Host "Scheduled task '$taskName' created for boot persistence." -ForegroundColor Green
    } else {
      Write-Host 'Could not locate node.exe for scheduled task.' -ForegroundColor Yellow
    }
  } else {
    Write-Host "Scheduled task '$taskName' already exists." -ForegroundColor DarkGray
  }

  Write-Step 'Save PM2 process list'
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
