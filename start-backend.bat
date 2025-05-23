@echo off
echo Starting Backend Server...
echo.

cd /d "%~dp0\server"

echo Current directory: %CD%
echo.

echo Checking Node.js...
"C:\Program Files\nodejs\node.exe" --version
if errorlevel 1 (
    echo Error: Node.js not found
    pause
    exit /b 1
)

echo.
echo Starting backend server...
"C:\Program Files\nodejs\node.exe" fixed-server.js

pause
