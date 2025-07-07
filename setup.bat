@echo off
echo Setting up YT-DLP MCP Server...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

:: Check if yt-dlp.exe exists
if not exist "C:\Users\Admin\Downloads\yt-dlp.exe" (
    echo WARNING: yt-dlp.exe not found at C:\Users\Admin\Downloads\yt-dlp.exe
    echo Please make sure yt-dlp.exe is in the correct location
    echo.
)

echo.
echo ✅ Setup completed successfully!
echo.
echo To use this MCP server with Claude Desktop:
echo 1. Copy the contents of claude_desktop_config.json
echo 2. Add it to your Claude Desktop configuration
echo 3. Restart Claude Desktop
echo.
echo To test the server directly:
echo   npm start
echo.
pause
