chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAudibleTabs') {
    chrome.tabs.query({ audible: true }, (tabs) => {
      sendResponse({ tabs });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === 'getMediaInfo') {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: getMediaInfo
    });
  } else if (message.action === 'togglePlayPause') {
    chrome.scripting.executeScript({
      target: { tabId: message.tabId },
      func: togglePlayPause
    });
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
  }
});

// Forward media info to popup
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'mediaInfo') {
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

function getMediaInfo() {
  const media = document.querySelector('audio, video');
  if (media) {
    chrome.runtime.sendMessage({
      action: 'mediaInfo',
      currentTime: media.currentTime,
      duration: media.duration,
      paused: media.paused
    });
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
  const event = new KeyboardEvent('keydown', {
    key: 'MediaPreviousTrack',
    code: 'MediaPreviousTrack',
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
}

function nextTrack() {
  const event = new KeyboardEvent('keydown', {
    key: 'MediaNextTrack',
    code: 'MediaNextTrack',
    bubbles: true,
    cancelable: true
  });
  document.dispatchEvent(event);
}