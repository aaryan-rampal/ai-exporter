import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

describe('Popup error states - DOM-based validation', () => {
  let dom;
  let window;
  let document;
  let mockBrowser;

  beforeEach(async () => {
    // Setup JSDOM for DOM testing  
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <button id="exportBtn">Export</button>
      <div id="status"></div>
    </body></html>`, { url: 'https://example.com/' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Setup mock browser
    mockBrowser = {
      tabs: {
        query: () => Promise.resolve([{ id: 1, url: 'https://example.com' }]),
        sendMessage: () => Promise.reject(new Error('No content script'))
      },
      downloads: {
        download: () => Promise.resolve(123)
      }
    };
    global.browser = mockBrowser;

    // Register chatgpt.com in site registry for chatgpt.com tests
    const siteRegistry = await import('../../src/core/siteRegistry.js');
    siteRegistry.registerExtractor('chatgpt.com', () => ({
      turns: [{ role: 'user', content: 'test' }],
      title: 'Test'
    }));
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.browser;
  });

  it('should update status text for unsupported page', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    const textMatch = statusDiv.textContent.includes('chatgpt.com') || 
                      statusDiv.textContent.toLowerCase().includes('unsupported') ||
                      statusDiv.textContent.includes('Please navigate') ||
                      statusDiv.textContent.includes('first') ||
                      statusDiv.textContent.includes('navigate');
    assert.ok(textMatch, `Expected error message but got: "${statusDiv.textContent}"`);
    assert.strictEqual(statusDiv.className, 'error');
  });

  it('should update status text and class for content-script error response', async () => {
    mockBrowser.tabs.query = () => Promise.resolve([{ id: 1, url: 'https://chatgpt.com/c/test' }]);
    mockBrowser.tabs.sendMessage = () => Promise.resolve({
      error: {
        code: 'NO_CONVERSATION',
        message: 'No conversation detected on this page'
      }
    });

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    assert.ok(statusDiv.textContent.length > 0, 'Status should have content');
    assert.strictEqual(statusDiv.className, 'error');
  });

  it('should update status text for thrown exception', async () => {
    mockBrowser.tabs.query = () => Promise.reject(new Error('Network error'));

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    assert.ok(statusDiv.textContent.toLowerCase().includes('error') ||
              statusDiv.textContent.toLowerCase().includes('network') ||
              statusDiv.textContent.length > 0);
    assert.strictEqual(statusDiv.className, 'error');
  });

  it('should re-enable button after error', async () => {
    mockBrowser.tabs.query = () => Promise.resolve([{ id: 1, url: 'https://example.com' }]);
    mockBrowser.tabs.sendMessage = () => Promise.reject(new Error('Error'));

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');

    assert.strictEqual(exportBtn.disabled, false);

    await handleExportClick(exportBtn, document.getElementById('status'));

    assert.strictEqual(exportBtn.disabled, false);
  });

  it('should set error class on status element for errors', async () => {
    mockBrowser.tabs.sendMessage = () => Promise.resolve({
      error: { code: 'NO_CONVERSATION', message: 'No conversation' }
    });

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    assert.ok(statusDiv.className.includes('error'));
  });

  it('should set success class on successful export', async () => {
    mockBrowser.tabs.query = () => Promise.resolve([{ id: 1, url: 'https://chatgpt.com/c/test' }]);
    mockBrowser.tabs.sendMessage = () => Promise.resolve({
      conversation: {
        title: 'Test',
        turns: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' }
        ]
      }
    });

    const { handleExportClick } = await import('../../src/popup/popup.js');

    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    assert.ok(statusDiv.className.includes('success'));
  });

  it('should show extracting status during export', async () => {
    mockBrowser.tabs.query = () => new Promise(resolve => {
      setTimeout(() => resolve([{ id: 1, url: 'https://chatgpt.com/c/test' }]), 50);
    });
    mockBrowser.tabs.sendMessage = () => new Promise(resolve => {
      setTimeout(() => resolve({
        conversation: {
          title: 'Test',
          turns: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi' }
          ]
        }
      }), 50);
    });

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    // Start the export
    const promise = handleExportClick(exportBtn, statusDiv);

    // Check immediately after starting
    assert.strictEqual(statusDiv.textContent, 'Extracting conversation...');

    // Wait for completion
    await promise;
  });
});
