# Requirements Document

## Introduction

The **To Do Life Dashboard** is a single-page, client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides users with a personal productivity hub accessible in any modern browser or as a browser extension. The dashboard combines four core widgets — a contextual Greeting, a Focus Timer, a To-Do List, and a Quick Links launcher — into a clean, minimal interface. All user data is persisted exclusively in the browser's Local Storage API; no backend, account, or network connection is required.

---

## Glossary

- **Dashboard**: The single HTML page that hosts all four widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-sensitive greeting message.
- **Timer**: The Focus Timer component that counts down from 25 minutes.
- **TodoList**: The To-Do List component that manages task items.
- **Task**: A single to-do item with a text label and a completion state.
- **QuickLinks**: The Quick Links component that manages and launches bookmarked URLs.
- **Link**: A single quick-link entry containing a label and a URL.
- **LocalStorage**: The browser's `localStorage` API used for all client-side data persistence.
- **User**: The person interacting with the Dashboard in a browser.

---

## Requirements

### Requirement 1: Dashboard Layout and Initialisation

**User Story:** As a User, I want the Dashboard to load instantly in my browser with all widgets visible, so that I can start working without any setup.

#### Acceptance Criteria

1. THE Dashboard SHALL load and render all four widgets (Greeting_Widget, Timer, TodoList, QuickLinks) within a single HTML page without any server-side processing.
2. THE Dashboard SHALL apply styles from exactly one CSS file located at `css/style.css` and execute logic from exactly one JavaScript file located at `js/app.js`.
3. THE Dashboard SHALL be fully functional in the latest stable versions of Chrome, Firefox, Edge, and Safari without installing any third-party dependencies.
4. WHEN the Dashboard is loaded for the first time with no existing LocalStorage data, THE Dashboard SHALL display an empty-state message in the TodoList (e.g., "No tasks yet"), an empty-state message in the QuickLinks (e.g., "No links yet"), and the Timer SHALL show `25:00`.
5. THE Dashboard SHALL present a clear visual hierarchy using font size, weight, and spacing so that all widget titles, controls, and content are visually distinct from one another.
6. THE Dashboard SHALL render body text and interactive controls with a minimum contrast ratio of 4.5:1 between foreground and background colours.
7. IF the `css/style.css` file fails to load, THE Dashboard SHALL remain functional with all interactive controls accessible, even if unstyled.
8. IF the `js/app.js` file fails to load, THE Dashboard SHALL display a visible, non-blocking error message indicating that the application could not start.
9. WHEN the Dashboard is rendered, THE Dashboard SHALL display all four widgets without horizontal scrolling on the initial viewport.

---

### Requirement 2: Greeting Widget

**User Story:** As a User, I want to see the current time, date, and a greeting matched to the time of day, so that the Dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time, updated every second, formatted as `HH:MM:SS` in 24-hour notation using the browser's system clock.
2. THE Greeting_Widget SHALL display the current local date, formatted to include the full weekday name, day, month name, and year (e.g., `Thursday, 16 October 2026`).
3. WHEN the local time is between 05:00 and 11:59 (inclusive), THE Greeting_Widget SHALL display the message `Good Morning`.
4. WHEN the local time is between 12:00 and 17:59 (inclusive), THE Greeting_Widget SHALL display the message `Good Afternoon`.
5. WHEN the local time is between 18:00 and 20:59 (inclusive), THE Greeting_Widget SHALL display the message `Good Evening`.
6. WHEN the local time is between 21:00 and 04:59 (inclusive, wrapping midnight), THE Greeting_Widget SHALL display the message `Good Night`.
7. WHEN the local time crosses a greeting boundary (e.g., from 11:59 to 12:00), THE Greeting_Widget SHALL update the greeting message within one second of the boundary crossing without requiring a page reload.
8. WHEN the Dashboard is first loaded, THE Greeting_Widget SHALL immediately display the correct greeting message and current time and date based on the browser's system clock before the first user interaction.

---

