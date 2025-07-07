# yt-dlp-mcp

A Media Control Protocol (MCP) server for yt-dlp, enabling video downloading and audio extraction from various platforms like YouTube, Vimeo, and many others.

## Setup Instructions

1. Clone this repository:
   ```
   git clone https://github.com/Hothit1/yt-dlp-mcp.git
   cd yt-dlp-mcp
   ```

2. Install dependencies:
   ```
   npm install
   ```
   Or run the included setup.bat file:
   ```
   setup.bat
   ```

3. Configure Claude Desktop:
   - Copy the contents of `claude_desktop_config.json` to your Claude Desktop configuration
   - The default configuration uses relative paths:
     - `./index.js` for the server script
     - `./yt-dlp.exe` for the yt-dlp executable
     - `./downloads` for downloaded files

4. Start the server:
   ```
   node index.js
   ```
   Or run the included start.bat file:
   ```
   start.bat
   ```

## Features

- Download videos from YouTube and other platforms
- Extract audio in various formats (mp3, m4a, etc.)
- List available formats for videos
- Control download quality and format

## Usage in Claude

Once the server is running, you can use Claude to interact with it:

- "Download this YouTube video: [URL]"
- "Extract audio from this video: [URL]"
- "List available formats for this video: [URL]"

