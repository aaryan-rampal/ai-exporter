import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Content script - registry resolve flow', () => {
  let siteRegistry;

  beforeEach(async () => {
    // Import siteRegistry
    siteRegistry = await import('../../src/core/siteRegistry.js');

    // Clear registry
    Object.keys(siteRegistry.registry).forEach(key => {
      delete siteRegistry.registry[key];
    });
  });

  afterEach(() => {
    // Clear registry
    if (siteRegistry) {
      Object.keys(siteRegistry.registry).forEach(key => {
        delete siteRegistry.registry[key];
      });
    }
  });

  it('should maintain EXTRACT_CHATGPT_CHAT message type for communication', async () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');
    
    assert.ok(contentCode.includes('EXTRACT_CHATGPT_CHAT'),
      'Content script should use EXTRACT_CHATGPT_CHAT message type for communication');
  });

  it('should use registry resolve pattern instead of direct extractor calls', async () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    const messageHandlerStart = contentCode.indexOf('browser.runtime.onMessage');
    
    assert.ok(messageHandlerStart !== -1,
      'Content script should have a message handler using browser.runtime.onMessage');

    if (messageHandlerStart !== -1) {
      const messageHandlerCode = contentCode.substring(messageHandlerStart);
      
      const hasResolveCall = messageHandlerCode.includes('resolveExtractor(');
      const hostnameCheck = messageHandlerCode.includes('const hostname = window.location.hostname');
      
      assert.ok(hasResolveCall && hostnameCheck,
        'Message handler should use resolveExtractor with dynamic hostname lookup, not direct extractor calls');
    }
  });

  it('should maintain clean registry resolve flow without redundant imports', async () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    const importCount = (contentCode.match(/import\(browser\.runtime\.getURL\(/g) || []).length;
    
    assert.ok(importCount <= 3,
      'Content script should not have excessive imports (max 3: 2 module load registrations + 1 message handler)');
  });

  it('should support chatgpt.com as a supported hostname', () => {
    siteRegistry.registerExtractor('chatgpt.com', () => ({
      title: 'Test',
      turns: []
    }));

    assert.ok(siteRegistry.isSupported('chatgpt.com'),
      'chatgpt.com should be supported');

    assert.ok(siteRegistry.resolveExtractor('chatgpt.com'),
      'chatgpt.com should have a registered extractor');

    assert.ok(siteRegistry.resolveExtractor('www.chatgpt.com'),
      'www.chatgpt.com should resolve to registered extractor');

    assert.ok(!siteRegistry.resolveExtractor('other.com'),
      'other.com should not resolve to chatgpt.com extractor');
  });

  it('should support subdomain matching for registered hostnames', () => {
    siteRegistry.registerExtractor('chatgpt.com', () => ({
      title: 'Test',
      turns: []
    }));

    assert.ok(siteRegistry.isSupported('chatgpt.com'),
      'Exact hostname should be supported');
    assert.ok(siteRegistry.isSupported('www.chatgpt.com'),
      'www subdomain should be supported');
    assert.ok(siteRegistry.resolveExtractor('api.chatgpt.com'),
      'api subdomain should be supported');
    
    assert.ok(!siteRegistry.isSupported('chat.openai.com'),
      'chat.openai.com should not match chatgpt.com registry');
    assert.ok(!siteRegistry.isSupported('other.com'),
      'Unrelated domain should not be supported');
  });

  it('should handle registered extractors that return error results', () => {
    siteRegistry.registerExtractor('test.com', () => ({
      error: { code: 'EXTRACT_ERROR', message: 'Test error' }
    }));

    const extractor = siteRegistry.resolveExtractor('test.com');
    assert.ok(extractor, 'Should resolve registered extractor');

    const result = extractor();
    assert.ok(result.error, 'Should return error result');
    assert.strictEqual(result.error.code, 'EXTRACT_ERROR',
      'Should preserve error code');
    assert.strictEqual(result.error.message, 'Test error',
      'Should preserve error message');
  });

  it('should return null for unregistered hostnames via resolveExtractor', () => {
    const result = siteRegistry.resolveExtractor('unregistered.com');
    assert.strictEqual(result, null,
      'Should return null for unregistered hostname');
  });

  it('should maintain response shape with conversation structure', async () => {
    const extractor = () => ({
      title: 'Test Conversation',
      turns: [{ role: 'user', content: 'Hello' }]
    });

    siteRegistry.registerExtractor('test.chatgpt.com', extractor);

    const resolved = siteRegistry.resolveExtractor('test.chatgpt.com');
    const result = resolved();

    assert.ok(result.title, 'Should have title field');
    assert.ok(Array.isArray(result.turns), 'Should have turns array');
    assert.ok(result.turns[0].role, 'Turns should have role');
    assert.ok(result.turns[0].content, 'Turns should have content');
  });
});
