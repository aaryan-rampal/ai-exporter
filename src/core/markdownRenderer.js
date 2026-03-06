// Markdown Renderer
// Converts normalized conversation data to Markdown format

/**
 * @typedef {Object} ChatTurn
 * @property {'user' | 'assistant'} role
 * @property {string} content
 * @property {string} [id]
 */

/**
 * @typedef {Object} Conversation
 * @property {string} title
 * @property {ChatTurn[]} turns
 */

/**
 * Render a conversation to Markdown format
 * @param {Conversation} conversation
 * @returns {string}
 */
function renderMarkdown(conversation) {
  const lines = [];

  // Title as H1
  lines.push(`# ${conversation.title}`);
  lines.push('');

  // Each turn as H2 with role
  conversation.turns.forEach(turn => {
    const roleLabel = turn.role === 'user' ? 'User' : 'Assistant';
    lines.push(`## ${roleLabel}`);
    lines.push('');

    // Content body
    lines.push(turn.content);
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Sanitize a string for use as a filename
 * @param {string} title
 * @returns {string}
 */
function toFileName(title) {
  if (!title || typeof title !== 'string') {
    return 'chatgpt-export.md';
  }

  // Convert to lowercase and replace invalid chars with dashes
  let sanitized = title
    .toLowerCase()
    .replace(/[<>:"/\\|?*]/g, '-')  // Windows/Unix forbidden chars
    .replace(/\s+/g, '-')             // Spaces to dashes
    .replace(/-+/g, '-')              // Collapse multiple dashes
    .replace(/^-+|-+$/g, '');         // Trim leading/trailing dashes

  // Limit length (leaving room for .md extension)
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // Ensure we have something
  if (!sanitized) {
    sanitized = 'chatgpt-export';
  }

  return `${sanitized}.md`;
}

/**
 * Validate that a markdown string contains expected structure
 * @param {string} markdown
 * @returns {boolean}
 */
function isValidMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return false;
  }

  // Should have at least one H1
  if (!markdown.startsWith('# ')) {
    return false;
  }

  // Should have at least one role heading
  const hasUserHeading = markdown.includes('## User');
  const hasAssistantHeading = markdown.includes('## Assistant');

  return hasUserHeading || hasAssistantHeading;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderMarkdown,
    toFileName,
    isValidMarkdown
  };
}
