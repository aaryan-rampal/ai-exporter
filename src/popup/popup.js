// Popup script for ChatGPT Exporter
// Handles export button click and coordinates extraction

document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportBtn');
  const statusDiv = document.getElementById('status');

  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    statusDiv.textContent = 'Extracting conversation...';
    statusDiv.className = '';

    try {
      // Get active tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.url.includes('chatgpt.com')) {
        statusDiv.textContent = 'Please navigate to chatgpt.com first';
        statusDiv.className = 'error';
        return;
      }

      // Request extraction from content script
      const response = await browser.tabs.sendMessage(activeTab.id, {
        type: 'EXPORT_CHATGPT_CHAT'
      });

      if (response.error) {
        statusDiv.textContent = response.error.message;
        statusDiv.className = 'error';
        return;
      }

      // Download the markdown
      const blob = new Blob([response.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);

      await browser.downloads.download({
        url: url,
        filename: response.filename,
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
  });
});
