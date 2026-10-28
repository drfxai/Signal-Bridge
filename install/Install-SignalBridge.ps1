param(
  [string]$InstallDir = "$env:LOCALAPPDATA\DrFX\SignalBridge",
  [switch]$SkipMT5Copy
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Title($Text) {
  Write-Host ""
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "DrFX SignalBridge - Windows Installer" -ForegroundColor Cyan
Write-Host "DEMO beta installer. Live-account execution remains blocked." -ForegroundColor Yellow

$required = @(
  "agent-windows\agent.mjs",
  "agent-windows\receipt-outbox.mjs",
  "agent-windows\package.json",
  "agent-windows\config.example.json",
  "mt5\DrFX_SignalBridge_EA.mq5"
)

foreach ($relative in $required) {
  if (-not (Test-Path (Join-Path $RepoRoot $relative))) {
    throw "Missing repository file: $relative. Run this installer from the extracted Signal-Bridge repository."
  }
}

Title "1/4 Check Node.js"
$nodeOk = $false
try {
  $nodeVersion = (& node --version 2>$null).Trim()
  if ($nodeVersion -match '^v(\d+)\.') {
    $nodeMajor = [int]$Matches[1]
    if ($nodeMajor -ge 22) {
      $nodeOk = $true
      Write-Host "Node.js $nodeVersion detected." -ForegroundColor Green
    }
  }
} catch {}

if (-not $nodeOk) {
  Write-Host "Node.js 22+ is required for the Windows Agent." -ForegroundColor Yellow
  Write-Host "Install Node.js 22+ from https://nodejs.org/ and run this installer again." -ForegroundColor Yellow
}

Title "2/4 Install SignalBridge Agent"
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

Copy-Item (Join-Path $RepoRoot "agent-windows\agent.mjs") $InstallDir -Force
Copy-Item (Join-Path $RepoRoot "agent-windows\receipt-outbox.mjs") $InstallDir -Force
Copy-Item (Join-Path $RepoRoot "agent-windows\package.json") $InstallDir -Force
Copy-Item (Join-Path $RepoRoot "agent-windows\config.example.json") $InstallDir -Force

$configPath = Join-Path $InstallDir "config.json"
if (-not (Test-Path $configPath)) {
  Copy-Item (Join-Path $RepoRoot "agent-windows\config.example.json") $configPath
  Write-Host "Created config.json. Paste your private Agent token into this file." -ForegroundColor Yellow
} else {
  Write-Host "Existing config.json preserved." -ForegroundColor Green
}

$startCmd = @"
@echo off
cd /d "%~dp0"
node agent.mjs config.json
pause
"@
Set-Content -Path (Join-Path $InstallDir "Start-SignalBridge-Agent.cmd") -Value $startCmd -Encoding ASCII

Write-Host "Agent installed to:" -ForegroundColor Green
Write-Host "  $InstallDir"

Title "3/4 Copy MT5 EA"
$eaSource = Join-Path $RepoRoot "mt5\DrFX_SignalBridge_EA.mq5"
$copied = @()

if (-not $SkipMT5Copy) {
  $terminalRoot = Join-Path $env:APPDATA "MetaQuotes\Terminal"
  if (Test-Path $terminalRoot) {
    Get-ChildItem $terminalRoot -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      $experts = Join-Path $_.FullName "MQL5\Experts"
      if (Test-Path $experts) {
        $targetDir = Join-Path $experts "SignalBridge"
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        $target = Join-Path $targetDir "DrFX_SignalBridge_EA.mq5"
        Copy-Item $eaSource $target -Force
        $copied += $target
      }
    }
  }
}

if ($copied.Count -gt 0) {
  Write-Host "EA copied to $($copied.Count) detected MT5 terminal(s):" -ForegroundColor Green
  $copied | ForEach-Object { Write-Host "  $_" }
} else {
  $fallback = Join-Path $InstallDir "MT5"
  New-Item -ItemType Directory -Force -Path $fallback | Out-Null
  Copy-Item $eaSource (Join-Path $fallback "DrFX_SignalBridge_EA.mq5") -Force
  Write-Host "No MT5 data folder was detected." -ForegroundColor Yellow
  Write-Host "EA source saved here:" -ForegroundColor Yellow
  Write-Host "  $fallback"
  Write-Host "In MT5: File -> Open Data Folder -> MQL5 -> Experts -> copy the EA there."
}

Title "4/4 Next steps"
Write-Host "A. Open this file and paste the private Agent token:" -ForegroundColor White
Write-Host "   $configPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "B. In MetaEditor compile DrFX_SignalBridge_EA.mq5." -ForegroundColor White
Write-Host "C. Start Start-SignalBridge-Agent.cmd." -ForegroundColor White
Write-Host "D. Attach the EA to an MT5 DEMO chart and enable Algo Trading." -ForegroundColor White
Write-Host "E. For broker execution tests, enable InpEnableDemoExecution inside the EA inputs." -ForegroundColor White
Write-Host ""
Write-Host "Dashboard: https://signalbridge.drfx.online/dashboard" -ForegroundColor Cyan
Write-Host "Test panel: https://signalbridge.drfx.online/test" -ForegroundColor Cyan
Write-Host ""
Write-Host "Installation files are ready." -ForegroundColor Green
