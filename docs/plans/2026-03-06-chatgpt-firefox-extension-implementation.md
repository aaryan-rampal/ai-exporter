# ChatGPT Firefox Exporter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Firefox extension that exports the currently open ChatGPT conversation into a local Markdown file using DOM-only extraction.

**Architecture:** Use a ChatGPT-only content script for extraction, a shared core layer for normalization and markdown rendering, and a popup action that triggers extraction and download. Keep site-specific extraction isolated behind a registry interface so Gemini/Claude can be added later without restructuring v1.

**Tech Stack:** TypeScript, WebExtensions API (Manifest V3), Firefox extension tooling (minimal setup), Node test runner + JSDOM-like DOM test environment.

---

### Phase 1: Project Skeleton and Extension Permissions
- **Objective:** Create a minimal Firefox MV3 extension shell with strict ChatGPT-only access.
- **Approved decisions implemented:** ChatGPT-only permission model, popup-triggered export flow, no telemetry/no storage.
- **Pseudocode flow:** define manifest -> wire popup entry -> register content script for chatgpt.com only.
- **Tiny snippet(s) only:**

```json
{
  "manifest_version": 3,
  "host_permissions": ["https://chatgpt.com/*"],
  "permissions": ["activeTab", "downloads"]
}
```

- **Validation criteria:** extension loads in Firefox developer mode; permissions show ChatGPT-only domain access.
- **Language-specific gotchas:** MV3 background and messaging APIs differ slightly across browsers; avoid Chrome-only APIs.

### Task 1: Create base extension files

**Files:**
- Create: `manifest.json`
- Create: `src/popup/popup.html`
- Create: `src/popup/popup.ts`
- Create: `src/content/chatgptExtractor.ts`
- Create: `src/core/types.ts`
- Create: `src/core/markdownRenderer.ts`
- Create: `src/core/siteRegistry.ts`
- Create: `src/background/background.ts` (only if needed for bundler/runtime)

**Step 1: Write the failing test**

Create `tests/manifest/permissions.test.ts` asserting host permissions are only ChatGPT.

```ts
expect(manifest.host_permissions).toEqual(["https://chatgpt.com/*"])
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/manifest/permissions.test.ts`
Expected: FAIL because manifest does not exist yet.

**Step 3: Write minimal implementation**

Create `manifest.json` and minimal extension scaffold files.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/manifest/permissions.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add manifest.json src/popup src/content src/core src/background tests/manifest/permissions.test.ts
git commit -m "feat: scaffold firefox extension with chatgpt-only permissions"
```

### Task 2: Add popup UI with explicit privacy language

**Files:**
- Modify: `src/popup/popup.html`
- Modify: `src/popup/popup.ts`
- Test: `tests/popup/privacy-copy.test.ts`

**Step 1: Write the failing test**

Assert popup includes a privacy statement and export button.

```ts
expect(text).toContain("chatgpt.com only")
expect(text).toContain("Export current chat")
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/popup/privacy-copy.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Add button and short privacy copy in popup.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/popup/privacy-copy.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/popup/popup.html src/popup/popup.ts tests/popup/privacy-copy.test.ts
git commit -m "feat: add popup export action and privacy copy"
```

### Phase 2: DOM-Only ChatGPT Extraction
- **Objective:** Implement deterministic extraction of ordered user/assistant turns from ChatGPT DOM attributes.
- **Approved decisions implemented:** DOM-only parser, semantic attribute selectors, ChatGPT-specific extractor isolation.
- **Pseudocode flow:** query all turn nodes by role attribute -> map to normalized turns -> clean message content -> return ordered list.
- **Tiny snippet(s) only:**

```ts
const nodes = document.querySelectorAll("[data-message-author-role]")
```

```ts
type Role = "user" | "assistant"
```

- **Validation criteria:** fixture extraction returns non-empty ordered turns with valid roles and clean content.
- **Language-specific gotchas:** NodeList order is DOM order; preserve as-is, do not sort by IDs.

### Task 3: Add fixture extraction tests for provided HTML

**Files:**
- Create: `tests/fixtures/chatgpt/Vicon Motion Capture Overview.html` (copy from provided sample)
- Create: `tests/chatgpt/extractor.test.ts`
- Modify: `src/content/chatgptExtractor.ts`

**Step 1: Write the failing test**

Write tests that parse fixture HTML and assert:
- turns length > 0
- roles only `user|assistant`
- first turn role matches expected
- output does not contain UI test IDs

```ts
expect(turns.every(t => t.role === "user" || t.role === "assistant")).toBe(true)
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/chatgpt/extractor.test.ts`
Expected: FAIL because extractor logic is missing.

**Step 3: Write minimal implementation**

Implement extractor:
- select `[data-message-author-role]`
- enforce role narrowing
- capture `data-message-id`
- extract conversation body text from message subtree
- trim and collapse excess whitespace

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/chatgpt/extractor.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/content/chatgptExtractor.ts tests/chatgpt/extractor.test.ts tests/fixtures/chatgpt
git commit -m "feat: implement dom-only chatgpt turn extraction"
```

