import { describe, it } from 'node:test';
import assert from 'node:assert';

// Import from markdownRenderer
import { toFileName } from '../../src/core/markdownRenderer.js';

describe('File Naming Utils', () => {
  describe('toFileName', () => {
    it('should convert title to lowercase', () => {
      const result = toFileName('Test Title Here');

      assert.ok(result.endsWith('.md'));
      assert.ok(!result.match(/[A-Z]/));
    });

    it('should replace spaces with dashes', () => {
      const result = toFileName('Test Title Here');

      assert.ok(result.includes('test-title-here'));
    });

    it('should replace Windows forbidden characters', () => {
      const input = 'Test<>:"/\\|?*File';
      const result = toFileName(input);

      // Should not contain any forbidden characters
      assert.ok(!result.includes('<'));
      assert.ok(!result.includes('>'));
      assert.ok(!result.includes(':'));
      assert.ok(!result.includes('"'));
      assert.ok(!result.includes('/'));
      assert.ok(!result.includes('\\'));
      assert.ok(!result.includes('|'));
      assert.ok(!result.includes('?'));
      assert.ok(!result.includes('*'));
    });

    it('should collapse multiple consecutive dashes', () => {
      const result = toFileName('Test--Title---Here');

      assert.ok(!result.includes('--'));
      assert.ok(!result.includes('---'));
    });

    it('should trim leading and trailing dashes', () => {
      const result = toFileName('-Test Title-');

      assert.ok(!result.startsWith('-'));
      assert.ok(!result.endsWith('-'));
      assert.ok(result.includes('test-title'));
    });

    it('should add .md extension', () => {
      const result = toFileName('Test Title');

      assert.ok(result.endsWith('.md'));
    });

    it('should limit length to reasonable size', () => {
      const longTitle = ' '.repeat(200).split(' ').join('a'); // Very long string
      const result = toFileName(longTitle);

      // Remove extension to check base name length
      const baseName = result.replace(/\.md$/, '');
      assert.ok(baseName.length <= 100);
    });

    it('should provide fallback for empty title', () => {
      const result = toFileName('');

      assert.ok(result.includes('chatgpt-export'));
    });

    it('should provide fallback for null/undefined title', () => {
      const result1 = toFileName(null);
      const result2 = toFileName(undefined);

      assert.ok(result1.includes('chatgpt-export'));
      assert.ok(result2.includes('chatgpt-export'));
    });

    it('should handle title with only special characters', () => {
      const result = toFileName('<>:"/\\|?*');

      assert.ok(result.endsWith('.md'));
      // Should have fallback
      assert.ok(result.match(/[^."]*\.md$/));
    });

    it('should preserve alphanumeric characters', () => {
      const result = toFileName('ChatGPT Test 123');

      assert.ok(result.includes('chatgpt'));
      assert.ok(result.includes('test'));
      assert.ok(result.includes('123'));
    });

    it('should handle unicode characters', () => {
      const result = toFileName('Test 中文 Ñoño');

      assert.ok(result.includes('test'));
      assert.ok(result.endsWith('.md'));
    });

    it('should handle multiple spaces', () => {
      const result = toFileName('Test    Title    Here');

      // Should replace with single dashes
      assert.ok(!result.includes(' '));
      assert.ok(result.includes('---') === false);
    });

    it('should return consistent output for same input', () => {
      const input = 'Test Title Here';
      const result1 = toFileName(input);
      const result2 = toFileName(input);

      assert.strictEqual(result1, result2);
    });
  });
});
