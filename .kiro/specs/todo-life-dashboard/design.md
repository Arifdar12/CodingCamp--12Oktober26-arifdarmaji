# Design Document — To Do Life Dashboard

## Overview

The **To Do Life Dashboard** is a zero-dependency, single-page web application that runs entirely in the browser. It bundles four productivity widgets — Greeting, Focus Timer, To-Do List, and Quick Links — into one lightweight, offline-capable dashboard. All state lives in `localStorage`; there is no server, no build step, and no network requirement.

The existing codebase already provides a working skeleton: `index.html`, `css/style.css`, and `js/app.js`. This design formalises the architecture, data models, component boundaries, and correctness properties that the final implementation must satisfy — serving as the authoritative reference for completing and verifying the application.

---

## Architecture

### Deployment Model

```
Browser
└── index.html          ← single entry point
    ├── css/style.css   ← all presentation (one file)
    └── js/app.js       ← all logic (one file, no modules, no bundler)
```

The application is a **pure client-side SPA**. Loading `index.html` from the filesystem (`file://`) or any static HTTP host is all that is required — no server-side rendering, no API calls, no CDN dependencies.

### Runtime Architecture

```
┌─────────────────────────────────────────────────────┐
│                     index.html (DOM)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Greeting │ │  Timer   │ │ TodoList │ │ Links  │ │
│  │ Widget   │ │ Widget   │ │ Widget   │ │ Widget │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │             │            │             │      │
│  ─────┴─────────────┴────────────┴─────────────┴──── │
│                    js/app.js                         │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │ Clock/Timer │  │   Storage Layer (localStorage)│  │
│  │ (setInterval│  │  tdld_tasks / tdld_links      │  │
│  │  engine)    │  └──────────────────────────────┘  │
│  └─────────────┘                                    │
└─────────────────────────────────────────────────────┘
```

### Module Organisation (within `app.js`)

`app.js` is structured as five sequential IIFE-style sections (no ES modules, to maintain `file://` compatibility and avoid a bundler):

1. **Greeting & Clock** — `setInterval`-driven clock, pure formatting functions
2. **Focus Timer** — state machine with `setInterval`, three control handlers
3. **To-Do List** — CRUD operations, modal edit flow, localStorage sync
4. **Quick Links** — CRUD operations, URL normalisation, localStorage sync
5. **Storage Utilities** — shared `loadData`, `saveData`, JSON guard functions

### Event Flow

All user interactions follow the same pattern:

```
User Event → Event Handler → Mutate In-Memory State
          → Write to localStorage → Re-render DOM from State
```

Re-rendering is always done from the authoritative in-memory/persisted state, never by patching the existing DOM directly (except for the live clock, which updates a single text node).

---

## Components and Interfaces

### 1. Greeting Widget

**Responsibility**: Display live time, formatted date, and time-sensitive greeting.

**DOM anchors** (read from `index.html`):
- `#greeting-msg` — greeting text (`<h1>`)
- `#datetime-display` — combined clock + date string (`<p>`)

**Public interface (functions in `app.js`)**:

```
getGreeting(hour: number): string
  // hour ∈ [0, 23]
  // Returns one of: "Good Morning!", "Good Afternoon!",
  //                 "Good Evening!", "Good Night!"

formatTime24(date: Date): string
  // Returns "HH:MM:SS" — zero-padded, 24-hour

formatDateLong(date: Date): string
  // Returns e.g. "Thursday, 16 October 2026"

updateClock(): void
  // Reads new Date(), calls formatters, writes to DOM
```

**Lifecycle**: `updateClock()` is called once immediately on load, then via `setInterval(updateClock, 1000)`.

---

### 2. Focus Timer

**Responsibility**: 25-minute countdown timer with Start / Stop / Reset controls and a session-end alert.

**DOM anchors**:
- `#timer-display` — MM:SS readout
- `#timer-label` — status/alert text
- `#timer-start`, `#timer-stop`, `#timer-reset` — control buttons

**State machine**:

