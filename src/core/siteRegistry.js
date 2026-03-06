// Site Registry
// Maps hostnames to their respective extractors for extensibility

/**
 * @typedef {Object} ExtractorResult
 * @property {Array<{role: string, content: string, id?: string}>} [turns]
 * @property {string} [title]
 * @property {string} [filename]
 * @property {{code: string, message: string}} [error]
 */

/**
 * @typedef {Object} SiteExtractor
 * @property {string} hostname
 * @property {() => ExtractorResult} extract
 */

// Registry of extractors by hostname
const registry = {
  // ChatGPT extractor will be registered here
};

/**
 * Register an extractor for a hostname
 * @param {string} hostname
 * @param {() => ExtractorResult} extractor
 */
function registerExtractor(hostname, extractor) {
  registry[hostname] = extractor;
}

/**
 * Get extractor for a given hostname
 * @param {string} hostname
 * @returns {(() => ExtractorResult) | null}
 */
function resolveExtractor(hostname) {
  // Exact match
  if (registry[hostname]) {
    return registry[hostname];
  }

  // Check for subdomain matches (e.g., www.chatgpt.com)
  for (const registeredHost of Object.keys(registry)) {
    if (hostname === registeredHost || hostname.endsWith('.' + registeredHost)) {
      return registry[registeredHost];
    }
  }

  return null;
}

/**
 * Check if a hostname is supported
 * @param {string} hostname
 * @returns {boolean}
 */
function isSupported(hostname) {
  return resolveExtractor(hostname) !== null;
}

/**
 * Get all supported hostnames
 * @returns {string[]}
 */
function getSupportedHosts() {
  return Object.keys(registry);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    registerExtractor,
    resolveExtractor,
    isSupported,
    getSupportedHosts,
    registry
  };
} else if (typeof window !== 'undefined') {
  window.SiteRegistry = {
    registerExtractor,
    resolveExtractor,
    isSupported,
    getSupportedHosts,
    registry
  };
}
