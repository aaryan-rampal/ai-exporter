import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

describe('Popup export flow - mocked flow tests', () => {
  let dom;
  let window;
  let document;
  let callLog;
  let mockBrowser;

  beforeEach(async () => {
    // Setup JSDOM for DOM testing
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <button id="exportBtn">Export</button>
      <div id="status"></div>
    </body></html>`, { url: 'https://chatgpt.com/c/test' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    // Track calls
    callLog = [];

    // Mock browser.tabs with call tracking
    const mockTabs = {
      query: ((opts) => {
        callLog.push({ api: 'tabs.query', args: [opts] });
        return Promise.resolve([
          { id: 1, url: 'https://chatgpt.com/c/test' }
        ]);
      }).bind(null),
      sendMessage: ((tabId, message) => {
        callLog.push({ api: 'tabs.sendMessage', args: [tabId, message] });
        return Promise.resolve({
          conversation: {
            title: 'Test Chat',
            turns: [
              { role: 'user', content: 'Hello' },
              { role: 'assistant', content: 'Hi there!' }
            ]
          }
        });
      }).bind(null)
    };

    // Mock browser.downloads with call tracking
    const mockDownloads = {
      download: ((downloadParams) => {
        callLog.push({ api: 'downloads.download', args: [downloadParams] });
        return Promise.resolve(123);
      }).bind(null)
    };

    // Mock browser object
    mockBrowser = {
      tabs: mockTabs,
      downloads: mockDownloads
    };
    global.browser = mockBrowser;

    // Reset call log
    callLog = [];
    
    // Clear module cache and register chatgpt.com in site registry
    const siteRegistry = await import('../../src/core/siteRegistry.js');
    Object.keys(siteRegistry.registry).forEach(key => {
      delete siteRegistry.registry[key];
    });
    siteRegistry.registerExtractor('chatgpt.com', () => ({
      turns: [{ role: 'user', content: 'test' }],
      title: 'Test'
    }));
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.browser;
    callLog = [];
  });

  it('should query active tab on export click', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');
    
    // Call handler directly
    await handleExportClick(exportBtn, statusDiv);

    const queryCalls = callLog.filter(call => call.api === 'tabs.query');
    assert.ok(queryCalls.length > 0, `tabs.query should be called. Call log: ${JSON.stringify(callLog)}`);
    assert.deepStrictEqual(queryCalls[0].args[0], {
      active: true,
      currentWindow: true
    });
  });

  it('should send message to content script with correct type', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');

    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    const sendMessageCalls = callLog.filter(call => call.api === 'tabs.sendMessage');
    assert.ok(sendMessageCalls.length > 0, `tabs.sendMessage should be called. Call log: ${JSON.stringify(callLog)}`);
    assert.strictEqual(sendMessageCalls[0].args[0], 1);
    assert.deepStrictEqual(sendMessageCalls[0].args[1], {
      type: 'EXTRACT_CHATGPT_CHAT'
    });
  });

  it('should download rendered markdown with correct parameters', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');
    
    await handleExportClick(exportBtn, statusDiv);

    const downloadCalls = callLog.filter(call => call.api === 'downloads.download');
    assert.ok(downloadCalls.length > 0, `downloads.download should be called. Call log: ${JSON.stringify(callLog)}`);
    
    const downloadParams = downloadCalls[0].args[0];
    assert.ok(downloadParams.url.startsWith('blob:'));
    assert.ok(downloadParams.filename.endsWith('.md'));
    assert.strictEqual(downloadParams.saveAs, false);
  });

  it('should maintain call sequence: query -> sendMessage -> download', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');
    
    await handleExportClick(exportBtn, statusDiv);

    assert.ok(callLog.length >= 3, `Should have at least 3 calls. Got ${callLog.length}: ${JSON.stringify(callLog)}`);
    
    const apiSequence = callLog.map(call => call.api);
    assert.ok(apiSequence.includes('tabs.query'));
    assert.ok(apiSequence.includes('tabs.sendMessage'));
    assert.ok(apiSequence.includes('downloads.download'));

    const queryIndex = apiSequence.indexOf('tabs.query');
    const sendMessageIndex = apiSequence.indexOf('tabs.sendMessage');
    const downloadIndex = apiSequence.indexOf('downloads.download');

    assert.ok(queryIndex >= 0, 'query should be in sequence');
    assert.ok(sendMessageIndex >= 0, 'sendMessage should be in sequence');
    assert.ok(downloadIndex >= 0, 'download should be in sequence');
    assert.ok(queryIndex < sendMessageIndex, 'query should happen before sendMessage');
    assert.ok(sendMessageIndex < downloadIndex, 'sendMessage should happen before download');
  });

  it('should disable button during export', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    assert.strictEqual(exportBtn.disabled, false);

    // Start the async operation
    const promise = handleExportClick(exportBtn, statusDiv);
    
    // Check while operation is in progress
    assert.strictEqual(exportBtn.disabled, true);
    assert.strictEqual(statusDiv.textContent, 'Extracting conversation...');
    
    // Wait for completion
    await promise;
  });

  it('should re-enable button after successful export', async () => {
    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');
    
    await handleExportClick(exportBtn, statusDiv);

    assert.strictEqual(exportBtn.disabled, false);
  });
});
