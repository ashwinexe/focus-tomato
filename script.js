const STORAGE_KEY = "done-drift-tasks";

const defaultTasks = [
  { id: crypto.randomUUID(), title: "Review side project submission", done: false },
  { id: crypto.randomUUID(), title: "Ship the tiny todo app", done: false },
  { id: crypto.randomUUID(), title: "Keep tomorrow lighter", done: false },
];

const taskForm = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const taskList = document.querySelector("#task-list");
const taskTemplate = document.querySelector("#task-template");
const taskCount = document.querySelector("#task-count");
const clearDoneButton = document.querySelector("#clear-done");
const filterButtons = document.querySelectorAll(".filter-button");

const state = {
  tasks: loadTasks(),
  filter: "all",
};

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return defaultTasks;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function visibleTasks() {
  if (state.filter === "open") {
    return state.tasks.filter((task) => !task.done);
  }

  if (state.filter === "done") {
    return state.tasks.filter((task) => task.done);
  }

  return state.tasks;
}

function pluralize(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function render() {
  taskList.replaceChildren();

  const tasks = visibleTasks();
  tasks.forEach((task) => {
    const item = taskTemplate.content.firstElementChild.cloneNode(true);
    const toggle = item.querySelector(".task-toggle");
    const title = item.querySelector(".task-title");
    const deleteButton = item.querySelector(".delete-button");

    item.dataset.id = task.id;
    item.classList.toggle("completed", task.done);
    toggle.checked = task.done;
    title.textContent = task.title;
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

    taskList.append(item);
  });

  if (tasks.length === 0) {
    const emptyState = document.createElement("li");
    emptyState.className = "empty-state";
    emptyState.textContent = state.filter === "done" ? "No completed tasks yet." : "Nothing here. Add a task to get moving.";
    taskList.append(emptyState);
  }

  const openCount = state.tasks.filter((task) => !task.done).length;
  taskCount.textContent = `${pluralize(openCount, "open task")}`;
  clearDoneButton.disabled = state.tasks.every((task) => !task.done);

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === state.filter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function addTask(title) {
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title,
    done: false,
  });
  saveTasks();
  render();
}

function updateTask(id, updater) {
  state.tasks = state.tasks.map((task) => (task.id === id ? updater(task) : task));
  saveTasks();
  render();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }

  addTask(title);
  taskForm.reset();
  taskInput.focus();
});

taskList.addEventListener("change", (event) => {
  if (!event.target.matches(".task-toggle")) {
    return;
  }

  const item = event.target.closest(".task-item");
  updateTask(item.dataset.id, (task) => ({ ...task, done: event.target.checked }));
});

taskList.addEventListener("dblclick", (event) => {
  if (!event.target.matches(".task-title")) {
    return;
  }

  const item = event.target.closest(".task-item");
  const task = state.tasks.find((candidate) => candidate.id === item.dataset.id);
  const nextTitle = window.prompt("Rename task", task.title);
  const cleanTitle = nextTitle?.trim();

  if (cleanTitle) {
    updateTask(task.id, (currentTask) => ({ ...currentTask, title: cleanTitle }));
  }
});

taskList.addEventListener("click", (event) => {
  if (!event.target.matches(".delete-button")) {
    return;
  }

  const item = event.target.closest(".task-item");
  state.tasks = state.tasks.filter((task) => task.id !== item.dataset.id);
  saveTasks();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    render();
  });
});

clearDoneButton.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.done);
  saveTasks();
  render();
});

render();