```
        ┌─────────────┐
 Reset  │             │ Start
───────▶│   IDLE      │──────────────────┐
        │  (25:00)    │                  │
        └─────────────┘                  ▼
              ▲                   ┌─────────────┐
              │     Stop          │   RUNNING   │
              │◀──────────────────│  (counting) │
              │                   └──────┬──────┘
              │                          │ reaches 00:00
              │                          ▼
              │                   ┌─────────────┐
              └───────────────────│  COMPLETE   │
               Reset              │  (alert)    │
                                  └─────────────┘
```

**Public interface**:

```
formatTime(seconds: number): string
  // seconds ∈ [0, 1500]
  // Returns "MM:SS" zero-padded

startTimer(): void   // IDLE/PAUSED → RUNNING
stopTimer(): void    // RUNNING → PAUSED
resetTimer(): void   // any → IDLE
```

**Internal state variables** (module-scoped):
- `timeRemaining: number` — seconds left (init: 1500)
- `timerRunning: boolean` — true while interval is active
- `timerInterval: number | null` — `setInterval` handle

**Constraint**: `timeRemaining` is never decremented below 0.

---

### 3. To-Do List

**Responsibility**: Full CRUD lifecycle for task items with localStorage persistence.

**DOM anchors**:
- `#todo-input` — text input for new task label
- `#todo-add` — submit button
- `#todo-list` — `<ul>` rendered task list
- `#todo-empty` — empty-state `<p>` (visible when list is empty)
- `#edit-modal` — modal overlay for inline editing
- `#edit-input`, `#edit-save`, `#edit-cancel` — modal controls

**Public interface**:

```
addTodo(): void
  // Reads #todo-input, validates, appends, saves, re-renders

toggleTodo(index: number): void
  // Flips completed state of task at index, saves, re-renders

deleteTodo(index: number): void
  // Removes task at index, saves, re-renders

openEditModal(index: number): void
  // Populates #edit-input, shows modal

saveEditModal(): void
  // Validates, updates task label, saves, re-renders, closes modal

closeEditModal(): void
  // Discards changes, closes modal

renderTodos(): void
  // Reads from localStorage, rebuilds #todo-list DOM
```

**Validation rules**:
- Empty / whitespace-only label → rejected; input retains focus
- Label > 200 chars after trim → rejected; error message shown; input retains focus
- Edit confirmed with whitespace-only value → rejected; edit input stays open

**Edit UX**: Edit mode is modal (overlay). Only one task can be in edit mode at a time. Escape or click-outside cancels. Closing any other way commits.

---

### 4. Quick Links

**Responsibility**: Manage saved URLs as labelled launcher buttons.

**DOM anchors**:
- `#link-name-input`, `#link-url-input` — inputs for new link
- `#link-add` — submit button
- `#links-grid` — grid of rendered link buttons
- `#links-empty` — empty-state `<p>`

**Public interface**:

```
normaliseUrl(url: string): string
  // If url does not start with "http://" or "https://",
  // prepends "https://". Returns normalised URL.

isValidUrl(url: string): boolean
  // Returns true if URL can be parsed and protocol is http/https

addLink(): void
  // Validates label + URL, normalises URL, saves, re-renders

deleteLink(index: number): void
  // Removes link at index, saves, re-renders

renderLinks(): void
  // Reads from localStorage, rebuilds #links-grid DOM
```

**Delete control**: The delete button (`.link-delete`) is always visible on each link card — not hidden behind hover — to satisfy Requirement 8.3.

---

### 5. Storage Layer

All reads and writes go through two shared utility functions to centralise error handling.

```
loadData(key: string, defaultValue: any): any
  // Reads localStorage[key], parses JSON.
  // If key is absent, or JSON is invalid, or parsed value
  // does not pass structural validation → returns defaultValue.

saveData(key: string, value: any): void
  // Serialises value to JSON string, writes to localStorage[key].
  // If localStorage throws (quota exceeded, private mode, etc.),
  // logs to console and shows the in-page warning banner.
```

**Storage keys** (constants):
- `tdld_tasks` — task array
- `tdld_links` — link array

**Structural validation** (applied in `loadData`):
- For `tdld_tasks`: value must be an `Array` where every element has a `string` field `text` and a `boolean` field `completed`.
- For `tdld_links`: value must be an `Array` where every element has `string` fields `name` and `url`.
- Any structural mismatch → discard, return `[]`.

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string}  text       - Trimmed task label (1–200 chars)
 * @property {boolean} completed  - true if marked done
 */