### Task 4: Handle extraction errors and empty states

**Files:**
- Modify: `src/content/chatgptExtractor.ts`
- Create: `tests/chatgpt/extractor-errors.test.ts`

**Step 1: Write the failing test**

Cases:
- non-ChatGPT page DOM => typed `UNSUPPORTED_PAGE`
- no turns found => typed `NO_CONVERSATION`

```ts
expect(result.error?.code).toBe("NO_CONVERSATION")
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/chatgpt/extractor-errors.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Add structured result type and explicit error returns.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/chatgpt/extractor-errors.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/content/chatgptExtractor.ts tests/chatgpt/extractor-errors.test.ts
git commit -m "feat: add extractor error states for unsupported and empty pages"
```

### Phase 3: Markdown Rendering and Filename Strategy
- **Objective:** Convert normalized turns into readable, deterministic markdown and safe filenames.
- **Approved decisions implemented:** role-section markdown format, deterministic renderer, local download output.
- **Pseudocode flow:** render title -> iterate turns -> prepend role headings -> append normalized content.
- **Tiny snippet(s) only:**

```ts
lines.push(`## ${turn.role === "user" ? "User" : "Assistant"}`)
```

- **Validation criteria:** markdown output is stable, ordered, and free of extension/UI artifacts.
- **Language-specific gotchas:** sanitize title for filesystem-safe filename; preserve markdown code fences in message content.

### Task 5: Implement markdown renderer tests and code

**Files:**
- Modify: `src/core/markdownRenderer.ts`
- Create: `tests/core/markdownRenderer.test.ts`

**Step 1: Write the failing test**

Test expected markdown shape from a small mock conversation.

```ts
expect(md).toContain("## User")
expect(md).toContain("## Assistant")
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/markdownRenderer.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement line-based renderer with blank-line normalization.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/markdownRenderer.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/markdownRenderer.ts tests/core/markdownRenderer.test.ts
git commit -m "feat: render normalized conversation markdown"
```

### Task 6: Add filename sanitization

**Files:**
- Modify: `src/core/markdownRenderer.ts` (or `src/core/fileNaming.ts`)
- Create: `tests/core/fileNaming.test.ts`

**Step 1: Write the failing test**

Assert title with forbidden characters becomes safe filename with `.md` suffix.

```ts
expect(toFileName("A/B:C?")).toBe("a-b-c.md")
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/fileNaming.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement conservative slugify + fallback `chatgpt-export.md`.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/fileNaming.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/markdownRenderer.ts tests/core/fileNaming.test.ts
git commit -m "feat: add safe markdown export filenames"
```

### Phase 4: Popup-to-Content Integration and Download
- **Objective:** Wire popup click to extraction, rendering, and file download.
- **Approved decisions implemented:** user-initiated export from currently open tab; local download only.
- **Pseudocode flow:** popup click -> query active tab -> send extraction request -> render markdown -> `downloads.download`.
- **Tiny snippet(s) only:**

```ts
browser.tabs.sendMessage(tabId, { type: "EXPORT_CHATGPT_CHAT" })
```

```ts
browser.downloads.download({ url: blobUrl, filename })
```

- **Validation criteria:** one-click export produces `.md` file from active ChatGPT tab.
- **Language-specific gotchas:** messaging fails if content script unavailable; show explicit UI error state.

### Task 7: Add popup integration tests

**Files:**
- Modify: `src/popup/popup.ts`
- Create: `tests/popup/export-flow.test.ts`

**Step 1: Write the failing test**

Mock tab + content response + download API and assert call chain executes.

```ts
expect(downloads.download).toHaveBeenCalled()
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/popup/export-flow.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement popup handler and message passing.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/popup/export-flow.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/popup/popup.ts tests/popup/export-flow.test.ts
git commit -m "feat: wire popup export flow to message and download"
```

### Task 8: Add user-facing error messaging in popup

**Files:**
- Modify: `src/popup/popup.html`
- Modify: `src/popup/popup.ts`
- Create: `tests/popup/error-states.test.ts`

**Step 1: Write the failing test**

Error cases:
- not on `chatgpt.com`
- no conversation found
- extractor runtime failure

```ts
expect(statusText).toContain("No conversation detected")
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/popup/error-states.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Add clear status/error output in popup UI.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/popup/error-states.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/popup/popup.html src/popup/popup.ts tests/popup/error-states.test.ts
git commit -m "feat: add popup error states for export failures"
```

### Phase 5: Extensibility Boundaries (Without Extra Sites)
- **Objective:** Add minimal site-registry boundary so adding new providers is straightforward later.
- **Approved decisions implemented:** extensible architecture without implementing Gemini/Claude now.
- **Pseudocode flow:** resolve provider by hostname -> call provider extractor -> normalize to shared type.
- **Tiny snippet(s) only:**

```ts
registry["chatgpt.com"] = extractChatGptConversation
```

- **Validation criteria:** registry is used in flow and can be extended by adding a new key + extractor.
- **Language-specific gotchas:** avoid premature abstraction; one concrete provider + narrow interface only.

### Task 9: Add site registry and route ChatGPT extraction through it

**Files:**
- Modify: `src/core/siteRegistry.ts`
- Modify: `src/content/chatgptExtractor.ts`
- Modify: `src/popup/popup.ts`
- Create: `tests/core/siteRegistry.test.ts`

**Step 1: Write the failing test**

Assert:
- `chatgpt.com` resolves extractor
- unknown host returns unsupported

```ts
expect(resolveExtractor("chatgpt.com")).toBeDefined()
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/core/siteRegistry.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement a tiny registry + resolver and integrate popup flow.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/core/siteRegistry.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/core/siteRegistry.ts src/popup/popup.ts tests/core/siteRegistry.test.ts
git commit -m "refactor: route extraction through site registry"
```

### Phase 6: Documentation and Manual Verification
- **Objective:** Make behavior and privacy posture explicit and verify extension end-to-end.
- **Approved decisions implemented:** user-visible privacy guarantees and ChatGPT-only scope.
- **Pseudocode flow:** document guarantees -> load temporary extension -> run export manually.
- **Tiny snippet(s) only:**

```md
This extension reads chat content from chatgpt.com only when you click Export.
```

- **Validation criteria:** docs match actual permissions and runtime behavior; manual flow succeeds.
- **Language-specific gotchas:** permission docs must match manifest exactly.

### Task 10: Add privacy and usage docs

**Files:**
- Create: `README.md`
- Create: `PRIVACY.md`
- Modify: `manifest.json` (description/name if needed)

**Step 1: Write the failing test**

Create a lightweight docs consistency test (or script) asserting README/PRIVACY mention ChatGPT-only scope.

```ts
expect(text).toContain("chatgpt.com only")
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/docs/privacy-docs.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Document install, usage, permissions, and data policy.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/docs/privacy-docs.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md PRIVACY.md tests/docs/privacy-docs.test.ts manifest.json
git commit -m "docs: add usage and privacy policy for chatgpt-only export"
```

### Task 11: Manual end-to-end verification

**Files:**
- Modify: `docs/manual-test-checklist.md`

**Step 1: Write the failing test**

N/A (manual verification task).

**Step 2: Run verification to verify current state fails/untested**

Run manual checklist before fix implementation.

**Step 3: Write minimal implementation**

Perform steps:
1. Load temporary extension in Firefox.
2. Open ChatGPT conversation.
3. Click `Export current chat`.
4. Validate downloaded markdown content order.

**Step 4: Run verification to verify it passes**

Mark checklist pass/fail with notes.

**Step 5: Commit**

```bash
git add docs/manual-test-checklist.md
git commit -m "test: record firefox manual verification checklist results"
```

## Final Validation Gate

Run full suite and build checks before completion claim:

```bash
npm test
npm run build
```

Expected:
- Tests pass.
- Extension bundle/build artifacts are generated without errors.

## Out-of-Scope (Explicit)

- Gemini extraction.
- Claude extraction.
- Conversation history batch export.
- Timestamp export.
- Cloud sync, remote storage, telemetry.

## Stop-and-Ask Triggers

- If ChatGPT content containers in live pages do not expose stable `data-message-author-role`.
- If Firefox MV3 API behavior conflicts with current bundler assumptions.
- If preserving markdown fidelity requires architecture not in approved design (e.g., rich-node serializer service).
