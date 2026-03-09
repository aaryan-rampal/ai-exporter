// ChatGPT DOM extractor
// Extracts normalized conversation turns from ChatGPT DOM.

/**
 * @typedef {Object} ChatTurn
 * @property {'user' | 'assistant'} role
 * @property {string} content
 * @property {string} [id]
 */

/**
 * @typedef {Object} ExtractionResult
 * @property {ChatTurn[]} [turns]
 * @property {string} [title]
 * @property {{code: string, message: string}} [error]
 */

function isChatGptHost(hostname) {
  return hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com');
}

/**
 * Extract conversation from ChatGPT DOM.
 * @param {Document} doc
 * @param {string} hostname
 * @returns {ExtractionResult}
 */
function extractChatGptConversation(doc = document, hostname = window.location.hostname) {
  if (!isChatGptHost(hostname)) {
    return {
      error: {
        code: 'UNSUPPORTED_PAGE',
        message: 'This extension only works on chatgpt.com'
      }
    };
  }

  // Find all message nodes by semantic attribute
  const messageNodes = doc.querySelectorAll('[data-message-author-role]');

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
    const contentNode = node.querySelector('.markdown, .markdown-prose, .text-message, [class*="message"], .whitespace-pre-wrap');

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
  const titleNode = doc.querySelector('title');
  const title = titleNode ? titleNode.textContent.replace(' - ChatGPT', '').trim() : 'ChatGPT Conversation';

  return {
    turns: turns,
    title: title
  };
}

// Export for testing (ES module)
export {
  extractChatGptConversation,
  isChatGptHost
};
