# Gudang Mitra Application Runner
# This script uses full paths to Node.js to avoid PATH issues

Write-Host "🚀 Starting Gudang Mitra Application..." -ForegroundColor Green
Write-Host ""

# Set paths
$nodePath = "C:\Program Files\nodejs\node.exe"
$npmPath = "C:\Program Files\nodejs\npm.cmd"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if Node.js exists
if (-not (Test-Path $nodePath)) {
    Write-Host "❌ Node.js not found at $nodePath" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm exists
if (-not (Test-Path $npmPath)) {
    Write-Host "❌ npm not found at $npmPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js found at: $nodePath" -ForegroundColor Green
Write-Host "✅ npm found at: $npmPath" -ForegroundColor Green
Write-Host ""

# Set working directory
Set-Location $scriptDir
Write-Host "📁 Working directory: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    & $npmPath install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Start backend server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    param($nodePath, $scriptDir)
    Set-Location $scriptDir
    & $nodePath "server/simple-test-server.js"
} -ArgumentList $nodePath, $scriptDir

Write-Host "✅ Backend server started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Wait for backend
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test backend
Write-Host "🔗 Testing backend connection..." -ForegroundColor Yellow
$backendReady = $false
for ($i = 1; $i -le 5; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/test" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Backend is responding!" -ForegroundColor Green
            $backendReady = $true
            break
        }
    } catch {
        Write-Host "⏳ Attempt $i/5: Backend not ready yet..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    Stop-Job -Id $backendJob.Id
    Remove-Job -Id $backendJob.Id
    exit 1
}

Write-Host ""

# Start frontend server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($npmPath, $scriptDir)
    Set-Location $scriptDir
    & $npmPath run dev
} -ArgumentList $npmPath, $scriptDir

Write-Host "✅ Frontend server started (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# Wait for frontend
Write-Host "⏳ Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test frontend
Write-Host "🔗 Testing frontend connection..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is responding!" -ForegroundColor Green
            $frontendReady = $true
            break
        }
    } catch {
        Write-Host "⏳ Attempt $i/10: Frontend not ready yet..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   🎉 Gudang Mitra Application Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

if ($frontendReady) {
    Write-Host "🌐 Main Application: http://localhost:5173" -ForegroundColor Green
    Write-Host "🔧 Backend API: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "🧪 Test Login Page: file:///$scriptDir/test-login.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Opening main application..." -ForegroundColor Green
    Start-Process "http://localhost:5173"
} else {
    Write-Host "⚠️  Frontend not ready. Available options:" -ForegroundColor Yellow
    Write-Host "🔧 Backend API: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "🧪 Test Login Page: file:///$scriptDir/test-login.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🧪 Opening test login page..." -ForegroundColor Yellow
    Start-Process "file:///$scriptDir/test-login.html"
}

Write-Host ""
Write-Host "📋 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Manager: manager@gudangmitra.com / password123" -ForegroundColor White
Write-Host "   User:    bob@example.com / password" -ForegroundColor White
Write-Host ""

Write-Host "🛑 Press Ctrl+C to stop the servers" -ForegroundColor Red
Write-Host ""

# Monitor servers
try {
    while ($true) {
        Start-Sleep -Seconds 30
        
        # Check job status
        $backendStatus = Get-Job -Id $backendJob.Id
        $frontendStatus = Get-Job -Id $frontendJob.Id
        
        Write-Host "📊 Status - Backend: $($backendStatus.State), Frontend: $($frontendStatus.State)" -ForegroundColor Gray
        
        if ($backendStatus.State -eq "Failed") {
            Write-Host "❌ Backend server failed!" -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
        }
        
        if ($frontendStatus.State -eq "Failed") {
            Write-Host "❌ Frontend server failed!" -ForegroundColor Red
            Receive-Job -Id $frontendJob.Id
        }
    }
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "🧹 Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}
