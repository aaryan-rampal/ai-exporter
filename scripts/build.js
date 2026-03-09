import { readFileSync, existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';

const REQUIRED_FILES = [
  'manifest.json',
  'src/popup/popup.html',
  'src/popup/popup.js',
  'src/content/content.js',
  'src/content/chatgptExtractor.js',
  'src/core/siteRegistry.js',
  'src/core/markdownRenderer.js',
  'src/background/background.js'
];

function validateExtension() {
  console.error('Validating extension structure...\n');

  let allValid = true;

  for (const file of REQUIRED_FILES) {
    const filePath = join(process.cwd(), file);
    if (!existsSync(filePath)) {
      console.error(`❌ Missing required file: ${file}`);
      allValid = false;
    } else {
      const stats = statSync(filePath);
      console.error(`✓ ${file} (${stats.size} bytes)`);
    }
  }

  console.error('');

  if (!allValid) {
    throw new Error('Extension validation failed: missing required files');
  }

  console.error('✓ All required files present');
}

function validateManifest() {
  console.error('\nValidating manifest.json...\n');

  const manifestPath = join(process.cwd(), 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  const expected = {
    'manifest_version': 3,
    'name': 'ChatGPT Exporter',
    'version': '1.0.0'
  };

  let isValid = true;

  for (const [key, value] of Object.entries(expected)) {
    if (manifest[key] !== value) {
      console.error(`❌ Manifest.${key} should be ${value}, got ${manifest[key]}`);
      isValid = false;
    } else {
      console.error(`✓ Manifest.${key} is correct: ${value}`);
    }
  }

  if (!manifest.host_permissions || !manifest.host_permissions.includes('https://chatgpt.com/*')) {
    console.error('❌ Manifest should include https://chatgpt.com/* in host_permissions');
    isValid = false;
  } else {
    console.error('✓ Manifest includes chatgpt.com-only host permissions');
  }

  if (!isValid) {
    throw new Error('Manifest validation failed');
  }

  console.error('\n✓ Manifest validation passed');
}

function build() {
  console.error('Building ChatGPT Exporter extension...\n');
  console.error('='.repeat(50));
  console.error('');

  try {
    validateExtension();
    validateManifest();

    console.error('');
    console.error('='.repeat(50));
    console.error('');
    console.error('✓ Build successful');
    console.error('\nExtension is ready for loading in Firefox:');
    console.error('  1. Open Firefox and navigate to about:debugging');
    console.error('  2. Click "This Firefox"');
    console.error('  3. Click "Load Temporary Add-on..."');
    console.error('  4. Select the manifest.json file in this directory\n');

  } catch (error) {
    console.error(`\n❌ Build failed: ${error.message}`);
    process.exit(1);
  }
}

build();
