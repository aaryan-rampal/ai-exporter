// Background script for ChatGPT Exporter
// Minimal implementation - most logic is in content scripts and popup

// Listen for installation
browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('ChatGPT Exporter installed');
  }
});

// Optional: Handle any background tasks
// Currently all functionality is handled by popup and content scripts
