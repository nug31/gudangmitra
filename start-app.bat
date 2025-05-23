@echo off
echo Starting Gudang Mitra Application...
echo.

echo [1/3] Starting Backend Server...
cd /d "%~dp0"
start "Backend Server" cmd /k "cd server && node fixed-server.js"

echo [2/3] Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo [3/3] Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ========================================
echo   Gudang Mitra Application Started!
echo ========================================
echo.
echo Backend:  http://localhost:3002
echo Frontend: http://localhost:5173
echo.
echo Press any key to open the application...
pause > nul

echo Opening application in browser...
start http://localhost:5173

echo.
echo Application is running!
echo Close this window to stop the servers.
echo.
pause
