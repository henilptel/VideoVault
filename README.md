# YT-DLP Chrome Extension

A Chrome extension that provides a convenient way to download videos using yt-dlp. This extension integrates with YouTube pages and offers a user-friendly interface for video downloads.

## Features

- 🎯 Direct integration with YouTube pages
- 🎨 Clean and intuitive popup interface
- ⚡ Background processing using service workers

## Prerequisites

- Google Chrome browser (or any chromium browser)
- Node.js and npm installed
- yt-dlp installed on your system

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/yt-dlp-wrapper-extension.git
cd yt-dlp-wrapper-extension
```

2. Install dependencies:
```bash
npm install
```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension directory

4. Start the backend server:
```bash
npm start
```

## Usage

1. Navigate to any YouTube video
2. Click the extension icon in your browser toolbar
3. Use the popup interface to select download options
4. Click download to start the process

## Technical Details

### Architecture

- **Frontend**: Chrome Extension (Manifest V3)
  - `popup.html/js/css`: User interface
  - `background.js`: Service worker for background operations
  - `content.js`: Content script for YouTube page integration

- **Backend**: Express.js Server
  - Handles communication with yt-dlp
  - Manages download operations
  - Provides API endpoints for the extension

### Dependencies

- Express.js v4.21.2
- CORS v2.8.5
- yt-dlp (external dependency)

### Permissions

- `activeTab`: For interacting with the current tab
- `scripting`: For injecting content scripts
- Host permission for YouTube domains

## Note

This extension requires yt-dlp to be installed on your system. Please ensure it's properly installed and accessible from the command line before using the extension.
