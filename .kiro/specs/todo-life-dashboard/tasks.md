# Implementation Plan: To Do Life Dashboard

## Overview

The skeleton (index.html, css/style.css, js/app.js) is largely complete. These tasks close the gaps between the existing code and the full specification — fixing storage keys, input validation, error handling, XSS hardening, CSS visibility rules, and the JS load-failure message — then add the full Jest + fast-check test suite described in the design's Testing Strategy. Tasks are ordered so each step builds on the previous one, ending with integration, accessibility, and a final checkpoint.

---

## Tasks

- [x] 1. Fix HTML structure gaps
  - [x] 1.1 Update `index.html`: change task input `maxlength` from `120` to `200` and add a `<p id="todo-error">` element below the input row for inline validation errors
    - Also add a `<div id="storage-warning">` banner above `<main>` (hidden by default) for the LocalStorage unavailable message
    - Add a `<noscript>` tag inside `<body>` with the message: "Application could not start. Please enable JavaScript."
    - _Requirements: 1.8, 4.4, 9.5_

- [x] 2. Fix CSS/visual gaps
  - [x] 2.1 Make link delete buttons always visible by removing the `opacity: 0` / hover-reveal rule and setting `.link-delete { opacity: 1 }` permanently
    - _Requirements: 8.3_
  - [x]* 2.2 Add styles for `#storage-warning` (non-blocking top banner, visible warning colour) and `#todo-error` (inline red error text below the input row)
    - Also add `.input-error` border style for URL input validation feedback
    - _Requirements: 9.5, 4.4_

- [x] 3. Refactor `js/app.js` — extract and fix pure utility functions
  - [x] 3.1 Extract `formatTime24(date)` and `formatDateLong(date)` as standalone named functions (currently inlined inside `updateClock`), keeping `updateClock` calling them
    - This is required so property tests can import and test them directly
    - _Requirements: 2.1, 2.2_
  - [x] 3.2 Fix `getGreeting(hour)` boundary conditions: change boundaries to match spec exactly — `[5,11]` → Morning, `[12,17]` → Afternoon, `[18,20]` → Evening, `[21,23] ∪ [0,4]` → Night
    - Current code uses `< 12`, `< 17`, `< 21` which mismatches the spec at boundary hours 11, 17, 20
    - _Requirements: 2.3, 2.4, 2.5, 2.6_
  - [x] 3.3 Extract `normaliseUrl(url)` as a standalone named function (currently inlined inside `addLink`)
    - _Requirements: 7.4, 8.2_

- [x] 4. Fix storage keys and implement robust storage layer
  - [x] 4.1 Rename storage constants: `TODO_KEY` → `'tdld_tasks'` and `LINKS_KEY` → `'tdld_links'` (from current `todoLifeDashboard_todos` / `todoLifeDashboard_links`)
    - _Requirements: 9.1, 9.2_
  - [x] 4.2 Implement `loadData(key, defaultValue)` and `saveData(key, value)` utility functions with full structural validation
    - `loadData` must catch bad JSON and validate structure: for `tdld_tasks`, every element must have `string` field `text` and `boolean` field `completed`; for `tdld_links`, every element must have `string` fields `name` and `url`; return `defaultValue` on any mismatch
    - `saveData` must wrap `localStorage.setItem` in try/catch and show `#storage-warning` banner on failure
    - Replace the current bare `loadTodos` / `saveLinks` / etc. calls with `loadData` / `saveData`
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 5. Fix To-Do List logic gaps
  - [x] 5.1 Add 200-character validation in `addTodo()`: if `text.length > 200` after trimming, display an error message in `#todo-error`, retain focus on `#todo-input`, and do not create a task; clear the error on the next successful submission
    - _Requirements: 4.4_
  - [x] 5.2 Fix `openEditModal()`: after `editInput.value = todos[index].text`, position the cursor at the end of the text using `editInput.setSelectionRange(len, len)` instead of `editInput.select()` (which selects all text)
    - _Requirements: 5.2_

