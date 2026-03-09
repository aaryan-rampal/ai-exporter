import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';

const originalGlobals = {
  window: global.window,
  document: global.document,
  location: global.location,
  browser: global.browser
};

afterEach(() => {
  global.window = originalGlobals.window;
  global.document = originalGlobals.document;
  global.location = originalGlobals.location;
  global.browser = originalGlobals.browser;
});

describe('ChatGPT Extractor - Error Conditions', () => {
  it('should return UNSUPPORTED_PAGE error when not on chatgpt.com', async () => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'https://example.com/page'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.location = dom.window.location;

    // Import the extractor after setting up globals
    const { extractChatGptConversation } = await import('../../src/content/chatgptExtractor.js');

    const result = extractChatGptConversation();

    assert.ok(result.error, 'Should return error result');
    assert.strictEqual(result.error.code, 'UNSUPPORTED_PAGE');
    assert.ok(result.error.message.includes('chatgpt.com'));
  });

  it('should return NO_CONVERSATION error when no message nodes found', async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head><title>Test Page</title></head>
      <body>
        <div>Some content but no conversation</div>
      </body>
      </html>
    `, {
      url: 'https://chatgpt.com/c/test-conversation'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.location = dom.window.location;
    global.browser = { runtime: { onMessage: { addListener: () => {} } } };

    // Import the extractor after setting up globals
    const { extractChatGptConversation } = await import('../../src/content/chatgptExtractor.js');

    const result = extractChatGptConversation();

    assert.ok(result.error, 'Should return error result');
    assert.strictEqual(result.error.code, 'NO_CONVERSATION');
    assert.ok(result.error.message.includes('No conversation detected'));
  });

  it('should return NO_CONVERSATION error when only empty turns found', async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
      <head><title>Test Page</title></head>
      <body>
        <div data-message-author-role="user">
          <div data-testid="message-content"></div>
        </div>
        <div data-message-author-role="assistant">
          <div data-testid="message-content"></div>
        </div>
      </body>
      </html>
    `, {
      url: 'https://chatgpt.com/c/test-conversation'
    });

    global.window = dom.window;
    global.document = dom.window.document;
    global.location = dom.window.location;
    global.browser = { runtime: { onMessage: { addListener: () => {} } } };

    // Import the extractor after setting up globals
    const { extractChatGptConversation } = await import('../../src/content/chatgptExtractor.js');

    const result = extractChatGptConversation();

    assert.ok(result.error, 'Should return error result');
    assert.strictEqual(result.error.code, 'NO_CONVERSATION');
    assert.ok(result.error.message.includes('No conversation content'));
  });
});
