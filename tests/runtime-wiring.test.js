import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const manifestPath = join(projectRoot, 'manifest.json');
const popupHtmlPath = join(projectRoot, 'src/popup/popup.html');

describe('Runtime wiring - extension entry points', () => {
  describe('manifest content script entry', () => {
    it('should point to classic-compatible content.js entry point', () => {
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const contentScript = manifest.content_scripts?.[0];
      assert.ok(contentScript, 'Should have content_scripts defined');

      const entryFile = contentScript.js?.[0];
      assert.strictEqual(
        entryFile,
        'src/content/content.js',
        'Content script entry should point to classic-compatible content.js, not ESM module'
      );
    });
  });

  describe('popup HTML module loading', () => {
    it('should load popup.js as an ES module', () => {
      const htmlContent = readFileSync(popupHtmlPath, 'utf-8');

      assert.ok(
        htmlContent.includes('type="module"'),
        'popup.html should load popup.js with type="module" attribute'
      );

      assert.ok(
        htmlContent.match(/<script[^>]*type="module"[^>]*>/),
        'Should have script tag with type="module"'
      );
    });
  });

  describe('manifest web_accessible_resources', () => {
    it('should declare ESM modules as web accessible for dynamic loading', () => {
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const resources = manifest.web_accessible_resources || [];

      assert.ok(
        resources.length > 0,
        'Should have web_accessible_resources defined for ESM module loading'
      );

      const hasChatgptExtractor = resources.some(resource =>
        resource?.resources?.includes('src/content/chatgptExtractor.js')
      );

      assert.ok(
        hasChatgptExtractor,
        'web_accessible_resources should include src/content/chatgptExtractor.js'
      );
    });

    it('should include siteRegistry.js in web_accessible_resources for content script dynamic import', () => {
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);

      const resources = manifest.web_accessible_resources || [];

      const hasSiteRegistry = resources.some(resource =>
        resource?.resources?.includes('src/core/siteRegistry.js')
      );

      assert.ok(
        hasSiteRegistry,
        'web_accessible_resources must include src/core/siteRegistry.js for content script dynamic import'
      );
    });
  });
});

describe('Message protocol - content script communication', () => {
  let mockDocument;

  beforeEach(() => {
    // Setup mock document for popup.js import
    mockDocument = {
      readyState: 'complete',
      getElementById: () => ({ addEventListener: () => {} })
    };
    global.document = mockDocument;
  });

  afterEach(() => {
    delete global.document;
  });

  it('should use EXTRACT_CHATGPT_CHAT message type for content script messages', async () => {
    const { handleExportClick } = await import('../src/popup/popup.js');

    const mockTabs = {
      query: () => Promise.resolve([{ id: 1, url: 'https://chatgpt.com/c/test' }])
    };

    // Register chatgpt.com in site registry
    const siteRegistry = await import('../src/core/siteRegistry.js');
    Object.keys(siteRegistry.registry).forEach(key => {
      delete siteRegistry.registry[key];
    });
    siteRegistry.registerExtractor('chatgpt.com', () => ({
      turns: [{ role: 'user', content: 'test' }],
      title: 'Test'
    }));

    const sendMessageCalls = [];
    const mockTabsWithTracking = {
      query: mockTabs.query,
      sendMessage: ((tabId, message) => {
        sendMessageCalls.push({ tabId, message });
        return Promise.resolve({
          error: { code: 'TEST', message: 'test' }
        });
      }).bind(null)
    };

    const mockDownloads = {
      download: () => Promise.resolve(123)
    };

    global.browser = { tabs: mockTabsWithTracking, downloads: mockDownloads };

    const exportBtn = { disabled: false };
    const statusDiv = { textContent: '', className: '' };

    try {
      await handleExportClick(exportBtn, statusDiv);
    } catch (e) {
      // Expected to fail due to missing DOM
    }

    assert.ok(
      sendMessageCalls.length > 0,
      'Should send message to content script'
    );

    const message = sendMessageCalls[0].message;
    assert.strictEqual(
      message.type,
      'EXTRACT_CHATGPT_CHAT',
      'Message type should be EXTRACT_CHATGPT_CHAT'
    );
  });

  it('should expect conversation response shape from content script', async () => {
    const { handleExportClick } = await import('../src/popup/popup.js');

    // Register chatgpt.com in site registry
    const siteRegistry = await import('../src/core/siteRegistry.js');
    Object.keys(siteRegistry.registry).forEach(key => {
      delete siteRegistry.registry[key];
    });
    siteRegistry.registerExtractor('chatgpt.com', () => ({
      turns: [{ role: 'user', content: 'test' }],
      title: 'Test'
    }));

    const mockTabs = {
      query: () => Promise.resolve([{ id: 1, url: 'https://chatgpt.com/c/test' }])
    };

    const mockTabsWithTracking = {
      query: mockTabs.query,
      sendMessage: ((tabId, message) => {
        return Promise.resolve({
          conversation: {
            title: 'Test Chat',
            turns: [
              { role: 'user', content: 'Hello' },
              { role: 'assistant', content: 'Hi' }
            ]
          }
        });
      }).bind(null)
    };

    const downloadsCalled = [];
    const mockDownloads = {
      download: (params) => {
        downloadsCalled.push(params);
        return Promise.resolve(123);
      }
    };

    global.browser = { tabs: mockTabsWithTracking, downloads: mockDownloads };

    const exportBtn = { disabled: false };
    const statusDiv = { textContent: '', className: '' };

    try {
      await handleExportClick(exportBtn, statusDiv);
    } catch (e) {
      // Expected to fail due to missing DOM
    }

    assert.ok(
      downloadsCalled.length > 0,
      'Should attempt download after receiving conversation'
    );

    const downloadParams = downloadsCalled[0];
    assert.ok(
      downloadParams.url.startsWith('blob:'),
      'Should download from blob URL'
    );
    assert.ok(
      downloadParams.filename.endsWith('.md'),
      'Should have markdown filename'
    );
  });
});
