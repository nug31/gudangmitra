@echo off
echo ========================================
echo   PUSH CHANGES TO GITHUB
echo ========================================
echo.
echo Files that need to be committed:
echo   - server/railway-server.js (bcrypt authentication)
echo   - server/package.json (added bcrypt dependency)  
echo   - src/components/auth/LoginForm.tsx (updated for real users)
echo.
echo ========================================
echo   OPTION 1: GitHub Desktop
echo ========================================
echo 1. Open GitHub Desktop
echo 2. You should see 3 changed files
echo 3. Add commit message: "Add bcrypt support for real database users"
echo 4. Click "Commit to main"
echo 5. Click "Push origin"
echo.
echo ========================================
echo   OPTION 2: Try Git Command Line
echo ========================================
echo.

REM Try to find git
where git >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Git found! Attempting to push...
    echo.
    git status
    echo.
    echo Adding files...
    git add server/railway-server.js
    git add server/package.json
    git add src/components/auth/LoginForm.tsx
    echo.
    echo Committing...
    git commit -m "Add bcrypt support for real database users - Updated authentication to handle both plain text and bcrypt hashed passwords - Added bcrypt dependency to server package.json - Updated login form for real users only"
    echo.
    echo Pushing to GitHub...
    git push origin main
    echo.
    echo ✅ DONE! Changes pushed to GitHub.
    echo Railway will auto-deploy in 2-3 minutes.
) else (
    echo Git not found in PATH.
    echo.
    echo Please use GitHub Desktop:
    echo 1. Open GitHub Desktop manually
    echo 2. Commit the 3 changed files
    echo 3. Push to GitHub
)

echo.
echo ========================================
echo   OPTION 3: GitHub Web Interface
echo ========================================
echo 1. Go to: https://github.com/nug31/gudangmitra
echo 2. Navigate to each file and edit manually
echo 3. Copy content from local files
echo 4. Commit changes
echo.
pause
