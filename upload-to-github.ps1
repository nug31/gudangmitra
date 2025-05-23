# PowerShell script to upload Gudang Mitra to GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Uploading Gudang Mitra to GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📁 Current directory: $PWD" -ForegroundColor Yellow
Write-Host "🔗 Repository: https://github.com/nug31/gudangmitra.git" -ForegroundColor Yellow
Write-Host ""

# Refresh environment variables
Write-Host "🔄 Refreshing environment variables..." -ForegroundColor Green
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check if Git is available
Write-Host "🔧 Checking if Git is available..." -ForegroundColor Green
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found in PATH. Trying common installation paths..." -ForegroundColor Red
    
    # Try common Git installation paths
    $gitPaths = @(
        "C:\Program Files\Git\bin\git.exe",
        "C:\Program Files (x86)\Git\bin\git.exe",
        "$env:LOCALAPPDATA\Programs\Git\bin\git.exe"
    )
    
    $gitFound = $false
    foreach ($path in $gitPaths) {
        if (Test-Path $path) {
            Write-Host "✅ Found Git at: $path" -ForegroundColor Green
            $env:Path = "$env:Path;$(Split-Path $path)"
            $gitFound = $true
            break
        }
    }
    
    if (-not $gitFound) {
        Write-Host "❌ Git installation not found. Please restart PowerShell or install Git manually." -ForegroundColor Red
        Write-Host "📥 Download from: https://git-scm.com/download/windows" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""

# Configure Git user (if not already configured)
Write-Host "👤 Configuring Git user..." -ForegroundColor Green
try {
    $userName = git config --global user.name
    if (-not $userName) {
        git config --global user.name "nug31"
        Write-Host "✅ Set Git username to: nug31" -ForegroundColor Green
    } else {
        Write-Host "✅ Git username already set: $userName" -ForegroundColor Green
    }
    
    $userEmail = git config --global user.email
    if (-not $userEmail) {
        git config --global user.email "nug31@example.com"
        Write-Host "✅ Set Git email to: nug31@example.com" -ForegroundColor Green
    } else {
        Write-Host "✅ Git email already set: $userEmail" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not configure Git user. Continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""

# Initialize Git repository
Write-Host "🔧 Initializing Git repository..." -ForegroundColor Green
try {
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Git init failed or already initialized" -ForegroundColor Yellow
}

# Add GitHub remote
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Green
try {
    git remote add origin https://github.com/nug31/gudangmitra.git
    Write-Host "✅ GitHub remote added" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Remote might already exist. Continuing..." -ForegroundColor Yellow
    try {
        git remote set-url origin https://github.com/nug31/gudangmitra.git
        Write-Host "✅ GitHub remote URL updated" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Could not set remote URL" -ForegroundColor Yellow
    }
}

# Add all files
Write-Host "📦 Adding all files..." -ForegroundColor Green
try {
    git add .
    Write-Host "✅ All files added to staging" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add files" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Commit files
Write-Host "💾 Committing files..." -ForegroundColor Green
try {
    git commit -m "Initial commit: Professional 3D Inventory Management System

- Complete React + TypeScript frontend with modern 3D design
- Node.js + Express backend with MySQL integration  
- Authentication system with role-based access
- Real-time dashboard with glassmorphism effects
- Inventory and request management system
- Professional UI/UX with 3D animations
- Production-ready deployment configuration"
    Write-Host "✅ Files committed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Set main branch and push
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
try {
    git branch -M main
    Write-Host "✅ Set main branch" -ForegroundColor Green
    
    Write-Host "📤 Pushing to GitHub (this may take a moment)..." -ForegroundColor Yellow
    git push -u origin main
    Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "❌ Push failed. You may need to authenticate with GitHub." -ForegroundColor Red
    Write-Host "💡 Try running: git push -u origin main" -ForegroundColor Yellow
    Write-Host "💡 Or use GitHub Desktop for easier authentication" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Upload process completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to Railway dashboard: https://railway.app" -ForegroundColor White
Write-Host "2. Add new service from GitHub repo: nug31/gudangmitra" -ForegroundColor White
Write-Host "3. Set root directory to: server" -ForegroundColor White
Write-Host "4. Add environment variables" -ForegroundColor White
Write-Host "5. Deploy backend" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Your repository: https://github.com/nug31/gudangmitra" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
