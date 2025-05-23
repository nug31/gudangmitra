@echo off
echo ========================================
echo  Uploading Gudang Mitra to GitHub
echo ========================================
echo.

echo 📁 Current directory: %CD%
echo 🔗 Repository: https://github.com/nug31/gudangmitra.git
echo.

echo 🔧 Checking if Git is installed...
git --version
if %errorlevel% neq 0 (
    echo ❌ Git is not installed or not in PATH
    echo 📥 Please install Git from: https://git-scm.com/download/windows
    echo 📋 Or use GitHub Desktop: https://desktop.github.com/
    pause
    exit /b 1
)

echo 🔧 Initializing Git repository...
git init

echo 🔗 Adding GitHub remote...
git remote add origin https://github.com/nug31/gudangmitra.git

echo 📦 Adding all files...
git add .

echo 💾 Committing files...
git commit -m "Initial commit: Professional 3D Inventory Management System - Complete React + TypeScript frontend with modern 3D design - Node.js + Express backend with MySQL integration - Authentication system with role-based access - Real-time dashboard with glassmorphism effects - Inventory and request management system - Professional UI/UX with 3D animations - Production-ready deployment configuration"

echo 🚀 Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ✅ Upload complete!
echo.
echo 📋 Next steps:
echo 1. Go to Railway dashboard: https://railway.app
echo 2. Add new service from GitHub repo: nug31/gudangmitra
echo 3. Set root directory to: server
echo 4. Add environment variables
echo 5. Deploy backend
echo.
echo 🎉 Your repository is ready for Railway deployment!
pause