```

Stored as a JSON array under `localStorage["tdld_tasks"]`:

```json
[
  { "text": "Finish report", "completed": false },
  { "text": "Buy groceries", "completed": true }
]
```

Array order is the display order. No generated IDs are needed because operations reference items by their index in the canonical array.

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} name - Display label for the button
 * @property {string} url  - Fully qualified URL (always http:// or https://)
 */
```

Stored as a JSON array under `localStorage["tdld_links"]`:

```json
[
  { "name": "GitHub", "url": "https://github.com" },
  { "name": "MDN",    "url": "https://developer.mozilla.org" }
]
```

### Timer State (in-memory only — not persisted)

```js
/**
 * @typedef {Object} TimerState
 * @property {number}       timeRemaining  - Seconds remaining (0–1500)
 * @property {boolean}      timerRunning   - Whether interval is active
 * @property {number|null}  timerInterval  - setInterval handle
 */
```

Timer state is intentionally **not** persisted to `localStorage` — there is no requirement to resume a timer across page reloads.

### LocalStorage Schema Diagram

```
localStorage
├── "tdld_tasks"  →  JSON string → Task[]
└── "tdld_links"  →  JSON string → Link[]
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Time formatting is always valid HH:MM:SS in 24-hour range

*For any* `Date` object, `formatTime24(date)` shall return a string matching the pattern `HH:MM:SS` where HH is in `[00, 23]`, MM is in `[00, 59]`, and SS is in `[00, 59]`.

**Validates: Requirements 2.1**

---

### Property 2: Date formatting always contains all required components

*For any* `Date` object, `formatDateLong(date)` shall return a string that contains: the full weekday name (one of Sunday–Saturday), the numeric day, the full month name (one of January–December), and the 4-digit year.

**Validates: Requirements 2.2**

---

### Property 3: Greeting is determined solely by hour and covers all hours

*For any* integer hour in `[0, 23]`, `getGreeting(hour)` shall return exactly one of the four greeting strings, with the following partition holding:
- `[5, 11]` → `"Good Morning!"`
- `[12, 17]` → `"Good Afternoon!"`
- `[18, 20]` → `"Good Evening!"`
- `[21, 23] ∪ [0, 4]` → `"Good Night!"`

No hour shall map to more than one greeting, and no hour shall be unhandled.

**Validates: Requirements 2.3, 2.4, 2.5, 2.6**

---

### Property 4: Timer format is always valid MM:SS

*For any* integer `seconds` in `[0, 1500]`, `formatTime(seconds)` shall return a string matching `MM:SS` where both parts are zero-padded to exactly two digits and the value faithfully represents the input (e.g., `formatTime(90)` → `"01:30"`).

**Validates: Requirements 3.3, 3.10**

---

### Property 5: Adding any valid task increases the list length by exactly one

*For any* task list of length `n` and any string whose trimmed form is between 1 and 200 characters, calling `addTodo()` with that string shall result in the task list having length `n + 1`, with the new task appended at position `n` and its `completed` state initialised to `false`.

**Validates: Requirements 4.2**

---

### Property 6: Whitespace-only task labels are always rejected

*For any* string whose trimmed form is empty (i.e., the string is empty or consists entirely of whitespace characters), `addTodo()` shall leave the task list completely unchanged.

**Validates: Requirements 4.3**

---

### Property 7: Task addition is immediately reflected in LocalStorage (round-trip)

*For any* valid task label, after `addTodo()` completes, `JSON.parse(localStorage.getItem("tdld_tasks"))` shall deserialise to an array whose last element has a `text` field equal to the trimmed label and a `completed` field equal to `false`.

**Validates: Requirements 4.5, 9.3**

---

### Property 8: Task edit with valid input updates exactly the target task

*For any* task list, any valid index `i`, and any non-whitespace new label, after `saveEditModal()` completes for task `i`, the task at index `i` shall have `text` equal to the trimmed new label; all other tasks in the list shall remain unchanged.

**Validates: Requirements 5.3, 5.5**

---

### Property 9: Whitespace-only edit input is always rejected

*For any* string whose trimmed form is empty (whitespace-only or empty string), confirming an edit with that input shall leave the task's `text` field unchanged.

**Validates: Requirements 5.4**

---

### Property 10: Completion toggle is a round-trip (idempotent inverse)

*For any* task, calling `toggleTodo(index)` twice shall restore the task's `completed` state to its original value. After exactly one toggle, the state shall be the boolean complement of the original state. Furthermore, after any toggle, `localStorage["tdld_tasks"]` shall reflect the updated state.

**Validates: Requirements 6.2, 6.3, 6.4**

---

### Property 11: Deleting a task removes exactly that task and no others

*For any* task list of length `n > 0` and any valid index `i`, after `deleteTodo(i)`:
- The list length shall be `n - 1`.
- The task that was at index `i` shall not appear at any position in the updated list.
- All tasks that were at indices `0…i-1` and `i+1…n-1` shall remain present in their relative order.

**Validates: Requirements 6.6**

---

### Property 12: URL normalisation always produces an http/https URL

*For any* non-empty string that does not begin with `"http://"` or `"https://"`, `normaliseUrl(url)` shall return a string that begins with `"https://"` and is otherwise equal to the input (i.e., `"https://" + url`).

*For any* string that already begins with `"http://"` or `"https://"`, `normaliseUrl(url)` shall return the string unchanged.

**Validates: Requirements 7.4, 8.2**

---

### Property 13: Adding any valid link increases the links list by exactly one

*For any* links list of length `n`, a non-whitespace label, and a valid URL, after `addLink()`, the links list shall have length `n + 1`, with the new entry containing the provided label and the normalised URL.

**Validates: Requirements 7.2**

---

### Property 14: Whitespace-only link labels are always rejected

*For any* string whose trimmed form is empty, `addLink()` shall leave the links list completely unchanged.

**Validates: Requirements 7.3**

---

### Property 15: Deleting a link removes exactly that entry

*For any* links list of length `n > 0` and any valid index `i`, after `deleteLink(i)`:
- The list length shall be `n - 1`.
- The link at index `i` shall not appear in the updated list.
- All other links shall remain in their relative order.

**Validates: Requirements 8.4**

---

### Property 16: JSON serialisation round-trip preserves all data

*For any* array of `Task` or `Link` objects, `JSON.parse(JSON.stringify(data))` shall produce an array that deep-equals the original — every field, value, and order preserved.

**Validates: Requirements 9.3**

---

## Error Handling

### LocalStorage Unavailable

Some browsers disable `localStorage` in private/incognito mode, or a strict Content Security Policy may block it. The storage layer wraps every read and write in `try/catch`:

```
On write failure:
  - Data remains in the in-memory array for the current session.
  - A non-blocking warning banner (#storage-warning) becomes visible
    above the dashboard content. It reads: "Storage unavailable —
    changes will not persist after this session."
  - The banner does not intercept click events on any other element.

On read failure (bad JSON / wrong structure):
  - The affected data collection (tasks or links) is initialised as [].
  - The session is treated as a fresh start for that collection.
  - No error banner is shown for a corrupted read (silent recovery).
```

### JS/CSS Load Failure

- **CSS missing**: The page remains functional; all buttons and inputs are accessible. Visual hierarchy degrades to browser defaults.
- **JS missing**: A `<noscript>` tag and an inline error `<p>` (injected via a `<script>` tag that runs first) display: *"Application could not start. Please enable JavaScript."* This message is non-blocking.

### Input Validation Errors

- **Task label too long (> 200 chars)**: An inline error message appears below the input field. The task is not added. The input retains focus.
- **Empty URL submission**: The URL input field receives focus and a brief visual error state (red border via `.input-error` class).
- All validation errors are cleared on the next successful submission.

### Timer Edge Cases

- Calling `startTimer()` while already running is a no-op (guarded by `timerRunning` flag).
- `timeRemaining` is clamped at `0` — never goes negative.
- `clearInterval` is always called before setting a new interval to prevent double-counting.

### XSS Prevention

All user-supplied strings (task labels, link names, URLs) are sanitised before insertion into the DOM using the `escapeHtml` utility, which creates a `TextNode` to let the browser handle encoding:

```js
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
```

Link `href` attributes are set via `element.href = url` (not `innerHTML`) to prevent `javascript:` injection.

---

## Testing Strategy

### Dual Testing Approach

Testing combines **example-based unit tests** (concrete scenarios) and **property-based tests** (universal properties across many generated inputs). Both are complementary:

- Unit tests catch specific regressions and document expected behaviour.
- Property tests explore the entire input space and catch edge cases that examples miss.

### Test Setup

Since the application uses no build tools or module system, tests are run via **Jest** with **jsdom** (simulates browser APIs including `localStorage` and the DOM) and **fast-check** for property-based testing.

```
npm install --save-dev jest jest-environment-jsdom fast-check
```

Each test file imports pure functions extracted from `app.js`. Functions that depend on DOM elements (e.g., `renderTodos`) are integration-tested against a jsdom environment.

### Unit Tests (Example-Based)

| Area | Test Scenarios |
|------|---------------|
| Greeting Widget | Initial load displays correct greeting; boundary at 11:59→12:00 |
| Timer | Initial state is "25:00"; Start then Stop pauses; Reset returns to "25:00"; timer halts at "00:00" and shows alert; double-Start is idempotent |
| To-Do List | Add valid task; reject empty string; reject 201-char label; delete last task shows empty-state; edit cancel restores original; edit Escape closes modal |
| Quick Links | Add valid link; reject empty label; empty URL rejected; delete link; click opens new tab |
| LocalStorage | Invalid JSON returns []; wrong structure returns []; missing key returns [] |
| Responsiveness | No overflow at 320px, 768px, 1280px, 2560px viewport widths |

### Property-Based Tests (fast-check)

Each property test runs a **minimum of 100 iterations**. Each is tagged with the design property it validates.

```js
// Tag format: Feature: todo-life-dashboard, Property N: <property text>
```

| Property | Generator Strategy |
|----------|-------------------|
| P1 — Time format HH:MM:SS | `fc.date()` → arbitrary Date objects |
| P2 — Date format contains all components | `fc.date()` → arbitrary Date objects |
| P3 — Greeting covers all hours | `fc.integer({ min: 0, max: 23 })` |
| P4 — Timer format MM:SS | `fc.integer({ min: 0, max: 1500 })` |
| P5 — Valid task increases list by 1 | `fc.array(taskArb)` × `fc.string({ minLength: 1, maxLength: 200 })` |
| P6 — Whitespace task rejected | `fc.string().filter(s => s.trim() === '')` |
| P7 — Task addition round-trip | `fc.string({ minLength: 1, maxLength: 200 })` with mocked localStorage |
| P8 — Edit valid input updates target | `fc.array(taskArb, { minLength: 1 })` × `fc.integer` (index) × valid label |
| P9 — Whitespace edit rejected | Whitespace-string generator |
| P10 — Toggle round-trip | `fc.array(taskArb, { minLength: 1 })` × `fc.integer` (index) |
| P11 — Delete removes exactly one | `fc.array(taskArb, { minLength: 1 })` × `fc.integer` (index) |
| P12 — URL normalisation | `fc.string()` split into already-prefixed and un-prefixed |
| P13 — Valid link increases list by 1 | `fc.array(linkArb)` × valid (label, url) pair |
| P14 — Whitespace label rejected | Whitespace-string generator |
| P15 — Delete link removes exactly one | `fc.array(linkArb, { minLength: 1 })` × `fc.integer` (index) |
| P16 — JSON round-trip | `fc.array(fc.record({ text: fc.string(), completed: fc.boolean() }))` |

### Accessibility Checks

- Run **axe-core** on the rendered page to catch ARIA violations and missing labels.
- Verify `aria-label` attributes on all icon-only buttons (checkboxes, edit, delete, modal controls).
- Verify minimum 4.5:1 contrast ratio for the defined CSS custom properties using a contrast utility.

### Manual Regression Checklist

- [ ] Cross-browser smoke: Chrome, Firefox, Edge, Safari
- [ ] Offline mode: DevTools → Network → Offline — all interactions still work
- [ ] 320px viewport: no horizontal scroll
- [ ] localStorage full: verify warning banner appears
- [ ] Keyboard-only navigation: Tab through all controls, Enter/Escape in edit modal
