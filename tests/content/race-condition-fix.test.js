import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Content script - race condition fix', () => {
  it('should register and resolve extractor in message handler', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    // Find the message handler
    const messageHandlerStart = contentCode.indexOf('browser.runtime.onMessage.addListener');
    assert.ok(messageHandlerStart !== -1, 'Should have message handler');

    // Extract message handler code
    const messageHandlerCode = contentCode.substring(messageHandlerStart);

    // Verify no early registration before message handler
    const codeBeforeHandler = contentCode.substring(0, messageHandlerStart);
    assert.ok(!codeBeforeHandler.includes('registerExtractor('),
      'Should not have registration before message handler');

    // Verify handler imports both modules
    assert.ok(messageHandlerCode.includes('siteRegistry.js'),
      'Handler should import siteRegistry');
    assert.ok(messageHandlerCode.includes('chatgptExtractor.js'),
      'Handler should import chatgptExtractor');

    // Verify handler uses Promise.all to import both modules
    assert.ok(messageHandlerCode.includes('Promise.all('),
      'Handler should use Promise.all for concurrent imports');

    // Verify handler calls registerExtractor within message handler
    assert.ok(messageHandlerCode.includes('registerExtractor(\'chatgpt.com\''),
      'Handler should register chatgpt.com extractor');

    // Verify handler calls resolveExtractor within message handler
    assert.ok(messageHandlerCode.includes('resolveExtractor(hostname)'),
      'Handler should resolve extractor by hostname');

    // Verify response shape is maintained
    assert.ok(messageHandlerCode.includes('conversation: {'),
      'Should send response with conversation field');
  });

  it('should filter non-EXTRACT_CHATGPT_CHAT messages', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    const messageHandlerStart = contentCode.indexOf('browser.runtime.onMessage.addListener');
    const messageHandlerCode = contentCode.substring(messageHandlerStart);

    // Verify early return for unsupported message types
    assert.ok(messageHandlerCode.includes('if (request.type !== \'EXTRACT_CHATGPT_CHAT\')'),
      'Should check for EXTRACT_CHATGPT_CHAT message type');
    assert.ok(messageHandlerCode.includes('return false'),
      'Should return false for unsupported types');
  });

  it('should maintain message type and response shape', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    // Verify EXTRACT_CHATGPT_CHAT message type
    assert.ok(contentCode.includes('EXTRACT_CHATGPT_CHAT'),
      'Should use EXTRACT_CHATGPT_CHAT message type');

    // Verify response shape with conversation field
    assert.ok(contentCode.includes('conversation: {'),
      'Response should have conversation field with title and turns');
  });

  it('should handle resolver errors gracefully', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    const messageHandlerStart = contentCode.indexOf('browser.runtime.onMessage.addListener');
    const messageHandlerCode = contentCode.substring(messageHandlerStart);

    // Verify error handling for unsupported hostname
    assert.ok(messageHandlerCode.includes('if (!extractor)'),
      'Should check if extractor resolved');
    assert.ok(messageHandlerCode.includes('UNSUPPORTED_HOST'),
      'Should return UNSUPPORTED_HOST error');

    // Verify error handling for extraction errors
    assert.ok(messageHandlerCode.includes('if (result.error)'),
      'Should handle extraction errors');
  });

  it('should keep chatgpt-only behavior', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    // Verify no generic domain support is added
    assert.ok(!contentCode.includes('registerExtractor(\'*\')'),
      'Should not register wildcard extractor');
    assert.ok(!contentCode.includes('registerExtractor(\'.*\')'),
      'Should not register regex extractor');

    // Verify only chatgpt.com is referenced
    const registerCount = (contentCode.match(/registerExtractor\(/g) || []).length;
    assert.strictEqual(registerCount, 1,
      'Should only register one extractor (chatgpt.com)');
  });

  it('should use minimal and readable code structure', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    // Count imports - should be minimal (2 concurrent imports in Promise.all)
    const importStatements = contentCode.match(/import\(browser\.runtime\.getURL\(/g) || [];
    assert.ok(importStatements.length <= 2,
      'Should have minimal imports (2 in Promise.all)');

    // Verify no nested callbacks (should use Promise.all for simplicity)
    const messageHandlerStart = contentCode.indexOf('browser.runtime.onMessage.addListener');
    const messageHandlerCode = contentCode.substring(messageHandlerStart);
    
    // Should not have deeply nested .then() chains
    const thenCount = (messageHandlerCode.match(/\.then\(/g) || []).length;
    assert.ok(thenCount <= 2,
      'Should minimize nested .then() chains');
  });

  it('should not do async registration at module load', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    // Find first line of actual code after comments and if-check
    const lines = contentCode.split('\n');
    
    let firstCodeLineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('//') && !line.startsWith('if (typeof browser')) {
        firstCodeLineIndex = i;
        break;
      }
    }

    // Verify first code line is the message handler setup
    const firstCodeSection = lines.slice(firstCodeLineIndex, firstCodeLineIndex + 5).join('\n');
    assert.ok(firstCodeSection.includes('browser.runtime.onMessage.addListener'),
      'First code should be message handler listener, not async registration');
  });

  it('should handle hostname dynamically', () => {
    const contentPath = join(__dirname, '../../src/content/content.js');
    const contentCode = readFileSync(contentPath, 'utf-8');

    const messageHandlerStart = contentCode.indexOf('browser.runtime.onMessage.addListener');
    const messageHandlerCode = contentCode.substring(messageHandlerStart);

    // Verify hostname is retrieved dynamically
    assert.ok(messageHandlerCode.includes('window.location.hostname'),
      'Should use dynamic hostname from window.location');

    // Verify hostname is passed to resolve and extract
    assert.ok(messageHandlerCode.includes('resolveExtractor(hostname)'),
      'Should pass hostname to resolveExtractor');
  });
});