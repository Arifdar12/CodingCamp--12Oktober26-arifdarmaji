/* ===================================================
   TO DO LIFE DASHBOARD — app.js
   ===================================================
   Sections:
     1. Greeting & Clock
     2. Focus Timer
     3. To-Do List
     4. Quick Links
     5. Edit Modal
   =================================================== */

'use strict';

// ===================================================
// 1. GREETING & CLOCK
// ===================================================

const greetingMsg = document.getElementById('greeting-msg');
const datetimeDisplay = document.getElementById('datetime-display');

function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning! ☀️';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon! 🌤';
  if (hour >= 18 && hour <= 20) return 'Good Evening! 🌙';
  return 'Good Night! 🌟';
}

function formatTime24(date) {
  const hour    = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hour}:${minutes}:${seconds}`;
}

function formatDateLong(date) {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const dayName   = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const day       = date.getDate();
  const year      = date.getFullYear();
  return `${dayName}, ${monthName} ${day}, ${year}`;
}

function updateClock() {
  const now = new Date();
  greetingMsg.textContent     = getGreeting(now.getHours());
  datetimeDisplay.textContent = `${formatDateLong(now)}  •  ${formatTime24(now)}`;
}

// Update clock every second
updateClock();
setInterval(updateClock, 1000);


// ===================================================
// 2. FOCUS TIMER
// ===================================================

const TIMER_DURATION = 25 * 60; // 25 minutes in seconds

const timerDisplay = document.getElementById('timer-display');
const timerLabel   = document.getElementById('timer-label');
const btnStart     = document.getElementById('timer-start');
const btnStop      = document.getElementById('timer-stop');
const btnReset     = document.getElementById('timer-reset');

let timerInterval  = null;
let timeRemaining  = TIMER_DURATION;
let timerRunning   = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeRemaining);
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerLabel.textContent = '🔥 Stay focused!';
  btnStart.disabled = true;
  btnStop.disabled  = false;

  timerInterval = setInterval(() => {
    timeRemaining--;
    renderTimer();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timeRemaining = 0;
      timerLabel.textContent = '🎉 Session complete! Take a break.';
      btnStart.disabled = false;
      btnStop.disabled  = true;
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerLabel.textContent = '⏸ Paused. Press Start to continue.';
  btnStart.disabled = false;
  btnStop.disabled  = true;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timeRemaining = TIMER_DURATION;
  timerLabel.textContent = 'Ready to focus?';
  btnStart.disabled = false;
  btnStop.disabled  = true;
  renderTimer();
}

btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click', stopTimer);
btnReset.addEventListener('click', resetTimer);

// Initial state: Stop disabled until timer starts
btnStop.disabled = true;
renderTimer();


// ===================================================
// 3. TO-DO LIST
// ===================================================

const todoInput  = document.getElementById('todo-input');
const btnAddTodo = document.getElementById('todo-add');
const todoList   = document.getElementById('todo-list');
const todoEmpty  = document.getElementById('todo-empty');
const todoError  = document.getElementById('todo-error');

// Task 4.1: renamed storage key constants
const TODO_KEY  = 'tdld_tasks';
const LINKS_KEY = 'tdld_links';

// Task 4.2: generic load/save utilities with structural validation
function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;

    const parsed = JSON.parse(raw);

    if (key === TODO_KEY) {
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (item) =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.text === 'string' &&
            typeof item.completed === 'boolean'
        )
      ) {
        return defaultValue;
      }
    } else if (key === LINKS_KEY) {
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (item) =>
            item !== null &&
            typeof item === 'object' &&
            typeof item.name === 'string' &&
            typeof item.url === 'string'
        )
      ) {
        return defaultValue;
      }
    } else {
      if (!Array.isArray(parsed)) return defaultValue;
    }

    return parsed;
  } catch {
    return defaultValue;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('localStorage write failed:', err);
    const banner = document.getElementById('storage-warning');
    if (banner) {
      banner.style.display = 'block';
      banner.classList.add('visible');
    }
  }
}

// Thin wrappers kept for internal use
function loadTodos() {
  return loadData(TODO_KEY, []);
}

function saveTodos(todos) {
  saveData(TODO_KEY, todos);
}

function renderTodos() {
  const todos = loadTodos();
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoEmpty.style.display = 'block';
    return;
  }

  todoEmpty.style.display = 'none';

  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.completed ? ' completed' : ''}`;
    li.setAttribute('data-index', index);

    li.innerHTML = `
      <input
        type="checkbox"
        class="todo-checkbox"
        aria-label="Mark as done"
        ${todo.completed ? 'checked' : ''}
      />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn btn-edit" aria-label="Edit task">✏️</button>
        <button class="btn btn-danger" aria-label="Delete task">🗑</button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector('.todo-checkbox').addEventListener('change', () => toggleTodo(index));

    // Edit button
    li.querySelector('.btn-edit').addEventListener('click', () => openEditModal(index));

    // Delete button
    li.querySelector('.btn-danger').addEventListener('click', () => deleteTodo(index));

    todoList.appendChild(li);
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Task 5.1: 200-character validation
  if (text.length > 200) {
    todoError.textContent    = 'Task label must be 200 characters or fewer.';
    todoError.style.display  = 'block';
    todoInput.focus();
    return;
  }

  // Clear any previous error on success
  todoError.style.display = 'none';
  todoError.textContent   = '';

  const todos = loadTodos();
  todos.push({ text, completed: false });
  saveTodos(todos);
  todoInput.value = '';
  renderTodos();
}

function toggleTodo(index) {
  const todos = loadTodos();
  if (todos[index]) {
    todos[index].completed = !todos[index].completed;
    saveTodos(todos);
    renderTodos();
  }
}

function deleteTodo(index) {
  const todos = loadTodos();
  todos.splice(index, 1);
  saveTodos(todos);
  renderTodos();
}

function updateTodoText(index, newText) {
  const todos = loadTodos();
  if (todos[index] && newText.trim()) {
    todos[index].text = newText.trim();
    saveTodos(todos);
    renderTodos();
  }
}

btnAddTodo.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTodo();
});

// Escape HTML to prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Initial render
renderTodos();


// ===================================================
// 4. QUICK LINKS
// ===================================================

const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const btnAddLink     = document.getElementById('link-add');
const linksGrid      = document.getElementById('links-grid');
const linksEmpty     = document.getElementById('links-empty');

// Thin wrappers kept for internal use
function loadLinks() {
  return loadData(LINKS_KEY, []);
}

function saveLinks(links) {
  saveData(LINKS_KEY, links);
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

// Task 6.1: DOM API construction for <a> to prevent XSS
function renderLinks() {
  const links = loadLinks();
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksEmpty.style.display = 'block';
    return;
  }

  linksEmpty.style.display = 'none';

  links.forEach((link, index) => {
    const div = document.createElement('div');
    div.className = 'link-item';

    // Build anchor via DOM API — no innerHTML for user-supplied values
    const anchor = document.createElement('a');
    anchor.href   = link.url;
    anchor.textContent = link.name;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';

    const deleteBtn = document.createElement('button');
    deleteBtn.className  = 'link-delete';
    deleteBtn.title      = 'Remove link';
    deleteBtn.setAttribute('aria-label', `Remove ${link.name}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      deleteLink(index);
    });

    div.appendChild(anchor);
    div.appendChild(deleteBtn);
    linksGrid.appendChild(div);
  });
}