### Requirement 3: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to manage my focus sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Timer SHALL display `25:00` as its initial state.
2. WHEN the User activates the Start control and the Timer is not already counting down, THE Timer SHALL begin counting down from its current displayed time in one-second intervals.
3. WHILE the Timer is counting down, THE Timer SHALL update the displayed time every second, decrementing by exactly one second per interval.
4. WHEN the User activates the Stop control while the Timer is counting down, THE Timer SHALL pause at the current displayed time without resetting.
5. WHEN the User activates the Start control after a Stop, THE Timer SHALL resume counting down from the paused time.
6. WHEN the User activates the Reset control, THE Timer SHALL stop counting down, restore the displayed time to `25:00`, and remove any session-end alert that is currently displayed.
7. WHEN the Timer reaches `00:00`, THE Timer SHALL stop counting down.
8. WHEN the Timer reaches `00:00`, THE Timer SHALL display a session-end alert message in the timer area (e.g., "Session complete! Take a break.") that remains visible until the User activates the Reset control.
9. WHILE the Timer is at `00:00`, THE Timer SHALL NOT continue counting below zero.
10. THE Timer SHALL display time in `MM:SS` format at all times.
11. WHEN the User activates the Start control while the Timer is already counting down, THE Timer SHALL continue counting without interruption or resetting.

---

### Requirement 4: To-Do List — Adding Tasks

**User Story:** As a User, I want to add new tasks to my to-do list, so that I can track the things I need to do.

#### Acceptance Criteria

1. THE TodoList SHALL provide a text input field and an Add control for creating new tasks.
2. WHEN the User submits a non-empty task label of 1 to 200 characters (after trimming leading and trailing whitespace) via the Add control or by pressing the Enter key in the input field, THE TodoList SHALL append a new Task with the trimmed label and an initial completion state of incomplete.
3. WHEN the User attempts to submit an empty or whitespace-only task label, THE TodoList SHALL NOT create a new Task and SHALL retain focus on the input field.
4. IF the User attempts to submit a task label exceeding 200 characters, THEN THE TodoList SHALL NOT create a new Task and SHALL display an error message indicating the label is too long, while retaining focus on the input field.
5. WHEN a new Task is created, THE TodoList SHALL save the updated task list to LocalStorage within 100 milliseconds of the submission event.
6. WHEN the Dashboard loads, THE TodoList SHALL retrieve and display all previously saved Tasks from LocalStorage in their persisted order and completion states.

---

### Requirement 5: To-Do List — Editing Tasks

**User Story:** As a User, I want to edit the label of an existing task, so that I can correct or update what needs to be done.

#### Acceptance Criteria

1. THE TodoList SHALL provide an Edit button on each Task item that is visible on the Task item at all times.
2. WHEN the User activates the Edit button on a Task, THE TodoList SHALL replace the Task's displayed label with an editable text input field pre-populated with the current label text and with the cursor placed at the end of the text.
3. WHEN the User confirms an edit by pressing Enter or clicking a Save button, and the input contains at least one non-whitespace character, THE TodoList SHALL update the Task's label to the trimmed input value and exit edit mode.
4. WHEN the User confirms an edit by pressing Enter or clicking a Save button, and the input is empty or contains only whitespace characters, THE TodoList SHALL NOT update the Task's label and SHALL keep the edit input field visible and focused.
5. WHEN a Task label is successfully updated, THE TodoList SHALL save the updated task list to LocalStorage within 100 milliseconds of the update.
6. WHEN the User cancels an edit by pressing Escape or clicking outside the edit input field, THE TodoList SHALL discard any changes, restore the Task's original label, and exit edit mode.

---

### Requirement 6: To-Do List — Completing and Deleting Tasks

**User Story:** As a User, I want to mark tasks as done and delete tasks I no longer need, so that I can maintain an accurate and tidy list.

#### Acceptance Criteria

1. THE TodoList SHALL provide a completion toggle (checkbox) on each Task item that is visible at all times.
2. WHEN the User activates the completion toggle on an incomplete Task, THE TodoList SHALL update the Task's completion state to complete, apply a strikethrough style to the Task label text, and reduce the opacity of the Task item.
3. WHEN the User activates the completion toggle on a complete Task, THE TodoList SHALL update the Task's completion state to incomplete, remove the strikethrough style from the Task label text, and restore the Task item's full opacity.
4. WHEN a Task's completion state changes, THE TodoList SHALL save the updated task list to LocalStorage before the next user interaction is processed.
5. THE TodoList SHALL provide a Delete button on each Task item that is visible at all times.
6. WHEN the User activates the Delete button on a Task, THE TodoList SHALL immediately remove that Task from the list with no confirmation prompt or undo affordance, and save the updated task list to LocalStorage before the next user interaction is processed.
7. WHEN the User deletes the last remaining Task, THE TodoList SHALL display the empty-state message.

