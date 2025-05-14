let lastPlayingTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getAudibleTabs') {
        chrome.tabs.query({ audible: true }, (tabs) => {
            if (tabs.length > 0) {
                lastPlayingTabId = tabs[0].id; // Update the last playing tab
            }
            sendResponse({ tabs });
        });
        return true; // Keep message channel open for async response
    } else if (message.action === 'getLastPlayingTab') {
        sendResponse({ tabId: lastPlayingTabId }); // Return the last playing tab ID
    } else if (message.action === 'getMediaInfo') {
        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            func: getMediaInfo
        });
    } else if (message.action === 'togglePlayPause') {
        const targetTabId = message.tabId || lastPlayingTabId; // Use the last playing tab if no tabId is provided
        if (targetTabId) {
            chrome.scripting.executeScript({
                target: { tabId: targetTabId },
                func: togglePlayPause
            });
        }
    } else if (message.action === 'seek') {
        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            func: seekMedia,
            args: [message.time]
        });
    } else if (message.action === 'previousTrack') {
        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            func: previousTrack
        });
    } else if (message.action === 'nextTrack') {
        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            func: nextTrack
        });
    } else if (message.action === 'getYouTubeInfo') {
        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            func: getYouTubeInfo
        });
    } else if (message.action === 'toggleMute') {
        chrome.scripting.executeScript({
            target: { tabId: message.tabId },
            func: toggleMute,
            args: [message.muted]
        });
    }
});

// Forward media info and YouTube info to popup
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'mediaInfo' || message.action === 'youtubeInfo') {
        chrome.runtime.sendMessage(message);
    }
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.runtime.sendMessage({ action: 'updateAudibleTab' });
});

// Listen for tab updates (e.g., audible state changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.audible !== undefined) {
        chrome.runtime.sendMessage({ action: 'updateAudibleTab' });
    }
});

// Update lastPlayingTabId when media info is received
function getMediaInfo() {
    const media = document.querySelector('audio, video');
    if (media) {
        chrome.runtime.sendMessage({
            action: 'mediaInfo',
            currentTime: media.currentTime,
            duration: media.duration,
            paused: media.paused
        });
        if (!media.paused) {
            chrome.runtime.sendMessage({ action: 'updateLastPlayingTab' });
        } else {
            // Update lastPlayingTabId even when paused
            chrome.runtime.sendMessage({ action: 'updateLastPlayingTab' });
        }
    }
}

function togglePlayPause() {
    const media = document.querySelector('audio, video');
    if (media) {
        if (media.paused) {
            media.play();
        } else {
            media.pause();
        }
    }
}

function seekMedia(time) {
    const media = document.querySelector('audio, video');
    if (media) {
        media.currentTime = time;
    }
}

