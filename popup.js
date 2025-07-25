document.addEventListener('DOMContentLoaded', () => {
  const titleDiv = document.getElementById('video-title');
  const channelDiv = document.getElementById('channel');
  const thumbnailImg = document.getElementById('thumbnail');
  const controlsDiv = document.getElementById('controls');
  const playPauseBtn = document.getElementById('playPause');
  const prevTrackBtn = document.getElementById('prevTrack');
  const nextTrackBtn = document.getElementById('nextTrack');
  const muteBtn = document.getElementById('mute');
  const seekSlider = document.getElementById('seek');
  const currentTimeDiv = document.getElementById('current-time');
  const totalTimeDiv = document.getElementById('total-time');


  let tabId = null;
  let duration = 0;
  let isMuted = false;
  let updateTimeInterval = null; // Interval for updating current time dynamically

  chrome.runtime.sendMessage({ action: 'getLastPlayingTab' }, (response) => {
    if (response && response.tabId) {
      tabId = response.tabId; // Restore the last playing tab ID
      chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId }); // Request media info for the tab
    } else {
      updateAudibleTab(); // Fallback to detecting audible tabs
    }
  });

  // Retrieve last saved media info
  chrome.runtime.sendMessage({ action: 'getLastMediaInfo' }, (lastMediaInfo) => {
    if (lastMediaInfo && lastMediaInfo.title) {
      titleDiv.textContent = `Paused: ${lastMediaInfo.title.slice(4, 20)}${lastMediaInfo.title.length > 20 ? '...' : ''}`;
      channelDiv.textContent = lastMediaInfo.channel || 'Unknown Channel';
      if (lastMediaInfo.thumbnail) {
        thumbnailImg.src = lastMediaInfo.thumbnail;
        thumbnailImg.style.display = 'block';
      } else {
        thumbnailImg.src = './ThumbnailPoster.png';
        thumbnailImg.style.display = 'flex';
      }
      controlsDiv.style.display = 'flex';
    }
  });

  // Function to update audible tab
  function updateAudibleTab() {
    chrome.runtime.sendMessage({ action: 'getAudibleTabs' }, (response) => {
      if (response && response.tabs && response.tabs.length > 0) {
        tabId = response.tabs[0].id;
        const tab = response.tabs[0];
        chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId }, (mediaInfo) => {
          channelDiv.textContent = mediaInfo.channel || 'Unknown Channel';
        });
        titleDiv.textContent = `Playing: ${tab.title.slice(4, 20)}${tab.title.length > 20 ? '...' : ''}`;
        channelDiv.textContent = mediaInfo.channel || 'Unknown Channel';
        controlsDiv.style.display = 'flex';

        // Check if the tab is a YouTube video and request channel/thumbnail info
        if (tab.url.includes('youtube.com/watch')) {
          chrome.runtime.sendMessage({ action: 'getYouTubeInfo', tabId });
        } else {
          // Clear channel and thumbnail for non-YouTube tabs
          channelDiv.textContent = mediaInfo.channel || 'Unknown Channel';
          thumbnailImg.src = './ThumbnailPoster.png';
          thumbnailImg.style.display = 'flex';
        }

        // Request media info
        chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId });
      } else if (tabId) {
        // If no audible tabs are found but a tabId exists, retain the last state
        chrome.runtime.sendMessage({ action: 'getMediaInfo', tabId }, (mediaInfo) => {
          if (mediaInfo && mediaInfo.title) {
            titleDiv.textContent = `${mediaInfo.paused ? 'Paused' : 'Playing'}: ${mediaInfo.title.slice(4, 20)}${mediaInfo.title.length > 20 ? '...' : ''}`;
            channelDiv.textContent = mediaInfo.channel || 'Unknown Channel';
            if (mediaInfo.thumbnail) {
              thumbnailImg.src = mediaInfo.thumbnail;
              thumbnailImg.style.display = 'block';
            } else {
              thumbnailImg.src = './ThumbnailPoster.png';
              thumbnailImg.style.display = 'flex';
            }
          } else {
            titleDiv.textContent = 'No music detected';
            channelDiv.textContent = 'Unknown Channel';
          }
        });
        controlsDiv.style.display = 'flex';
      } else {
        tabId = null;
        titleDiv.textContent = 'No music detected';
        channelDiv.textContent = 'Unknown Channel';
        thumbnailImg.src = './ThumbnailPoster.png';
        thumbnailImg.style.display = 'flex';
        controlsDiv.style.display = 'none';
        currentTimeDiv.textContent = '0:00';
        totalTimeDiv.textContent = '0:00';
        seekSlider.value = 0;
        const playPauseImg = playPauseBtn.querySelector('img');
        playPauseImg.src = 'play.svg';
        playPauseImg.alt = 'Play';
        const muteImg = muteBtn.querySelector('img');
        muteImg.src = 'unmute.svg';
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
      currentTimeDiv.textContent = formatTime(message.currentTime || 0);
      totalTimeDiv.textContent = formatTime(duration);
      updatePlayPauseIcon(message.paused);
      updateMuteIcon(isMuted);
      titleDiv.textContent = `${message.paused ? 'Paused' : 'Playing'}: ${message.title.slice(4, 20)}${message.title.length > 20 ? '...' : ''}`;
      const value = (seekSlider.value / seekSlider.max) * 100;
      seekSlider.style.background = `linear-gradient(to right, #FF245A ${value}%, #df8c8c ${value}%)`;
      // Ensure channel name is updated properly in the mediaInfo handler
      if (message.channel) {
        channelDiv.textContent = message.channel;
      } else {
        channelDiv.textContent = 'Unknown Channel';
      }

      if (message.thumbnail) {
        thumbnailImg.src = message.thumbnail;
        thumbnailImg.style.display = 'block';
      } else {
        thumbnailImg.src = './ThumbnailPoster.png';
        thumbnailImg.style.display = 'none';
      }

      // Clear any existing interval if paused
      if (message.paused) {
        clearInterval(updateTimeInterval);
        updateTimeInterval = null;
      } else {
        // Start interval to update current time dynamically
        if (!updateTimeInterval) {
          updateTimeInterval = setInterval(() => {
            const newTime = parseFloat(seekSlider.value) + 1; // Increment by 1 second
            if (newTime <= duration) {
              seekSlider.value = newTime;
              currentTimeDiv.textContent = formatTime(newTime);
              const value = (newTime / seekSlider.max) * 100;
              seekSlider.style.background = `linear-gradient(to right, #FF245A ${value}%, #df8c8c ${value}%)`;
            } else {
              clearInterval(updateTimeInterval);
              updateTimeInterval = null;

            }
          }, 1000);
        }
      }
    } else if (message.action === 'youtubeInfo') {
      // Update channel name and thumbnail
      channelDiv.textContent = message.channel || 'Unknown Channel';
      if (message.thumbnail) {
        thumbnailImg.src = message.thumbnail;
        thumbnailImg.style.display = 'block';
      } else {
        thumbnailImg.src = './ThumbnailPoster.png';
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
    const value = (seekSlider.value / seekSlider.max) * 100;
    seekSlider.style.background = `linear-gradient(to right, #FF245A ${value}%, #df8c8c ${value}%)`;
  });

  // Add an event listener to dynamically update the seek bar's background gradient
  seekSlider.addEventListener('input', () => {
    const value = (seekSlider.value / seekSlider.max) * 100;
    seekSlider.style.background = `linear-gradient(to right, #FF245A ${value}%, #df8c8c ${value}%)`;
  });

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
});