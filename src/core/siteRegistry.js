// Site Registry
// Maps hostnames to extractors.

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

const registry = Object.create(null);

function normalizeHostname(hostname) {
  if (typeof hostname !== 'string') {
    return '';
  }
  return hostname.trim().toLowerCase();
}

/**
 * Register an extractor for a hostname
 * @param {string} hostname
 * @param {() => ExtractorResult} extractor
 */
function registerExtractor(hostname, extractor) {
  const normalized = normalizeHostname(hostname);
  if (!normalized || typeof extractor !== 'function') {
    return;
  }
  registry[normalized] = extractor;
}

/**
 * Get extractor for a given hostname
 * @param {string} hostname
 * @returns {(() => ExtractorResult) | null}
 */
function resolveExtractor(hostname) {
  const normalized = normalizeHostname(hostname);

  if (!normalized) {
    return null;
  }

  // Exact match
  if (registry[normalized]) {
    return registry[normalized];
  }

  // Check for subdomain matches (e.g., www.chatgpt.com)
  for (const registeredHost of Object.keys(registry)) {
    if (normalized === registeredHost || normalized.endsWith('.' + registeredHost)) {
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

export {
  registerExtractor,
  resolveExtractor,
  isSupported,
  getSupportedHosts,
  registry
};
