import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const popupPath = join(__dirname, '../..', 'src/popup/popup.html');

describe('Popup privacy copy', () => {
  it('should contain chatgpt.com privacy notice', () => {
    const popupContent = readFileSync(popupPath, 'utf-8');

    assert.ok(
      popupContent.includes('chatgpt.com only') || popupContent.includes('chatgpt.com'),
      'Popup should mention chatgpt.com scope'
    );
  });

  it('should have export current chat button', () => {
    const popupContent = readFileSync(popupPath, 'utf-8');

    assert.ok(
      popupContent.includes('Export current chat'),
      'Popup should have export button with correct text'
    );
  });

  it('should have privacy notice section', () => {
    const popupContent = readFileSync(popupPath, 'utf-8');

    assert.ok(
      popupContent.includes('privacy') || popupContent.includes('Privacy'),
      'Popup should mention privacy'
    );
  });
});
