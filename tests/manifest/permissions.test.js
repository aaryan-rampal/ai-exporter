import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifestPath = join(__dirname, '../..', 'manifest.json');

describe('Manifest permissions', () => {
  it('should have ChatGPT-only host permissions', () => {
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    assert.deepStrictEqual(
      manifest.host_permissions,
      ['https://chatgpt.com/*'],
      'Host permissions should be limited to ChatGPT domain only'
    );
  });

  it('should have required permissions for export functionality', () => {
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    assert.ok(
      manifest.permissions.includes('activeTab'),
      'Should have activeTab permission'
    );
    assert.ok(
      manifest.permissions.includes('downloads'),
      'Should have downloads permission'
    );
  });
});