- [x] 6. Fix Quick Links XSS hardening
  - [x] 6.1 In `renderLinks()`, build the `<a>` element using `document.createElement('a')` and set `anchor.href = link.url` directly (not via `innerHTML`) to prevent `javascript:` injection; set label text via `anchor.textContent = link.name`
    - _Requirements: (design Error Handling — XSS Prevention)_

- [-] 7. Checkpoint — verify manual smoke test
  - Run the app in a browser, confirm: all four widgets render; greeting boundaries correct; timer counts down, pauses, resets; tasks add/edit/delete/toggle and persist under `tdld_tasks`; links add/delete and persist under `tdld_links`; `#storage-warning` banner hidden by default; noscript tag present; link delete buttons always visible.
  - Ensure all code changes so far are consistent and the page loads without console errors.

- [ ] 8. Set up test infrastructure
  - [ ] 8.1 Initialise npm project and install test dependencies: `npm init -y` then `npm install --save-dev jest jest-environment-jsdom fast-check`
    - Add `"test": "jest --testEnvironment jsdom"` script to `package.json`
    - Add Jest config in `package.json`: `"jest": { "testEnvironment": "jsdom" }`
    - _Requirements: (design Testing Strategy)_
  - [~] 8.2 Create `js/app.utils.js` that exports the pure utility functions (`getGreeting`, `formatTime24`, `formatDateLong`, `formatTime`, `normaliseUrl`, `isValidUrl`, `escapeHtml`, `loadData`, `saveData`) so Jest can import them without a browser DOM
    - `app.js` should call these from the shared module using a script tag or by inlining them first (keep `file://` compatibility — no ES module `import`; for Jest, use CommonJS `module.exports`)
    - _Requirements: (design Testing Strategy — Test Setup)_

