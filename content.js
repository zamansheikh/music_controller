// Content script to help detect media without needing tabs permission

// Check for media elements and register with background script
function checkAndRegisterMedia() {
    const media = document.querySelector('audio, video');
    if (media && !media.paused && media.currentTime > 0) {
        // Register this tab as having active media
        chrome.runtime.sendMessage({ action: 'registerMediaTab' });
    }
}

// Run check when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndRegisterMedia);
} else {
    checkAndRegisterMedia();
}

// Also check periodically for media changes
setInterval(checkAndRegisterMedia, 2000);

// Listen for media events to detect play/pause changes
document.addEventListener('play', () => {
    chrome.runtime.sendMessage({ action: 'registerMediaTab' });
}, true);

document.addEventListener('pause', () => {
    // Still register the tab even when paused, as it has media capability
    chrome.runtime.sendMessage({ action: 'registerMediaTab' });
}, true);