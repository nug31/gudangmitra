@echo off
echo Starting Frontend Development Server...
echo.

cd /d "%~dp0"

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
echo Starting Vite development server...
"C:\Program Files\nodejs\npx.cmd" vite --host 0.0.0.0 --port 5173

pause