- [ ] 9. Write unit tests (example-based)
  - [~] 9.1 Create `tests/greeting.test.js`: test `getGreeting` boundary values (hour 0, 4, 5, 11, 12, 17, 18, 20, 21, 23); test `formatTime24` produces correct `HH:MM:SS` for midnight, noon, 23:59:59; test `formatDateLong` contains weekday, day, month name, and year
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ]* 9.2 Create `tests/timer.test.js`: test initial state is `25:00`; `formatTime(90)` returns `'01:30'`; `formatTime(0)` returns `'00:00'`; `formatTime(1500)` returns `'25:00'`; verify `startTimer` sets running flag; `stopTimer` pauses; `resetTimer` restores `1500`; double `startTimer` is idempotent; timer halts at `00:00`
    - _Requirements: 3.1, 3.2, 3.4, 3.6, 3.7, 3.8, 3.11_
  - [ ]* 9.3 Create `tests/todo.test.js`: test `addTodo` with valid string; reject empty string; reject whitespace-only string; reject label > 200 chars; delete last task shows empty state; toggle changes `completed`; `saveEditModal` rejects whitespace; edit cancel restores original label
    - _Requirements: 4.2, 4.3, 4.4, 6.2, 6.3, 6.7, 5.3, 5.6_
  - [ ]* 9.4 Create `tests/links.test.js`: add valid link; reject empty label; reject empty URL; auto-prepend `https://`; delete link; verify link opens in new tab (mock `window.open`); `normaliseUrl` returns unchanged for already-prefixed URLs
    - _Requirements: 7.2, 7.3, 7.4, 8.1, 8.2, 8.4_
  - [ ]* 9.5 Create `tests/storage.test.js`: `loadData` returns default on invalid JSON; returns default on wrong structure (missing `text` field, wrong `completed` type); returns default on missing key; `saveData` writes valid JSON; shows warning on `localStorage` throw
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 10. Write property-based tests (fast-check)
  - [ ] 10.1 Create `tests/properties/greeting.prop.test.js`
    - [ ]* 10.1.1 Write property test for `formatTime24`
      - **Property 1: Time formatting is always valid HH:MM:SS in 24-hour range**
      - **Validates: Requirements 2.1**
    - [ ]* 10.1.2 Write property test for `formatDateLong`
      - **Property 2: Date formatting always contains all required components**
      - **Validates: Requirements 2.2**
    - [ ]* 10.1.3 Write property test for `getGreeting`
      - **Property 3: Greeting is determined solely by hour and covers all hours**
      - **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
  - [ ] 10.2 Create `tests/properties/timer.prop.test.js`
    - [ ]* 10.2.1 Write property test for `formatTime`
      - **Property 4: Timer format is always valid MM:SS**
      - **Validates: Requirements 3.3, 3.10**
  - [ ] 10.3 Create `tests/properties/todo.prop.test.js`
    - [ ]* 10.3.1 Write property test for `addTodo` with valid labels
      - **Property 5: Adding any valid task increases the list length by exactly one**
      - **Validates: Requirements 4.2**
    - [ ]* 10.3.2 Write property test for `addTodo` with whitespace-only input
      - **Property 6: Whitespace-only task labels are always rejected**
      - **Validates: Requirements 4.3**
    - [ ]* 10.3.3 Write property test for `addTodo` localStorage round-trip
      - **Property 7: Task addition is immediately reflected in LocalStorage (round-trip)**
      - **Validates: Requirements 4.5, 9.3**
    - [ ]* 10.3.4 Write property test for `saveEditModal` with valid input
      - **Property 8: Task edit with valid input updates exactly the target task**
      - **Validates: Requirements 5.3, 5.5**
    - [ ]* 10.3.5 Write property test for `saveEditModal` with whitespace input
      - **Property 9: Whitespace-only edit input is always rejected**
      - **Validates: Requirements 5.4**
    - [ ]* 10.3.6 Write property test for `toggleTodo` round-trip
      - **Property 10: Completion toggle is a round-trip (idempotent inverse)**
      - **Validates: Requirements 6.2, 6.3, 6.4**
    - [ ]* 10.3.7 Write property test for `deleteTodo`
      - **Property 11: Deleting a task removes exactly that task and no others**
      - **Validates: Requirements 6.6**
  - [ ] 10.4 Create `tests/properties/links.prop.test.js`
    - [ ]* 10.4.1 Write property test for `normaliseUrl`
      - **Property 12: URL normalisation always produces an http/https URL**
      - **Validates: Requirements 7.4, 8.2**
    - [ ]* 10.4.2 Write property test for `addLink` with valid inputs
      - **Property 13: Adding any valid link increases the links list by exactly one**
      - **Validates: Requirements 7.2**
    - [ ]* 10.4.3 Write property test for `addLink` with whitespace label
      - **Property 14: Whitespace-only link labels are always rejected**
      - **Validates: Requirements 7.3**
    - [ ]* 10.4.4 Write property test for `deleteLink`
      - **Property 15: Deleting a link removes exactly that entry**
      - **Validates: Requirements 8.4**
  - [ ] 10.5 Create `tests/properties/storage.prop.test.js`
    - [ ]* 10.5.1 Write property test for JSON serialisation round-trip
      - **Property 16: JSON serialisation round-trip preserves all data**
      - **Validates: Requirements 9.3**

- [~] 11. Final checkpoint — all tests pass
  - Run `npm test` and ensure all test suites pass with no failures.
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; they do not block core correctness.
- The test infrastructure tasks (8.1, 8.2) are prerequisites for all test tasks (9.x, 10.x).
- Task 4.1 (storage key rename) will clear any previously stored data in the old keys — this is intentional and required by the spec.
- The `file://` compatibility constraint means no ES module `import/export` in `app.js` itself; `app.utils.js` exports via CommonJS (`module.exports`) only for the Jest environment.
- Property tests use a minimum of 100 iterations each as described in the design's Testing Strategy.
- Each property test is tagged with its property number and the requirements clause it validates.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["2.2", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["4.1", "4.2", "5.1", "5.2", "6.1"] },
    { "id": 3, "tasks": ["8.1"] },
    { "id": 4, "tasks": ["8.2"] },
    { "id": 5, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "10.1", "10.2", "10.3", "10.4", "10.5"] },
    { "id": 6, "tasks": ["10.1.1", "10.1.2", "10.1.3", "10.2.1", "10.3.1", "10.3.2", "10.3.3", "10.3.4", "10.3.5", "10.3.6", "10.3.7", "10.4.1", "10.4.2", "10.4.3", "10.4.4", "10.5.1"] }
  ]
}
```
