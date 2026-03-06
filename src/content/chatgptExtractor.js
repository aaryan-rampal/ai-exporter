// ChatGPT DOM extractor
// Extracts conversation turns from ChatGPT DOM using semantic attributes

/**
 * @typedef {Object} ChatTurn
 * @property {'user' | 'assistant'} role
 * @property {string} content
 * @property {string} [id]
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {ChatTurn[]} [turns]
 * @property {Object} [error]
 * @property {string} error.code
 * @property {string} error.message
 * @property {string} [title]
 * @property {string} [filename]
 */

/**
 * Extract conversation from ChatGPT DOM
 * @returns {ExtractionResult}
 */
function extractChatGptConversation() {
  // Check if we're on a ChatGPT page
  if (!window.location.hostname.includes('chatgpt.com')) {
    return {
      error: {
        code: 'UNSUPPORTED_PAGE',
        message: 'This extension only works on chatgpt.com'
      }
    };
  }

  // Find all message nodes by semantic attribute
  const messageNodes = document.querySelectorAll('[data-message-author-role]');

  if (messageNodes.length === 0) {
    return {
      error: {
        code: 'NO_CONVERSATION',
        message: 'No conversation detected on this page'
      }
    };
  }

  const turns = [];

  messageNodes.forEach(node => {
    const role = node.getAttribute('data-message-author-role');
    const messageId = node.getAttribute('data-message-id');

    // Skip non-conversation roles
    if (role !== 'user' && role !== 'assistant') {
      return;
    }

    // Extract content from the message body
    // Looking for the main content container within the message
    const contentNode = node.querySelector('.markdown-prose, .text-message, [class*="message"], .whitespace-pre-wrap');

    let content = '';
    if (contentNode) {
      // Get text content, preserving structure where possible
      content = contentNode.textContent.trim();
    } else {
      // Fallback: get all text from the message node itself
      // But exclude UI elements like buttons
      const clone = node.cloneNode(true);
      // Remove known UI elements
      const uiElements = clone.querySelectorAll('button, [role="button"], .copy-button, .feedback-buttons');
      uiElements.forEach(el => { el.remove(); });
      content = clone.textContent.trim();
    }

    // Clean up excessive whitespace
    content = content.replace(/\s+/g, ' ').trim();

    if (content) {
      turns.push({
        role: role,
        content: content,
        id: messageId || undefined
      });
    }
  });

  if (turns.length === 0) {
    return {
      error: {
        code: 'NO_CONVERSATION',
        message: 'No conversation content found'
      }
    };
  }

  // Try to get conversation title from page
  const titleNode = document.querySelector('title');
  const title = titleNode ? titleNode.textContent.replace(' - ChatGPT', '').trim() : 'ChatGPT Conversation';

  return {
    turns: turns,
    title: title,
    filename: sanitizeFilename(title) + '.md'
  };
}

/**
 * Sanitize a string for use as a filename
 * @param {string} name
 * @returns {string}
 */
function sanitizeFilename(name) {
  // Replace invalid characters with dashes
  let sanitized = name
    .toLowerCase()
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // Fallback if empty
  if (!sanitized) {
    sanitized = 'chatgpt-export';
  }

  return sanitized;
}

/**
 * Render conversation to markdown
 * @param {Object} conversation
 * @param {string} conversation.title
 * @param {ChatTurn[]} conversation.turns
 * @returns {string}
 */
function renderMarkdown(conversation) {
  const lines = [];

  lines.push(`# ${conversation.title}`);
  lines.push('');

  conversation.turns.forEach(turn => {
    const roleLabel = turn.role === 'user' ? 'User' : 'Assistant';
    lines.push(`## ${roleLabel}`);
    lines.push('');
    lines.push(turn.content);
    lines.push('');
  });

  return lines.join('\n');
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXPORT_CHATGPT_CHAT') {
    const result = extractChatGptConversation();

    if (result.error) {
      sendResponse({ error: result.error });
    } else {
      const markdown = renderMarkdown({
        title: result.title,
        turns: result.turns
      });

      sendResponse({
        markdown: markdown,
        filename: result.filename
      });
    }
  }

  return true; // Keep message channel open for async
});

// Export for testing (if in Node environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractChatGptConversation,
    renderMarkdown,
    sanitizeFilename
  };
}
