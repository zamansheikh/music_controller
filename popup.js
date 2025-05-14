document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const channelDiv = document.getElementById('channel');
  const thumbnailImg = document.getElementById('thumbnail');
  const controlsDiv = document.getElementById('controls');
  const playPauseBtn = document.getElementById('playPause');
  const prevTrackBtn = document.getElementById('prevTrack');
  const nextTrackBtn = document.getElementById('nextTrack');
  const muteBtn = document.getElementById('mute');
  const seekSlider = document.getElementById('seek');
  const timeDiv = document.getElementById('time');
  let tabId = null;
  let duration = 0;
  let isMuted = false;

  chrome.runtime.sendMessage({ action: 'getLastPlayingTab' }, (response) => {
    if (response && response.tabId) {
      tabId = response.tabId; // Restore the last playing tab ID
      chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId }); // Request media info for the tab
    } else {
      updateAudibleTab(); // Fallback to detecting audible tabs
    }
  });

  // Function to update audible tab
  function updateAudibleTab() {
    chrome.runtime.sendMessage({ action: 'getAudibleTabs' }, (response) => {
      if (response && response.tabs && response.tabs.length > 0) {
        tabId = response.tabs[0].id;
        const tab = response.tabs[0];
        statusDiv.textContent = `Playing: ${tab.title.slice(0, 30)}${tab.title.length > 30 ? '...' : ''}`;
        controlsDiv.style.display = 'flex';

        // Check if the tab is a YouTube video and request channel/thumbnail info
        if (tab.url.includes('youtube.com/watch')) {
          chrome.runtime.sendMessage({ action: 'getYouTubeInfo', tabId });
        } else {
          // Clear channel and thumbnail for non-YouTube tabs
          channelDiv.textContent = '';
          thumbnailImg.src = '';
          thumbnailImg.style.display = 'none';
        }

        // Request media info
        chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId });
      } else if (tabId) {
        // If no audible tabs are found but a tabId exists, retain the last state
        chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId }, (mediaInfo) => {
          if (mediaInfo && mediaInfo.title) {
            statusDiv.textContent = `Paused: ${mediaInfo.title.slice(0, 30)}${mediaInfo.title.length > 30 ? '...' : ''}`;
          } else {
            statusDiv.textContent = 'Paused';
          }
        });
        controlsDiv.style.display = 'flex';
      } else {
        tabId = null;
        statusDiv.textContent = 'No music detected';
        channelDiv.textContent = '';
        thumbnailImg.src = '';
        thumbnailImg.style.display = 'none';
        controlsDiv.style.display = 'none';
        timeDiv.textContent = '0:00 / 0:00';
        seekSlider.value = 0;
        const playPauseImg = playPauseBtn.querySelector('img');
        playPauseImg.src = 'play.svg'; // Reset to play icon
        playPauseImg.alt = 'Play';
        const muteImg = muteBtn.querySelector('img');
        muteImg.src = 'unmute.svg'; // Reset to unmute icon
        muteImg.alt = 'Unmute';
        isMuted = false;
      }
    });
  }

  // Update the play/pause button icon
  function updatePlayPauseIcon(isPaused) {
    const playPauseImg = playPauseBtn.querySelector('img');
    playPauseImg.src = isPaused ? 'play.svg' : 'pause.svg';
    playPauseImg.alt = isPaused ? 'Play' : 'Pause';
  }

  // Update the mute button icon
  function updateMuteIcon(isMuted) {
    const muteImg = muteBtn.querySelector('img');
    muteImg.src = isMuted ? 'mute.svg' : 'unmute.svg';
    muteImg.alt = isMuted ? 'Mute' : 'Unmute';
  }

  // Initial check for audible tabs
  updateAudibleTab();

  // Poll for audible tabs every 1 second
  setInterval(updateAudibleTab, 1000);

  // Listen for messages from background (e.g., active tab change, YouTube info, media info)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateAudibleTab') {
      updateAudibleTab();
    } else if (message.action === 'mediaInfo') {
      duration = message.duration || 100; // Fallback if duration is NaN
      seekSlider.max = duration;
      seekSlider.value = message.currentTime || 0;
      timeDiv.textContent = `${formatTime(message.currentTime || 0)} / ${formatTime(duration)}`;
      updatePlayPauseIcon(message.paused);
      updateMuteIcon(isMuted);
    } else if (message.action === 'youtubeInfo') {
      // Update channel name and thumbnail
      channelDiv.textContent = message.channel || '';
      if (message.thumbnail) {
        thumbnailImg.src = message.thumbnail;
        thumbnailImg.style.display = 'block';
      } else {
        thumbnailImg.src = '';
        thumbnailImg.style.display = 'none';
      }
    }
  });

  // Play/Pause button
  playPauseBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'togglePlayPause', tabId });
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

  // Mute button
  muteBtn.addEventListener('click', () => {
    if (tabId) {
      isMuted = !isMuted;
      updateMuteIcon(isMuted);
      chrome.runtime.sendMessage({ action: 'toggleMute', tabId, muted: isMuted });
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