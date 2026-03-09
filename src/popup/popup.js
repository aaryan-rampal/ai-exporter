// Popup script for ChatGPT Exporter
// Handles export button click and coordinates extraction

import { renderMarkdown, toFileName } from '../core/markdownRenderer.js';
import { isSupported, registerExtractor } from '../core/siteRegistry.js';

// Register chatgpt.com in popup context as supported-only marker
// Content script handles actual extraction via message protocol
registerExtractor('chatgpt.com', () => ({}));

// Export handler function for testing and direct invocation
export async function handleExportClick(exportBtn, statusDiv) {
  exportBtn.disabled = true;
  statusDiv.textContent = 'Extracting conversation...';
  statusDiv.className = '';

  try {
    // Get active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    // Extract hostname from URL
    let hostname = '';
    try {
      const urlObj = new URL(activeTab.url);
      hostname = urlObj.hostname;
    } catch (e) {
      statusDiv.textContent = 'Invalid URL';
      statusDiv.className = 'error';
      return;
    }

    // Check if hostname is supported via site registry
    if (!isSupported(hostname)) {
      statusDiv.textContent = 'Please navigate to chatgpt.com to export conversations';
      statusDiv.className = 'error';
      return;
    }

    // Request extraction from content script
    const response = await browser.tabs.sendMessage(activeTab.id, {
      type: 'EXTRACT_CHATGPT_CHAT'
    });

    if (!response || typeof response !== 'object') {
      statusDiv.textContent = 'Invalid response from content script';
      statusDiv.className = 'error';
      return;
    }

    if (response.error) {
      const errorMessage = typeof response.error === 'object' && response.error.message
        ? response.error.message
        : 'Failed to extract conversation';
      statusDiv.textContent = errorMessage;
      statusDiv.className = 'error';
      return;
    }

    // Render markdown from conversation data
    const markdown = renderMarkdown(response.conversation);
    const filename = toFileName(response.conversation.title);

    // Download the markdown
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    await browser.downloads.download({
      url: url,
      filename: filename,
      saveAs: false
    });

    statusDiv.textContent = 'Export complete!';
    statusDiv.className = 'success';

    URL.revokeObjectURL(url);
  } catch (error) {
    statusDiv.textContent = `Error: ${error.message}`;
    statusDiv.className = 'error';
  } finally {
    exportBtn.disabled = false;
  }
}

// Setup event listener when DOM is ready
let isSetup = false;
function setupEventListeners() {
  if (isSetup) return;
  isSetup = true;

  const exportBtn = document.getElementById('exportBtn');
  const statusDiv = document.getElementById('status');

  if (exportBtn && statusDiv) {
    exportBtn.addEventListener('click', () => handleExportClick(exportBtn, statusDiv));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEventListeners);
} else {
  setupEventListeners();
}