---

### Requirement 7: Quick Links — Adding Links

**User Story:** As a User, I want to save favorite website URLs as named buttons, so that I can open them quickly from the Dashboard.

#### Acceptance Criteria

1. THE QuickLinks SHALL provide a label input field, a URL input field, and an Add control for creating new Links.
2. WHEN the User submits a non-empty, non-whitespace-only label and a non-empty URL that begins with `http://` or `https://` via the Add control, THE QuickLinks SHALL create a new Link entry and render it as a clickable button labelled with the provided label that opens the URL in a new browser tab.
3. WHEN the User submits a whitespace-only or empty label, THE QuickLinks SHALL NOT create a new Link and SHALL retain focus on the label input field.
4. WHEN the User submits an empty URL or a URL that does not begin with `http://` or `https://`, THE QuickLinks SHALL prepend `https://` if the URL is non-empty, and SHALL NOT create a new Link if the URL is empty after prepending.
5. WHEN a new Link is created, THE QuickLinks SHALL save the updated link list to LocalStorage before the next user interaction is processed.
6. WHEN the Dashboard loads, THE QuickLinks SHALL retrieve and display all previously saved Links from LocalStorage as clickable buttons.

---

### Requirement 8: Quick Links — Opening and Deleting Links

**User Story:** As a User, I want to open saved links and remove ones I no longer need, so that my quick links stay relevant.

#### Acceptance Criteria

1. WHEN the User activates the link area of a Link button (excluding the Delete control), THE QuickLinks SHALL open the associated URL in a new browser tab.
2. IF a saved Link's URL does not begin with `http://` or `https://`, THEN THE QuickLinks SHALL prepend `https://` to the URL before opening it.
3. THE QuickLinks SHALL display a Delete control that is always visible on each Link button.
4. WHEN the User activates the Delete control on a Link, THE QuickLinks SHALL permanently remove that Link with no undo affordance, save the updated link list to LocalStorage, and complete both actions within 500 milliseconds.

---

### Requirement 9: Data Persistence and Storage

**User Story:** As a User, I want my tasks and quick links to survive page reloads and browser restarts, so that I never lose my data.

#### Acceptance Criteria

1. THE Dashboard SHALL persist all Task data (label, completion state, order) under the LocalStorage key `tdld_tasks`.
2. THE Dashboard SHALL persist all Link data (label, URL, order) under the LocalStorage key `tdld_links`.
3. WHEN LocalStorage is written, THE Dashboard SHALL serialise the data as a valid JSON string.
4. WHEN LocalStorage is read, THE Dashboard SHALL deserialise the JSON string and reconstruct the in-memory state before rendering any tasks or links; IF the stored value is not valid JSON or does not match the expected data structure (e.g., missing required fields or wrong value types), THEN THE Dashboard SHALL discard the stored value, initialise that data collection as empty, and treat the session as a fresh start for that collection.
5. IF LocalStorage is unavailable or throws an error during a read or write operation, THEN THE Dashboard SHALL continue to operate in-memory for the current session and display a warning message in the UI that is visible to the User without blocking interaction with any other Dashboard element.
6. WHEN the User makes any change to Task or Link data (add, edit, delete, or toggle completion), THE Dashboard SHALL immediately write the updated data to LocalStorage before the next user interaction is accepted.
7. THE Dashboard SHALL NOT transmit any stored data to any external server or third-party service.

---

### Requirement 10: Responsiveness and Performance

**User Story:** As a User, I want the Dashboard to load fast and adapt to different screen sizes, so that I can use it comfortably on any device.

#### Acceptance Criteria

1. THE Dashboard SHALL render all widgets on viewport widths ranging from 320px to 2560px without horizontal scrolling, content overflow, overlapping elements, or clipped content.
2. WHEN the User performs an interaction (adding a task, toggling task completion, or clicking a link button), THE Dashboard SHALL reflect a visible UI update — the new task appearing in the list, the task's completion state changing, or the link activating respectively — within 100ms of the interaction event.
3. THE Dashboard SHALL NOT load any external fonts, scripts, or stylesheets that require a network connection, ensuring full functionality in offline environments.
4. WHEN the Dashboard is first opened, THE Dashboard SHALL display all widgets in a fully interactive state within 3 seconds on a standard broadband connection (10 Mbps or faster).