function previousTrack() {
    // Try multiple approaches for previous track functionality
    console.log("Attempting to find previous track buttons...");

    // 1. First try YouTube-specific selectors based on their actual DOM structure
    const youtubeSelectors = [
        '.ytp-prev-button',
        'a[aria-label="Replay"]',
        'a[aria-label="Previous"]',
        'a[title*="Previous"]',
        'a[title="Replay"]'
    ];

    for (const selector of youtubeSelectors) {
        const button = document.querySelector(selector);
        if (button) {
            console.log(`Found YouTube button: ${selector}`);
            button.click();
            return;
        }
    }

    // 2. Try to find and click previous buttons with expanded selector criteria
    const prevButtons = Array.from(document.querySelectorAll('button, a, [role="button"], [data-testid*="prev"], [id*="prev"], [class*="prev"], [class*="back"], [data-control="prev"]')).filter(el => {
        const text = (el.textContent || '').toLowerCase().trim();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        const className = (el.className || '').toLowerCase();

        // Expanded detection criteria
        return (text.includes('prev') || text.includes('back') || text.includes('←') ||
            ariaLabel.includes('previous') || ariaLabel.includes('prev') || ariaLabel.includes('back') || ariaLabel.includes('replay') ||
            title.includes('previous') || title.includes('prev') || title.includes('back') || title.includes('replay') ||
            id.includes('prev') || id.includes('previous') || id.includes('back') ||
            className.includes('prev') || className.includes('previous') || className.includes('back') ||
            (el.querySelector('svg, img, i, span') && (
                (el.querySelector('svg, img, i, span').className || '').toLowerCase().includes('prev') ||
                (el.querySelector('svg, img, i, span').className || '').toLowerCase().includes('back')
            ))
        );
    });

    // For debugging
    console.log(`Found ${prevButtons.length} potential previous buttons`);
    prevButtons.forEach((btn, i) => {
        console.log(`Button ${i}: ${btn.outerHTML.substring(0, 100)}`);
    });

    if (prevButtons.length > 0) {
        // Click the most likely previous button (first one found)
        prevButtons[0].click();
        return;
    }

    // 3. Try keyboard shortcuts specifically suited for YouTube (j for previous in YouTube)
    const youtubeKeyboardShortcuts = [
        { key: 'j', code: 'KeyJ' }, // YouTube previous shortcut
        { key: ',', code: 'Comma' }, // YouTube frame-by-frame backward
        { key: 'SHIFT+p', code: 'KeyP', shiftKey: true }  // Some YouTube implementations
    ];

    for (const shortcut of youtubeKeyboardShortcuts) {
        const downEvent = new KeyboardEvent('keydown', {
            key: shortcut.key,
            code: shortcut.code,
            shiftKey: !!shortcut.shiftKey,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(downEvent);

        // Send keyup event immediately after
        const upEvent = new KeyboardEvent('keyup', {
            key: shortcut.key,
            code: shortcut.code,
            shiftKey: !!shortcut.shiftKey,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(upEvent);
    }

    // 4. Try site-specific selectors for popular streaming services
    const siteSpecificSelectors = [
        'button[aria-label*="Previous"]',
        'button[data-testid="control-button-skip-back"]',
        '.ytp-prev-button',
        '[data-test="previous-button"]',
        '.previous-button',
        '.prevButton',
        '.backButton',
        '.player-controls__btn--prev',
        // Add more YouTube-specific selectors
        '[aria-label="Replay"]',
        '[title="Replay"]'
    ];

    for (const selector of siteSpecificSelectors) {
        const button = document.querySelector(selector);
        if (button) {
            button.click();
            return;
        }
    }

    // 5. Try common keyboard shortcuts as last resort
    const shortcuts = [
        { key: 'MediaTrackPrevious', code: 'MediaTrackPrevious' },
        { key: 'MediaPreviousTrack', code: 'MediaPreviousTrack' },
        { key: 'p', code: 'KeyP' },
        { key: 'b', code: 'KeyB' },
        { key: 'ArrowLeft', code: 'ArrowLeft', shiftKey: true },
        { key: 'Left', code: 'ArrowLeft', shiftKey: true },
        { key: 'ArrowLeft', code: 'ArrowLeft', ctrlKey: true }
    ];

    // Send both keydown and keyup events for better simulation
    for (const shortcut of shortcuts) {
        const downEvent = new KeyboardEvent('keydown', {
            key: shortcut.key,
            code: shortcut.code,
            shiftKey: !!shortcut.shiftKey,
            ctrlKey: !!shortcut.ctrlKey,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(downEvent);

        // Send keyup event after a slight delay
        setTimeout(() => {
            const upEvent = new KeyboardEvent('keyup', {
                key: shortcut.key,
                code: shortcut.code,
                shiftKey: !!shortcut.shiftKey,
                ctrlKey: !!shortcut.ctrlKey,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(upEvent);
        }, 10);
    }
}

function nextTrack() {
    // Try multiple approaches for next track functionality
    console.log("Attempting to find next track buttons...");

    // 1. First try YouTube-specific selectors based on their actual DOM structure
    const youtubeSelectors = [
        '.ytp-next-button',
        'a[aria-label="Next"]',
        'a[title*="Next"]'
    ];

    for (const selector of youtubeSelectors) {
        const button = document.querySelector(selector);
        if (button) {
            console.log(`Found YouTube button: ${selector}`);
            button.click();
            return;
        }
    }

    // 2. Try to find and click next buttons with expanded selector criteria
    const nextButtons = Array.from(document.querySelectorAll('button, a, [role="button"], [data-testid*="next"], [id*="next"], [class*="next"], [data-control="next"]')).filter(el => {
        const text = (el.textContent || '').toLowerCase().trim();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        const className = (el.className || '').toLowerCase();

        return (text.includes('next') || text.includes('→') ||
            ariaLabel.includes('next') ||
            title.includes('next') ||
            id.includes('next') ||
            className.includes('next') ||
            (el.querySelector('svg, img, i, span') && (
                (el.querySelector('svg, img, i, span').className || '').toLowerCase().includes('next')
            ))
        );
    });

    // For debugging
    console.log(`Found ${nextButtons.length} potential next buttons`);
    nextButtons.forEach((btn, i) => {
        console.log(`Button ${i}: ${btn.outerHTML.substring(0, 100)}`);
    });

    if (nextButtons.length > 0) {
        // Click the most likely next button (first one found)
        nextButtons[0].click();
        return;
    }

    // 3. Try keyboard shortcuts specifically suited for YouTube
    const youtubeKeyboardShortcuts = [
        { key: 'n', code: 'KeyN' }, // YouTube next shortcut
        { key: '.', code: 'Period' }, // YouTube frame-by-frame forward
        { key: 'SHIFT+n', code: 'KeyN', shiftKey: true }  // YouTube next video
    ];

    for (const shortcut of youtubeKeyboardShortcuts) {
        const downEvent = new KeyboardEvent('keydown', {
            key: shortcut.key,
            code: shortcut.code,
            shiftKey: !!shortcut.shiftKey,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(downEvent);

        // Send keyup event immediately after
        const upEvent = new KeyboardEvent('keyup', {
            key: shortcut.key,
            code: shortcut.code,
            shiftKey: !!shortcut.shiftKey,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(upEvent);
    }

    // 4. Try site-specific selectors for popular streaming services
    const siteSpecificSelectors = [
        'button[aria-label*="Next"]',
        'button[data-testid="control-button-skip-forward"]',
        '.ytp-next-button',
        '[data-test="next-button"]',
        '.next-button',
        '.nextButton',
        '.player-controls__btn--next'
    ];

    for (const selector of siteSpecificSelectors) {
        const button = document.querySelector(selector);
        if (button) {
            button.click();
            return;
        }
    }

    // 5. Try common keyboard shortcuts as last resort
    const shortcuts = [
        { key: 'MediaTrackNext', code: 'MediaTrackNext' },
        { key: 'MediaNextTrack', code: 'MediaNextTrack' },
        { key: 'n', code: 'KeyN' },
        { key: 'ArrowRight', code: 'ArrowRight', shiftKey: true },
        { key: 'Right', code: 'ArrowRight', shiftKey: true },
        { key: 'ArrowRight', code: 'ArrowRight', ctrlKey: true }
    ];

    // Send both keydown and keyup events for better simulation
    for (const shortcut of shortcuts) {
        const downEvent = new KeyboardEvent('keydown', {
            key: shortcut.key,
            code: shortcut.code,
            shiftKey: !!shortcut.shiftKey,
            ctrlKey: !!shortcut.ctrlKey,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(downEvent);

        // Send keyup event after a slight delay
        setTimeout(() => {
            const upEvent = new KeyboardEvent('keyup', {
                key: shortcut.key,
                code: shortcut.code,
                shiftKey: !!shortcut.shiftKey,
                ctrlKey: !!shortcut.ctrlKey,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(upEvent);
        }, 10);
    }
}

function getYouTubeInfo() {
    try {
        // Extract channel name
        let channel = '';
        const channelElement = document.querySelector('ytd-video-owner-renderer a.yt-simple-endpoint');
        if (channelElement) {
            channel = channelElement.textContent.trim();
        } else {
            // Fallback to meta tag
            const metaChannel = document.querySelector('meta[itemprop="channelId"]');
            if (metaChannel) {
                channel = metaChannel.getAttribute('content') || '';
                console.log('Channel from meta tag:', channel);
            }
        }

        // Extract thumbnail URL
        let thumbnail = '';
        const metaThumbnail = document.querySelector('meta[property="og:image"]');
        if (metaThumbnail) {
            thumbnail = metaThumbnail.getAttribute('content') || '';
        } else {
            // Fallback to constructing thumbnail URL from video ID
            const url = window.location.href;
            const videoIdMatch = url.match(/[?&]v=([^&]+)/);
            if (videoIdMatch && videoIdMatch[1]) {
                thumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/default.jpg`;
            }
        }

        chrome.runtime.sendMessage({
            action: 'youtubeInfo',
            channel: channel,
            thumbnail: thumbnail
        });
    } catch (error) {
        console.error('Error in getYouTubeInfo:', error);
        chrome.runtime.sendMessage({
            action: 'youtubeInfo',
            channel: '',
            thumbnail: ''
        });
    }
}

function toggleMute(muted) {
    const media = document.querySelector('audio, video');
    if (media) {
        media.muted = muted;
    }
}

// Listen for a message to update the last playing tab
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'updateLastPlayingTab' && sender.tab) {
        lastPlayingTabId = sender.tab.id;
    }
});