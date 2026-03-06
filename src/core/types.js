// Core types for ChatGPT Exporter
// Shared type definitions used across extension modules

/**
 * @typedef {Object} ChatTurn
 * @property {'user' | 'assistant'} role - The author of the message
 * @property {string} content - The message content
 * @property {string} [id] - Optional message ID for reference
 */

/**
 * @typedef {Object} Conversation
 * @property {string} title - The conversation title
 * @property {ChatTurn[]} turns - Ordered list of conversation turns
 */

/**
 * @typedef {Object} ExtractionError
 * @property {string} code - Error code (e.g., 'UNSUPPORTED_PAGE', 'NO_CONVERSATION')
 * @property {string} message - Human-readable error message
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {ChatTurn[]} [turns] - Extracted conversation turns
 * @property {string} [title] - Conversation title
 * @property {string} [filename] - Suggested filename
 * @property {ExtractionError} [error] - Error if extraction failed
 */

/**
 * @typedef {Object} SiteExtractor
 * @property {string} hostname - The hostname this extractor handles
 * @property {() => ExtractionResult} extract - Function to extract conversation
 */

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {};
}
