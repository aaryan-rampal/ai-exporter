# ChatGPT Firefox Exporter Design

## Scope

- Build a Firefox extension that exports the currently open ChatGPT conversation to Markdown.
- Start with ChatGPT only.
- Design for future extension to Gemini and Claude without implementing them now.
- No timestamps required; preserve back-and-forth message order and content only.

## Constraints

- Parse from DOM only (no regex fallback, no alternate parser path).
- Export works only for the currently open chat page.
- Privacy-first permissions and behavior:
  - host access limited to `https://chatgpt.com/*`
  - no cross-site access
  - no remote uploads/telemetry
  - no persistent chat storage

## Chosen Architecture

- Firefox extension (Manifest V3) with three layers:
  - `content` layer: ChatGPT DOM extraction
  - `core` layer: normalized turn model + markdown rendering
  - `popup` layer: user-triggered export UX
- Extract message turns using ChatGPT semantic attributes from the provided sample:
  - `data-message-author-role` (`user`, `assistant`)
  - `data-message-id` for stable per-turn identity
- Keep site-specific extraction isolated so new sites can be added via a site registry.

## Components

### 1) Content Extractor (ChatGPT)

- Runs only on `chatgpt.com` pages.
- Selects conversation nodes by `data-message-author-role`.
- Extracts ordered turns:
  - role
  - content text/markdown-like body
  - optional source id (`data-message-id`)
- Filters UI chrome:
  - copy/feedback controls
  - sidebars and shell UI
  - non-conversation blocks (e.g. writing editor blocks)

### 2) Core Model + Renderer

- Shared types:
  - `ChatTurn { role: "user" | "assistant", content: string, id?: string }`
  - `Conversation { title: string, turns: ChatTurn[] }`
- Renderer outputs deterministic markdown:
  - H1 title
  - repeating `## User` / `## Assistant`
  - body content under each heading

### 3) Popup Export Flow

- Popup contains one action button: `Export current chat`.
- On click:
  1. send message to active tab content script
  2. receive normalized conversation
  3. render markdown
  4. trigger download as `<chat-title>.md` (fallback `chatgpt-export.md`)

## Data Flow

1. User opens a conversation on `chatgpt.com`.
2. User clicks extension popup export button.
3. Popup requests extraction from content script.
4. Content extractor returns ordered turns.
5. Core renderer builds markdown transcript.
6. Popup triggers local file download.

## Privacy and Safety

- Access scope is restricted to ChatGPT domain only.
- No network calls needed for extraction or rendering.
- No conversation data persisted after export action completes.
- User intent is explicit (manual click to export).

## Error Handling

- If not on `chatgpt.com`, popup shows actionable error.
- If no message turns found, show `No conversation detected`.
- If DOM shape changes and extraction fails, return structured error for quick diagnosis.

## Testing Strategy

- Fixture-driven tests with:
  - `data/chatgpt/Vicon Motion Capture Overview.html`
- Assertions:
  - turns extracted > 0
  - roles in output are only `user`/`assistant`
  - order matches source DOM order
  - markdown contains alternating role sections
  - output excludes known UI artifact strings
- Manual Firefox verification:
  - extension permission surface shows ChatGPT-only access
  - export works on currently open conversation
  - downloaded markdown is readable and complete

## Alternatives Considered

1. Regex/string parser
   - Rejected: too brittle for evolving DOM.
2. Background-heavy orchestration
   - Rejected: unnecessary complexity for single-site v1.
3. In-page injected export button first
   - Rejected: more coupled to UI layout and styling changes.

## Risks and Unknowns

- ChatGPT DOM changes may break selectors.
- Some message substructures may include extra non-message content.

## Mitigations

- Isolate selectors in a single extractor module.
- Use semantic attributes over visual CSS classes.
- Keep fixture tests as regression guardrails.
