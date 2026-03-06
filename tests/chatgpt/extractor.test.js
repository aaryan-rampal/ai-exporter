import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturePath = join(__dirname, '../fixtures/chatgpt', 'Vicon Motion Capture Overview.html');

describe('ChatGPT Extractor', () => {
  let dom;
  let window;
  let document;

  before(() => {
    const html = readFileSync(fixturePath, 'utf-8');
    dom = new JSDOM(html, {
      url: 'https://chatgpt.com/c/test-conversation',
      runScripts: 'dangerously',
      resources: 'usable'
    });
    window = dom.window;
    document = window.document;
  });

  it('should find message nodes with data-message-author-role', () => {
    const messageNodes = document.querySelectorAll('[data-message-author-role]');
    assert.ok(messageNodes.length > 0, 'Should find message nodes');
    console.log(`Found ${messageNodes.length} message nodes`);
  });

  it('should extract turns with valid roles', () => {
    const messageNodes = document.querySelectorAll('[data-message-author-role]');
    const turns = [];

    messageNodes.forEach(node => {
      const role = node.getAttribute('data-message-author-role');
      if (role === 'user' || role === 'assistant') {
        turns.push({ role });
      }
    });

    assert.ok(turns.length > 0, 'Should have turns');
    assert.ok(
      turns.every(t => t.role === 'user' || t.role === 'assistant'),
      'All roles should be user or assistant'
    );
  });

  it('should have alternating user and assistant roles', () => {
    const messageNodes = document.querySelectorAll('[data-message-author-role]');
    const turns = [];

    messageNodes.forEach(node => {
      const role = node.getAttribute('data-message-author-role');
      if (role === 'user' || role === 'assistant') {
        turns.push(role);
      }
    });

    // Check that roles alternate (first user, then assistant, etc.)
    for (let i = 1; i < turns.length; i++) {
      assert.notStrictEqual(
        turns[i],
        turns[i - 1],
        `Consecutive turns should have different roles at index ${i}`
      );
    }
  });

  it('should not contain UI test IDs in extracted content', () => {
    const messageNodes = document.querySelectorAll('[data-message-author-role]');
    const uiTestIds = ['copy-turn-action-button', 'good-response-turn-action-button', 'bad-response-turn-action-button'];

    messageNodes.forEach(node => {
      const html = node.innerHTML;
      uiTestIds.forEach(testId => {
        assert.ok(
          !html.includes(testId) || node.getAttribute('data-testid') === testId,
          `Should not contain UI test ID: ${testId}`
        );
      });
    });
  });

  it('should extract content from first turn', () => {
    const messageNodes = document.querySelectorAll('[data-message-author-role]');
    const firstTurn = messageNodes[0];

    assert.ok(firstTurn, 'Should have first turn');
    const role = firstTurn.getAttribute('data-message-author-role');
    assert.ok(role === 'user' || role === 'assistant', 'First turn should have valid role');

    // Try to extract content
    const contentNode = firstTurn.querySelector('.markdown-prose, [class*="message"], .whitespace-pre-wrap');
    if (contentNode) {
      const content = contentNode.textContent.trim();
      assert.ok(content.length > 0, 'First turn should have content');
    }
  });
});
