# Gudang Mitra Application Startup Script
Write-Host "🚀 Starting Gudang Mitra Application..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "📁 Working directory: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# Function to test if a port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check if ports are available
Write-Host "🔍 Checking ports..." -ForegroundColor Yellow
if (Test-Port 3002) {
    Write-Host "⚠️  Port 3002 is already in use. Backend might already be running." -ForegroundColor Yellow
}
if (Test-Port 5173) {
    Write-Host "⚠️  Port 5173 is already in use. Frontend might already be running." -ForegroundColor Yellow
}
Write-Host ""

# Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
$backendPath = Join-Path $scriptDir "server"
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    node fixed-server.js
} -ArgumentList $backendPath

Write-Host "✅ Backend server started (Job ID: $($backendJob.Id))" -ForegroundColor Green

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend connection
Write-Host "🔗 Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/test-connection" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is responding!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Backend connection test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Start Frontend Server
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npm run dev
} -ArgumentList $scriptDir

Write-Host "✅ Frontend server started (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# Wait for frontend to start
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test frontend connection
Write-Host "🔗 Testing frontend connection..." -ForegroundColor Yellow
$frontendReady = $false
for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Frontend is responding!" -ForegroundColor Green
            $frontendReady = $true
            break
        }
    } catch {
        Write-Host "⏳ Attempt $i/6: Frontend not ready yet..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   🎉 Gudang Mitra Application Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "🔧 Backend:  http://localhost:3002" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

if ($frontendReady) {
    Write-Host "🌐 Opening application in browser..." -ForegroundColor Green
    Start-Process "http://localhost:5173"
} else {
    Write-Host "⚠️  Frontend might not be ready yet. Try opening http://localhost:5173 manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Available Test Credentials:" -ForegroundColor Yellow
Write-Host "   Manager: manager@gudangmitra.com / password123" -ForegroundColor White
Write-Host "   User:    bob@example.com / password" -ForegroundColor White
Write-Host "   Admin:   user@example.com / password123" -ForegroundColor White
Write-Host ""

Write-Host "🛑 Press Ctrl+C to stop the servers" -ForegroundColor Red
Write-Host ""

# Keep the script running and monitor the jobs
try {
    while ($true) {
        Start-Sleep -Seconds 30
        
        # Check if jobs are still running
        $backendStatus = Get-Job -Id $backendJob.Id
        $frontendStatus = Get-Job -Id $frontendJob.Id
        
        if ($backendStatus.State -eq "Failed") {
            Write-Host "❌ Backend server failed!" -ForegroundColor Red
            Receive-Job -Id $backendJob.Id
        }
        
        if ($frontendStatus.State -eq "Failed") {
            Write-Host "❌ Frontend server failed!" -ForegroundColor Red
            Receive-Job -Id $frontendJob.Id
        }
        
        if ($backendStatus.State -eq "Failed" -and $frontendStatus.State -eq "Failed") {
            Write-Host "❌ Both servers failed. Exiting..." -ForegroundColor Red
            break
        }
    }
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    Stop-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Stop-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $backendJob.Id -ErrorAction SilentlyContinue
    Remove-Job -Id $frontendJob.Id -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
}
