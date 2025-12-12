@echo off
echo ========================================
echo   Node.js Automated Installer
echo ========================================
echo.
echo This script will download and install Node.js LTS
echo.
echo IMPORTANT: You may need to run this as Administrator
echo Right-click this file and select "Run as administrator"
echo.
pause

REM Check if Node.js is already installed
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js is already installed!
    node --version
    npm --version
    echo.
    echo You can now run START_SERVER.bat
    pause
    exit /b 0
)

echo [INFO] Downloading Node.js LTS installer...
echo.

REM Create temp directory
if not exist "%TEMP%\nodejs_install" mkdir "%TEMP%\nodejs_install"
cd /d "%TEMP%\nodejs_install"

REM Download Node.js LTS installer using PowerShell
powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile 'nodejs_installer.msi'}"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to download Node.js installer
    echo.
    echo Please download manually from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Download complete
echo.
echo [INFO] Installing Node.js...
echo This may take a few minutes...
echo.

REM Install Node.js silently
msiexec /i nodejs_installer.msi /quiet /norestart

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Installation failed
    echo.
    echo Please install manually:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version
    echo 3. Run the installer
    pause
    exit /b 1
)

echo [OK] Node.js installed successfully!
echo.
echo [INFO] Cleaning up...
cd /d "%USERPROFILE%"
rmdir /s /q "%TEMP%\nodejs_install"

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo IMPORTANT: You must restart your computer for the changes to take effect.
echo.
echo After restarting:
echo 1. Open a new command prompt
echo 2. Run: node --version
echo 3. Run START_SERVER.bat
echo.
pause
