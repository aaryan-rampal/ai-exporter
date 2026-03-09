import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Site Registry - strict and meaningful tests', () => {
  let siteRegistry;

  beforeEach(async () => {
    // Import the siteRegistry module
    const module = await import('../../src/core/siteRegistry.js');
    
    // Get exports
    siteRegistry = module;
    
    // Clear registry for each test
    if (siteRegistry.registry) {
      Object.keys(siteRegistry.registry).forEach(key => {
        delete siteRegistry.registry[key];
      });
    }
  });

  describe('registerExtractor', () => {
    it('should register extractor for hostname', () => {
      const testExtractor = () => ({
        turns: [{ role: 'user', content: 'test' }],
        title: 'Test'
      });

      siteRegistry.registerExtractor('example.com', testExtractor);

      const resolved = siteRegistry.resolveExtractor('example.com');
      assert.strictEqual(resolved, testExtractor);
    });

    it('should overwrite existing extractor', () => {
      const extractor1 = () => ({ turns: [] });
      const extractor2 = () => ({ title: 'test' });

      siteRegistry.registerExtractor('test.com', extractor1);
      siteRegistry.registerExtractor('test.com', extractor2);

      const resolved = siteRegistry.resolveExtractor('test.com');
      assert.strictEqual(resolved, extractor2);
      assert.notStrictEqual(resolved, extractor1);
    });

    it('should return undefined for null hostname', () => {
      const result = siteRegistry.resolveExtractor(null);
      assert.strictEqual(result, null);
    });

    it('should return undefined for undefined hostname', () => {
      const result = siteRegistry.resolveExtractor(undefined);
      assert.strictEqual(result, null);
    });
  });

  describe('resolveExtractor', () => {
    it('should return null for unregistered hostname', () => {
      const result = siteRegistry.resolveExtractor('unregistered.com');
      assert.strictEqual(result, null);
    });

    it('should match exact hostname', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('chatgpt.com', extractor);

      const resolved = siteRegistry.resolveExtractor('chatgpt.com');
      assert.strictEqual(resolved, extractor);
    });

    it('should match subdomains', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('example.com', extractor);

      const resolved = siteRegistry.resolveExtractor('sub.example.com');
      assert.strictEqual(resolved, extractor);
    });

    it('should not match subdomains of different base', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('example.com', extractor);

      const resolved = siteRegistry.resolveExtractor('sub.different.com');
      assert.strictEqual(resolved, null);
    });

    it('should match www subdomain', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('chatgpt.com', extractor);

      const resolved = siteRegistry.resolveExtractor('www.chatgpt.com');
      assert.strictEqual(resolved, extractor);
    });
  });

  describe('isSupported', () => {
    it('should return true for supported hostname', () => {
      siteRegistry.registerExtractor('supported.com', () => ({}));
      
      const result = siteRegistry.isSupported('supported.com');
      assert.strictEqual(result, true);
    });

    it('should return true for supported subdomain', () => {
      siteRegistry.registerExtractor('supported.com', () => ({}));
      
      const result = siteRegistry.isSupported('sub.supported.com');
      assert.strictEqual(result, true);
    });

    it('should return false for unsupported hostname', () => {
      siteRegistry.registerExtractor('supported.com', () => ({}));
      
      const result = siteRegistry.isSupported('unsupported.com');
      assert.strictEqual(result, false);
    });

    it('should return false for null hostname', () => {
      const result = siteRegistry.isSupported(null);
      assert.strictEqual(result, false);
    });

    it('should return false for undefined hostname', () => {
      const result = siteRegistry.isSupported(undefined);
      assert.strictEqual(result, false);
    });

    it('should return false for empty string hostname', () => {
      const result = siteRegistry.isSupported('');
      assert.strictEqual(result, false);
    });
  });

  describe('getSupportedHosts', () => {
    it('should return empty array when no extractors registered', () => {
      const hosts = siteRegistry.getSupportedHosts();
      
      assert.ok(Array.isArray(hosts));
      assert.strictEqual(hosts.length, 0);
    });

    it('should return list of registered hostnames', () => {
      siteRegistry.registerExtractor('a.com', () => ({}));
      siteRegistry.registerExtractor('b.com', () => ({}));
      
      const hosts = siteRegistry.getSupportedHosts();
      
      assert.ok(Array.isArray(hosts));
      assert.strictEqual(hosts.length, 2);
      assert.ok(hosts.includes('a.com'));
      assert.ok(hosts.includes('b.com'));
    });

    it('should not include unregistered hostnames', () => {
      siteRegistry.registerExtractor('registered.com', () => ({}));
      
      const hosts = siteRegistry.getSupportedHosts();
      
      assert.ok(!hosts.includes('unregistered.com'));
    });
  });

  describe('registry object', () => {
    it('should store registered extractors', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('test.com', extractor);
      
      assert.strictEqual(siteRegistry.registry['test.com'], extractor);
    });

    it('should allow direct access to registry', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('test.com', extractor);
      
      assert.ok(siteRegistry.registry);
      assert.strictEqual(typeof siteRegistry.registry, 'object');
    });
  });

  describe('chatgpt.com integration', () => {
    it('should support chatgpt.com when registered', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('chatgpt.com', extractor);
      
      assert.strictEqual(siteRegistry.isSupported('chatgpt.com'), true);
      assert.strictEqual(siteRegistry.resolveExtractor('chatgpt.com'), extractor);
    });

    it('should support www.chatgpt.com when chatgpt.com registered', () => {
      const extractor = () => ({ turns: [] });
      siteRegistry.registerExtractor('chatgpt.com', extractor);
      
      assert.strictEqual(siteRegistry.isSupported('www.chatgpt.com'), true);
      assert.strictEqual(siteRegistry.resolveExtractor('www.chatgpt.com'), extractor);
    });

    it('should not support unregistered domains', () => {
      const unsupported = ['google.com', 'example.com', 'openai.com'];
      
      unsupported.forEach(hostname => {
        assert.strictEqual(siteRegistry.isSupported(hostname), false);
        assert.strictEqual(siteRegistry.resolveExtractor(hostname), null);
      });
    });
  });
});
