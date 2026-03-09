# Manual Test Checklist

This document provides concrete manual verification steps for the ChatGPT Exporter extension.

## Functional Tests

### Test 1: Extension Installation

**Steps**:
1. Open Firefox
2. Navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on..."
5. Navigate to directory containing `manifest.json`
6. Select `manifest.json` and open it

**Pass Criteria**:
- Extension appears in Temporary Extensions list
- Extension icon appears in browser toolbar
- Extension status shows "Enabled" or similar

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 2: ChatGPT Page Recognition

**Steps**:
1. Open a ChatGPT conversation at `https://chatgpt.com/`
2. In Firefox, open the browser console (Ctrl+Shift+K or Cmd+Shift+K)
3. Check if content script has loaded (no errors in console)

**Pass Criteria**:
- No JavaScript errors in console
- Extension icon is clickable

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 3: Extract Conversation

**Steps**:
1. Open a multi-turn ChatGPT conversation with at least 3 messages
2. Click the extension icon in the toolbar
3. Wait for popup to appear
4. Click "Export" button

**Pass Criteria**:
- Popup appears when icon clicked
- Download starts after clicking Export
- Downloaded `.md` file contains conversation text
- File has meaningful title or content

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 4: Markdown Format Validation

**Steps**:
1. Perform Test 3 (extract conversation)
2. Open the downloaded `.md` file in a text editor
3. Check for proper Markdown formatting

**Pass Criteria**:
- Messages are separated with headers or list items
- Code blocks are properly formatted if present
- Formatting preserves message structure
- No HTML tags visible in plain text

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 5: Empty Conversation Handling

**Steps**:
1. Create a new empty ChatGPT conversation
2. Click extension icon
3. Click "Export"

**Pass Criteria**:
- Extension handles empty conversation gracefully
- Either empty `.md` file downloaded OR appropriate error message shown

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

## Privacy Tests

### Test 6: chatgpt.com-Only Access

**Steps**:
1. Open `https://example.com/` (or any non-ChatGPT site)
2. Click extension icon (if enabled)
3. Check behavior

**Pass Criteria**:
- Extension either does not appear or shows error indicating it only works on chatgpt.com
- No extraction happens on non-chatgpt.com sites

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 7: Local Processing Verification

**Steps**:
1. Open Firefox Network Monitor (Ctrl+Shift+E or Cmd+Shift+E)
2. Perform Test 3 (export conversation)
3. Monitor network traffic

**Pass Criteria**:
- No outgoing HTTP requests are made during extraction
- Only file download is initiated locally
- No data is uploaded to external services

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 8: No Telemetry

**Steps**:
1. Monitor browser console and network requests during export
2. Check for any analytics or tracking requests

**Pass Criteria**:
- No requests to analytics/tracking domains
- No telemetry data is visible in network requests
- Console shows no suspicious data transmission

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

## Documentation Tests

### Test 9: README Contains chatgpt.com-Only Scope

**Steps**:
1. Open `README.md`
2. Search for "chatgpt.com"

**Pass Criteria**:
- README explicitly states the extension is chatgpt.com-only
- No mention of supporting other websites
- Scope is clearly defined

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

### Test 10: PRIVACY Contains Explicit Statements

**Steps**:
1. Open `PRIVACY.md`
2. Search for keywords: "chatgpt.com-only", "local processing", "no telemetry", "no remote upload"

**Pass Criteria**:
- All 4 required privacy statements are present
- Documentation is clear and unambiguous
- Privacy commitments are explicit

**Result**: ☐ Pass  ☐ Fail  ☐ N/A

---

## Summary

- **Total Tests**: 10
- **Passed**: ___
- **Failed**: ___
- **N/A**: ___

## Test Environment

- Firefox Version: _________________
- Extension Version: 1.0.0
- Date: _________________
- Tester: _________________

## Notes

___________________________________________________________
___________________________________________________________
___________________________________________________________
