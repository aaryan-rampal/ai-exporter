// Content script entry point.
// Keeps runtime file classic-compatible and dynamically loads ESM extractor.
// Message handler registers and resolves extractor deterministically.

if (typeof browser !== 'undefined') {
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'EXTRACT_CHATGPT_CHAT') {
      return false;
    }

    const hostname = window.location.hostname;

    Promise.all([
      import(browser.runtime.getURL('src/core/siteRegistry.js')),
      import(browser.runtime.getURL('src/content/chatgptExtractor.js'))
    ])
      .then(([{ registerExtractor, resolveExtractor }, { extractChatGptConversation }]) => {
        registerExtractor('chatgpt.com', () => {
          return extractChatGptConversation(document, window.location.hostname);
        });

        const extractor = resolveExtractor(hostname);

        if (!extractor) {
          sendResponse({
            error: {
              code: 'UNSUPPORTED_HOST',
              message: 'Unsupported hostname'
            }
          });
          return;
        }

        const result = extractor();

        if (result.error) {
          sendResponse({ error: result.error });
          return;
        }

        sendResponse({
          conversation: {
            title: result.title,
            turns: result.turns
          }
        });
      })
      .catch((error) => {
        sendResponse({
          error: {
            code: 'INTERNAL_ERROR',
            message: `Failed to extract conversation: ${error.message}`
          }
        });
      });

    return true;
  });
}