function normaliseUrl(url) {
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

function addLink() {
  const name = linkNameInput.value.trim();
  let url    = normaliseUrl(linkUrlInput.value.trim());

  if (!name) {
    linkNameInput.focus();
    return;
  }

  if (!url || !isValidUrl(url)) {
    linkUrlInput.focus();
    return;
  }

  const links = loadLinks();
  links.push({ name, url });
  saveLinks(links);
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  renderLinks();
}

function deleteLink(index) {
  const links = loadLinks();
  links.splice(index, 1);
  saveLinks(links);
  renderLinks();
}

btnAddLink.addEventListener('click', addLink);

linkUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addLink();
});

linkNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') linkUrlInput.focus();
});

// Initial render
renderLinks();


// ===================================================
// 5. EDIT MODAL
// ===================================================

const editModal   = document.getElementById('edit-modal');
const editInput   = document.getElementById('edit-input');
const btnEditSave = document.getElementById('edit-save');
const btnEditCancel = document.getElementById('edit-cancel');

let editingIndex = null;

function openEditModal(index) {
  const todos = loadTodos();
  if (!todos[index]) return;

  editingIndex = index;
  editInput.value = todos[index].text;
  editModal.classList.add('active');
  editInput.focus();

  // Task 5.2: place cursor at end instead of selecting all text
  const len = editInput.value.length;
  editInput.setSelectionRange(len, len);
}

function closeEditModal() {
  editingIndex = null;
  editModal.classList.remove('active');
  editInput.value = '';
}

function saveEditModal() {
  if (editingIndex === null) return;
  const newText = editInput.value.trim();
  if (!newText) return;

  updateTodoText(editingIndex, newText);
  closeEditModal();
}

btnEditSave.addEventListener('click', saveEditModal);
btnEditCancel.addEventListener('click', closeEditModal);

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveEditModal();
  if (e.key === 'Escape') closeEditModal();
});

// Close modal when clicking outside of it
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});
