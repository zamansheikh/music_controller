document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const controlsDiv = document.getElementById('controls');
  const playPauseBtn = document.getElementById('playPause');
  const prevTrackBtn = document.getElementById('prevTrack');
  const nextTrackBtn = document.getElementById('nextTrack');
  const seekSlider = document.getElementById('seek');
  const timeDiv = document.getElementById('time');
  let tabId = null;
  let duration = 0;

  // Function to update audible tab
  function updateAudibleTab() {
    chrome.runtime.sendMessage({ action: 'getAudibleTabs' }, (response) => {
      if (response && response.tabs && response.tabs.length > 0) {
        tabId = response.tabs[0].id;
        statusDiv.textContent = `Playing: ${response.tabs[0].title.slice(0, 30)}${response.tabs[0].title.length > 30 ? '...' : ''}`;
        controlsDiv.style.display = 'flex';
        // Request media info
        chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId });
      } else {
        tabId = null;
        statusDiv.textContent = 'No music detected';
        controlsDiv.style.display = 'none';
        timeDiv.textContent = '0:00 / 0:00';
        seekSlider.value = 0;
      }
    });
  }

  // Initial check for audible tabs
  updateAudibleTab();

  // Poll for audible tabs every 1 second
  setInterval(updateAudibleTab, 1000);

  // Listen for messages from background (e.g., active tab change)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateAudibleTab') {
      updateAudibleTab();
    } else if (message.action === 'mediaInfo') {
      duration = message.duration || 100; // Fallback if duration is NaN
      seekSlider.max = duration;
      seekSlider.value = message.currentTime || 0;
      timeDiv.textContent = `${formatTime(message.currentTime || 0)} / ${formatTime(duration)}`;
      playPauseBtn.textContent = message.paused ? 'Play' : 'Pause';
    }
  });

  // Play/Pause button
  playPauseBtn.addEventListener('click', () => {
    if (tabId) {
      chrome.runtime.sendMessage({ action: 'togglePlayPause', tabId });
    }
  });

  // Previous Track button
  prevTrackBtn.addEventListener('click', () => {
    if (tabId) {
      chrome.runtime.sendMessage({ action: 'previousTrack', tabId });
    }
  });

  // Next Track button
  nextTrackBtn.addEventListener('click', () => {
    if (tabId) {
      chrome.runtime.sendMessage({ action: 'nextTrack', tabId });
    }
  });

  // Seek slider
  seekSlider.addEventListener('input', () => {
    if (tabId) {
      chrome.runtime.sendMessage({ action: 'seek', tabId, time: seekSlider.value });
    }
  });

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
});