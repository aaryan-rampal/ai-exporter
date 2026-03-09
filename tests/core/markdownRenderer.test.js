import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import functions from markdownRenderer
import { renderMarkdown, isValidMarkdown } from '../../src/core/markdownRenderer.js';

describe('Markdown Renderer', () => {
  describe('renderMarkdown', () => {
    it('should render conversation with title as H1', () => {
      const conversation = {
        title: 'Test Chat',
        turns: [
          { role: 'user', content: 'Hello' }
        ]
      };

      const result = renderMarkdown(conversation);

      assert.ok(result.startsWith('# Test Chat'));
      assert.ok(result.includes('## User'));
      assert.ok(result.includes('Hello'));
    });

    it('should render user turns correctly', () => {
      const conversation = {
        title: 'Test',
        turns: [
          { role: 'user', content: 'User message' }
        ]
      };

      const result = renderMarkdown(conversation);

      assert.ok(result.includes('## User'));
      assert.ok(result.includes('User message'));
    });

    it('should render assistant turns correctly', () => {
      const conversation = {
        title: 'Test',
        turns: [
          { role: 'assistant', content: 'Assistant response' }
        ]
      };

      const result = renderMarkdown(conversation);

      assert.ok(result.includes('## Assistant'));
      assert.ok(result.includes('Assistant response'));
    });

    it('should render multiple turns alternating roles', () => {
      const conversation = {
        title: 'Test',
        turns: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'First response' },
          { role: 'user', content: 'Second message' },
          { role: 'assistant', content: 'Second response' }
        ]
      };

      const result = renderMarkdown(conversation);

      const lines = result.split('\n');

      // Count headings
      const h1Count = lines.filter(line => line.startsWith('# ')).length;
      const h2UserCount = lines.filter(line => line === '## User').length;
      const h2AssistantCount = lines.filter(line => line === '## Assistant').length;

      assert.strictEqual(h1Count, 1, 'Should have exactly 1 H1 heading');
      assert.strictEqual(h2UserCount, 2, 'Should have 2 User headings');
      assert.strictEqual(h2AssistantCount, 2, 'Should have 2 Assistant headings');

      // Verify order
      const userIndex = lines.indexOf('## User');
      const assistantIndex = lines.indexOf('## Assistant');
      assert.ok(userIndex < assistantIndex, 'User should come before assistant');
    });

    it('should preserve content formatting', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const conversation = {
        title: 'Test',
        turns: [
          { role: 'user', content: content }
        ]
      };

      const result = renderMarkdown(conversation);

      assert.ok(result.includes('Line 1'));
      assert.ok(result.includes('Line 2'));
      assert.ok(result.includes('Line 3'));
    });

    it('should handle empty turns array', () => {
      const conversation = {
        title: 'Test',
        turns: []
      };

      const result = renderMarkdown(conversation);

      assert.ok(result.startsWith('# Test'));
      assert.ok(result.includes('\n'));
    });

    it('should structure output correctly', () => {
      const conversation = {
        title: 'Test Chat',
        turns: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };

      const result = renderMarkdown(conversation);

      // Should start with title
      assert.ok(result.startsWith('# Test Chat\n\n'));

      // Should have role headings
      assert.ok(result.includes('## User\n\n'));
      assert.ok(result.includes('## Assistant\n\n'));

      // Should end with newline
      assert.ok(result.endsWith('\n'));
    });
  });

  describe('isValidMarkdown', () => {
    it('should return true for valid markdown with H1', () => {
      const markdown = '# Title\n\n## User\n\nHello';
      const result = isValidMarkdown(markdown);

      assert.strictEqual(result, true);
    });

    it('should return true for markdown with role headings', () => {
      const markdown = 'Title\n\n## User\n\nContent';
      const result = isValidMarkdown(markdown);

      // This is false because doesn't start with H1
      assert.strictEqual(result, false);
    });

    it('should return false for empty string', () => {
      const result = isValidMarkdown('');

      assert.strictEqual(result, false);
    });

    it('should return false for non-string input', () => {
      const result = isValidMarkdown(null);

      assert.strictEqual(result, false);
    });

    it('should require at least one role heading', () => {
      const markdown = '# Title\n\nSome content';
      const result = isValidMarkdown(markdown);

      assert.strictEqual(result, false);
    });

    it('should accept markdown with User heading', () => {
      const markdown = '# Title\n\n## User\n\nContent';
      const result = isValidMarkdown(markdown);

      assert.strictEqual(result, true);
    });

    it('should accept markdown with Assistant heading', () => {
      const markdown = '# Title\n\n## Assistant\n\nContent';
      const result = isValidMarkdown(markdown);

      assert.strictEqual(result, true);
    });
  });
});
