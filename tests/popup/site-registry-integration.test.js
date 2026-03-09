import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

describe('Popup site registry integration - registry-based hostname support', () => {
  let dom;
  let window;
  let document;
  let mockBrowser;
  let siteRegistry;

  beforeEach(async () => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <button id="exportBtn">Export</button>
      <div id="status"></div>
    </body></html>`, { url: 'https://example.com/' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;

    siteRegistry = await import('../../src/core/siteRegistry.js');
    Object.keys(siteRegistry.registry).forEach(key => {
      delete siteRegistry.registry[key];
    });

    mockBrowser = {
      tabs: {
        query: () => Promise.resolve([{ id: 1, url: 'https://chatgpt.com/c/test' }]),
        sendMessage: () => Promise.resolve({
          conversation: {
            title: 'Test',
            turns: [{ role: 'user', content: 'Hello' }]
          }
        })
      },
      downloads: {
        download: () => Promise.resolve(123)
      }
    };
    global.browser = mockBrowser;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.browser;
    Object.keys(siteRegistry.registry).forEach(key => {
      delete siteRegistry.registry[key];
    });
  });

  it('should reject non-chatgpt domains even if registered for privacy', async () => {
    mockBrowser.tabs.query = () => Promise.resolve([{ id: 1, url: 'https://custom-ai-site.com/chat' }]);

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    assert.strictEqual(statusDiv.className, 'error', 'Should reject non-chatgpt domain');

    // Verify chatgpt.com is registered
    const supportedHosts = siteRegistry.getSupportedHosts();
    assert.ok(supportedHosts.includes('chatgpt.com'), 
      `Should have chatgpt.com registered. Got: ${supportedHosts.join(', ')}`);
  });

  it('should direct user to chatgpt.com for unsupported sites', async () => {
    mockBrowser.tabs.query = () => Promise.resolve([{ id: 1, url: 'https://example.com' }]);

    const { handleExportClick } = await import('../../src/popup/popup.js');
    
    const exportBtn = document.getElementById('exportBtn');
    const statusDiv = document.getElementById('status');

    await handleExportClick(exportBtn, statusDiv);

    assert.ok(statusDiv.textContent.includes('chatgpt.com'), 
      'Should explicitly direct user to chatgpt.com');
  });
});
