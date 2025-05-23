Write-Host "🧪 Testing Backend Server..." -ForegroundColor Green
Write-Host ""

# Test 1: Check if server is running
Write-Host "1. Testing server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/test-connection" -Method Get
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Server connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Test login endpoint
Write-Host "2. Testing login endpoint..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "manager@gudangmitra.com"
        password = "password123"
    }
    $jsonBody = $loginData | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3002/api/auth/login" -Method Post -Body $jsonBody -ContentType "application/json"
    Write-Host "✅ Login test successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.username) ($($loginResponse.user.role))" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Login test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Backend testing complete!" -ForegroundColor Green
