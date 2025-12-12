@echo off
echo ========================================
echo   Galway Jam Circle - Local Server
echo ========================================
echo.
echo IMPORTANT: This requires Node.js to be installed.
echo.
echo If you don't have Node.js installed:
echo 1. Go to https://nodejs.org/
echo 2. Download and install the LTS version
echo 3. Restart this script
echo.
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Firebase CLI not found. Installing...
    echo.
    call npm install -g firebase-tools
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Firebase CLI
        pause
        exit /b 1
    )
    echo [OK] Firebase CLI installed
    echo.
)

echo [OK] Firebase CLI is installed
echo.

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing project dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

if not exist "functions\node_modules" (
    echo [INFO] Installing functions dependencies...
    cd functions
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install functions dependencies
        pause
        exit /b 1
    )
)

echo [OK] All dependencies installed
echo.
echo ========================================
echo   Starting Firebase Emulators...
echo ========================================
echo.
echo The website will be available at:
echo   http://localhost:5000
echo.
echo The Emulator UI will be available at:
echo   http://localhost:4000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

firebase emulators:start

pause
