Write-Host "🚀 Starting Frontend Development Server..." -ForegroundColor Green
Write-Host ""

# Set paths
$nodePath = "C:\Program Files\nodejs\node.exe"
$npmPath = "C:\Program Files\nodejs\npm.cmd"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if Node.js exists
if (-not (Test-Path $nodePath)) {
    Write-Host "❌ Node.js not found at $nodePath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js found" -ForegroundColor Green
Write-Host "📁 Working directory: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# Set working directory
Set-Location $scriptDir

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    & $npmPath install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

Write-Host "🌐 Starting Vite development server..." -ForegroundColor Cyan
Write-Host "📍 Server will be available at: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

# Start the development server
& $npmPath run dev
