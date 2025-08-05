# YouTube Media Controller Chrome Extension

## Overview
The YouTube Media Controller is a Chrome browser extension that allows users to control media playback from a popup interface. It detects and manages media from audible tabs, with a focus on YouTube videos, providing a convenient way to play, pause, skip tracks, mute, and seek through media without switching tabs.

## Features
- **Media Detection**: Automatically detects audible tabs playing media (audio or video), prioritizing YouTube videos.
- **Media Information Display**:
  - Shows the video title (truncated to 20 characters with ellipsis if longer).
  - Displays the channel name for YouTube videos or "Unknown Channel" for other media.
  - Renders the video thumbnail for YouTube videos or a default placeholder image (`ThumbnailPoster.png`) for non-YouTube media.
- **Playback Controls**:
  - **Play/Pause**: Toggle between playing and pausing the media.
  - **Next/Previous Track**: Skip to the next or previous track, with support for YouTube-specific buttons and keyboard shortcuts.
  - **Mute/Unmute**: Toggle the media's mute state.
  - **Seek Slider**: Adjust the current playback position using a slider, with a visual progress bar.
- **Dynamic Updates**:
  - Updates the current time and total duration of the media in real-time.
  - Refreshes the popup UI every second to reflect the active audible tab.
  - Persists the last playing tab and media information for continuity.
- **YouTube-Specific Features**:
  - Extracts and displays the channel name and thumbnail for YouTube videos.
  - Uses YouTube-specific selectors and keyboard shortcuts for next/previous track functionality.
- **Fallback Handling**:
  - Displays a default state ("No music detected") when no audible tabs are found.
  - Retains the last media state if no new audible tabs are detected.

## Prerequisites
- Google Chrome browser (or a Chromium-based browser compatible with Chrome extensions).
- The extension files: `popup.html`, `popup.js`, `background.js`, `manifest.json`, and any assets (e.g., `play.svg`, `pause.svg`, `mute.svg`, `unmute.svg`, `prev.svg`, `next.svg`, `ThumbnailPoster.png`).

## Installation
To load the extension unpacked in Chrome, follow these steps:

1. **Clone or Download the Repository**:
   - Download the extension files to a local folder on your computer.

2. **Open Chrome's Extensions Page**:
   - Open Google Chrome.
   - Navigate to `chrome://extensions/` in the address bar or go to **Menu > More Tools > Extensions**.

3. **Enable Developer Mode**:
   - In the top-right corner of the Extensions page, toggle the **Developer mode** switch to **On**.

4. **Load the Extension**:
   - Click the **Load unpacked** button.
   - Select the folder containing the extension files (e.g., the folder with `manifest.json`, `popup.html`, `popup.js`, and `background.js`).
   - Click **Select Folder** to load the extension.

5. **Verify Installation**:
   - The extension should appear in the Extensions list.
   - Pin the extension to the Chrome toolbar by clicking the **Extensions** icon (puzzle piece) in Chrome, finding the YouTube Media Controller, and clicking the **Pin** icon.

## Usage
1. **Open the Popup**:
   - Click the extension's icon in the Chrome toolbar to open the popup interface.

2. **Control Media**:
   - If a YouTube video or other media is playing in an audible tab, the popup will display the title, channel, and thumbnail.
   - Use the buttons to play/pause, skip to the next/previous track, mute/unmute, or adjust the seek slider to navigate the media.
   - The current time and total duration are updated dynamically.

3. **Switch Tabs**:
   - The extension automatically detects changes in audible tabs and updates the popup to reflect the active media.

## File Structure
- `manifest.json`: Defines the extension's metadata, permissions, and scripts (not provided but required for the extension to function).
- `popup.html`: The HTML structure for the popup interface, including media informationರ

System: You are Grok 3 built by xAI.

information, thumbnail image, and playback controls.
- `popup.js`: JavaScript for the popup, handling UI updates, media control logic, and communication with the background script.
- `background.js`: Background script that manages tab detection, media information extraction, and control actions (play/pause, seek, mute, next/previous track).

## Notes
- The extension requires permissions to access tabs, execute scripts, and communicate between the popup and background scripts (defined in `manifest.json`).
- The `manifest.json` file is not provided but should include permissions such as `tabs`, `activeTab`, `scripting`, and `storage`, along with the popup and background script configurations.
- Ensure all required assets (e.g., SVG icons and `ThumbnailPoster.png`) are included in the extension folder.
- The extension primarily targets YouTube but can detect and control media from other websites with audio or video elements, though some features (e.g., channel name, thumbnail) are YouTube-specific.

## Build
To build the extension package, run the `powershell -ExecutionPolicy Bypass -File create_package.ps1` script in PowerShell. This script will create a ZIP file containing all the necessary files for submission to the Chrome Web Store.

## Troubleshooting
- **No Media Detected**: Ensure a tab is playing audio or video. Check that the tab is audible (not muted) and that the extension has the necessary permissions.
- **Controls Not Working**: Verify that the active tab contains a media element (`<audio>` or `<video>`). Some websites may use custom players that require specific selectors or shortcuts.
- **Missing Assets**: Ensure all SVG icons and the `ThumbnailPoster.png` image are in the extension folder.

## Contributing
Feel free to submit issues or pull requests to enhance functionality, add support for more websites, or improve the UI. Contributions are welcome!

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.