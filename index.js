#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class YtDlpMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: "yt-dlp-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Default paths - can be overridden via environment variables
    this.ytDlpPath = process.env.YT_DLP_PATH || "C:\\Users\\Admin\\Downloads\\yt-dlp.exe";
    this.downloadDir = process.env.DOWNLOAD_DIR || "C:\\Users\\Admin\\Downloads";

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "download_video",
            description: "Download a video from YouTube or other supported sites",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL of the video to download",
                },
                quality: {
                  type: "string",
                  description: "Video quality preference (e.g., 'best', 'best[height<=720]', 'worst')",
                  default: "best[height<=720]",
                },
                format: {
                  type: "string",
                  description: "Output format (e.g., 'mp4', 'webm', 'best')",
                  default: "best",
                },
                audio_only: {
                  type: "boolean",
                  description: "Download audio only",
                  default: false,
                },
                output_template: {
                  type: "string",
                  description: "Custom output filename template",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "get_video_info",
            description: "Get information about a video without downloading",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL of the video to get info for",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "list_formats",
            description: "List available formats for a video",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL of the video to list formats for",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "extract_audio",
            description: "Extract audio from a video URL",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL of the video to extract audio from",
                },
                audio_format: {
                  type: "string",
                  description: "Audio format (mp3, aac, wav, etc.)",
                  default: "mp3",
                },
                audio_quality: {
                  type: "string",
                  description: "Audio quality (0-9, where 0 is best)",
                  default: "0",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "download_playlist",
            description: "Download an entire playlist",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL of the playlist to download",
                },
                quality: {
                  type: "string",
                  description: "Video quality preference",
                  default: "best[height<=720]",
                },
                max_downloads: {
                  type: "number",
                  description: "Maximum number of videos to download",
                },
                playlist_start: {
                  type: "number",
                  description: "Start downloading from this video number",
                  default: 1,
                },
                playlist_end: {
                  type: "number",
                  description: "Stop downloading at this video number",
                },
              },
              required: ["url"],
            },
          },
          {
            name: "search_and_download",
            description: "Search for videos and download them",
            inputSchema: {
              type: "object",
              properties: {
                search_query: {
                  type: "string",
                  description: "Search query for videos",
                },
                max_results: {
                  type: "number",
                  description: "Maximum number of search results to download",
                  default: 1,
                },
                quality: {
                  type: "string",
                  description: "Video quality preference",
                  default: "best[height<=720]",
                },
              },
              required: ["search_query"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "download_video":
            return await this.downloadVideo(args);
          case "get_video_info":
            return await this.getVideoInfo(args);
          case "list_formats":
            return await this.listFormats(args);
          case "extract_audio":
            return await this.extractAudio(args);
          case "download_playlist":
            return await this.downloadPlaylist(args);
          case "search_and_download":
            return await this.searchAndDownload(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async runYtDlp(args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(this.ytDlpPath, args, {
        cwd: this.downloadDir,
        ...options,
      });

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
        }
      });

      process.on("error", (error) => {
        reject(error);
      });
    });
  }

  async downloadVideo(args) {
    const { url, quality = "best[height<=720]", format = "best", audio_only = false, output_template } = args;

    const ytDlpArgs = [];

    if (audio_only) {
      ytDlpArgs.push("-f", "bestaudio");
      ytDlpArgs.push("--extract-audio");
      ytDlpArgs.push("--audio-format", "mp3");
    } else {
      ytDlpArgs.push("-f", quality);
      if (format !== "best") {
        ytDlpArgs.push("--merge-output-format", format);
      }
    }

    if (output_template) {
      ytDlpArgs.push("-o", output_template);
    }

    ytDlpArgs.push(url);

    try {
      const result = await this.runYtDlp(ytDlpArgs);
      return {
        content: [
          {
            type: "text",
            text: `✅ Download completed successfully!\\n\\nOutput:\\n${result.stdout}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async getVideoInfo(args) {
    const { url } = args;

    try {
      const result = await this.runYtDlp(["--dump-json", url]);
      const videoInfo = JSON.parse(result.stdout);

      const info = {
        title: videoInfo.title,
        uploader: videoInfo.uploader,
        duration: videoInfo.duration,
        view_count: videoInfo.view_count,
        upload_date: videoInfo.upload_date,
        description: videoInfo.description?.substring(0, 200) + "...",
        thumbnail: videoInfo.thumbnail,
        webpage_url: videoInfo.webpage_url,
        format_id: videoInfo.format_id,
        ext: videoInfo.ext,
        filesize: videoInfo.filesize,
      };

      return {
        content: [
          {
            type: "text",
            text: `📹 **Video Information**\\n\\n**Title:** ${info.title}\\n**Uploader:** ${info.uploader}\\n**Duration:** ${Math.floor(info.duration / 60)}:${String(info.duration % 60).padStart(2, '0')}\\n**Views:** ${info.view_count?.toLocaleString() || 'N/A'}\\n**Upload Date:** ${info.upload_date}\\n**Description:** ${info.description}\\n**Thumbnail:** ${info.thumbnail}\\n**URL:** ${info.webpage_url}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  async listFormats(args) {
    const { url } = args;

    try {
      const result = await this.runYtDlp(["-F", url]);
      return {
        content: [
          {
            type: "text",
            text: `📋 **Available Formats**\\n\\n\`\`\`\\n${result.stdout}\`\`\``,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list formats: ${error.message}`);
    }
  }

  async extractAudio(args) {
    const { url, audio_format = "mp3", audio_quality = "0" } = args;

    const ytDlpArgs = [
      "-f", "bestaudio",
      "--extract-audio",
      "--audio-format", audio_format,
      "--audio-quality", audio_quality,
      url,
    ];

    try {
      const result = await this.runYtDlp(ytDlpArgs);
      return {
        content: [
          {
            type: "text",
            text: `🎵 Audio extraction completed!\\n\\nOutput:\\n${result.stdout}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Audio extraction failed: ${error.message}`);
    }
  }

  async downloadPlaylist(args) {
    const { url, quality = "best[height<=720]", max_downloads, playlist_start = 1, playlist_end } = args;

    const ytDlpArgs = ["-f", quality];

    if (max_downloads) {
      ytDlpArgs.push("--max-downloads", max_downloads.toString());
    }

    if (playlist_start > 1) {
      ytDlpArgs.push("--playlist-start", playlist_start.toString());
    }

    if (playlist_end) {
      ytDlpArgs.push("--playlist-end", playlist_end.toString());
    }

    ytDlpArgs.push(url);

    try {
      const result = await this.runYtDlp(ytDlpArgs);
      return {
        content: [
          {
            type: "text",
            text: `📂 Playlist download completed!\\n\\nOutput:\\n${result.stdout}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Playlist download failed: ${error.message}`);
    }
  }

  async searchAndDownload(args) {
    const { search_query, max_results = 1, quality = "best[height<=720]" } = args;

    const ytDlpArgs = [
      "-f", quality,
      "--max-downloads", max_results.toString(),
      `ytsearch${max_results}:${search_query}`,
    ];

    try {
      const result = await this.runYtDlp(ytDlpArgs);
      return {
        content: [
          {
            type: "text",
            text: `🔍 Search and download completed!\\n\\nSearch query: "${search_query}"\\nMax results: ${max_results}\\n\\nOutput:\\n${result.stdout}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Search and download failed: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("YT-DLP MCP server running on stdio");
  }
}

const server = new YtDlpMcpServer();
server.run().catch(console.error);
