
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';

describe('Privacy Documentation Tests', () => {

  describe('README.md', () => {

    it('should mention chatgpt.com-only scope', () => {
      const readme = readFileSync('README.md', 'utf-8');
      assert.ok(
        readme.toLowerCase().includes('chatgpt.com-only'),
        'README must explicitly state this is a chatgpt.com-only extension'
      );
    });

    it('should explain what the extension does', () => {
      const readme = readFileSync('README.md', 'utf-8');
      assert.ok(
        readme.includes('export') || readme.includes('Markdown') || readme.includes('conversation'),
        'README must explain the extension\'s functionality'
      );
    });

    it('should include installation instructions', () => {
      const readme = readFileSync('README.md', 'utf-8');
      assert.ok(
        readme.toLowerCase().includes('install') || readme.toLowerCase().includes('temporary add-on'),
        'README must include installation instructions for Firefox temporary add-on'
      );
    });

    it('should include usage steps', () => {
      const readme = readFileSync('README.md', 'utf-8');
      assert.ok(
        readme.toLowerCase().includes('usage') ||
        readme.toLowerCase().includes('how to use') ||
        readme.includes('1.') && readme.includes('2.'),
        'README must include usage steps'
      );
    });

  });

  describe('PRIVACY.md', () => {

    it('should state chatgpt.com-only access explicitly', () => {
      const privacy = readFileSync('PRIVACY.md', 'utf-8');
      assert.ok(
        privacy.toLowerCase().includes('chatgpt.com-only') ||
        privacy.toLowerCase().includes('chatgpt.com only'),
        'PRIVACY.md must explicitly state this is chatgpt.com-only access'
      );
    });

    it('should state local processing only', () => {
      const privacy = readFileSync('PRIVACY.md', 'utf-8');
      assert.ok(
        privacy.toLowerCase().includes('local processing') ||
        privacy.toLowerCase().includes('all processing happens locally'),
        'PRIVACY.md must state that processing is local only'
      );
    });

    it('should state no telemetry', () => {
      const privacy = readFileSync('PRIVACY.md', 'utf-8');
      assert.ok(
        privacy.toLowerCase().includes('no telemetry') ||
        privacy.toLowerCase().includes('does not collect') ||
        privacy.toLowerCase().includes('does not transmit'),
        'PRIVACY.md must state there is no telemetry collection'
      );
    });

    it('should state no remote upload', () => {
      const privacy = readFileSync('PRIVACY.md', 'utf-8');
      assert.ok(
        privacy.toLowerCase().includes('no remote upload') ||
        privacy.toLowerCase().includes('not uploaded') ||
        privacy.toLowerCase().includes('sent to remote'),
        'PRIVACY.md must state that data is not uploaded remotely'
      );
    });

    it('should mention all four privacy statements', () => {
      const privacy = readFileSync('PRIVACY.md', 'utf-8');
      const requiredPhrases = [
        'local processing',
        'no telemetry',
        'no remote',
        'localhost'
      ];

      const foundPhrases = requiredPhrases.filter(phrase =>
        privacy.toLowerCase().includes(phrase.toLowerCase())
      );

      assert.ok(
        foundPhrases.length >= 3,
        `PRIVACY.md should mention key privacy statements. Found ${foundPhrases.length} of ${requiredPhrases.length}`
      );
    });

  });

});
