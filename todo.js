const STORAGE_KEY = "smartTodo.tasks.v1";

const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const priorityInput = document.getElementById("task-priority");
const deadlineInput = document.getElementById("task-deadline");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const sortBy = document.getElementById("sort-by");
const clearCompletedBtn = document.getElementById("clear-completed");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskTemplate = document.getElementById("task-template");
const totalCount = document.getElementById("total-count");
const activeCount = document.getElementById("active-count");
const completedCount = document.getElementById("completed-count");
const progressBar = document.getElementById("progress-bar");

let tasks = loadTasks();

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(isoDate) {
  if (!isoDate) {
    return "期限なし";
  }

  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "期限なし" : date.toLocaleDateString("ja-JP");
}

function deadlineRank(isoDate) {
  if (!isoDate) {
    return Number.POSITIVE_INFINITY;
  }
  const time = new Date(`${isoDate}T00:00:00`).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function priorityRank(priority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

function isOverdue(task) {
  if (!task.deadline || task.completed) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadlineRank(task.deadline) < today.getTime();
}

function getFilteredTasks() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const sort = sortBy.value;

  let filtered = tasks.filter((task) => {
    const byQuery = task.title.toLowerCase().includes(query);
    const byStatus =
      status === "all" ||
      (status === "active" && !task.completed) ||
      (status === "completed" && task.completed);
    return byQuery && byStatus;
  });

  filtered.sort((a, b) => {
    if (sort === "priority") {
      return priorityRank(a.priority) - priorityRank(b.priority) || b.createdAt - a.createdAt;
    }

    if (sort === "deadline") {
      return deadlineRank(a.deadline) - deadlineRank(b.deadline) || b.createdAt - a.createdAt;
    }

    return b.createdAt - a.createdAt;
  });

  return filtered;
}

function createTaskElement(task) {
  const node = taskTemplate.content.firstElementChild.cloneNode(true);
  const check = node.querySelector(".task-check");
  const title = node.querySelector(".task-title");
  const meta = node.querySelector(".task-meta");
  const deleteBtn = node.querySelector(".task-delete");

  node.dataset.priority = task.priority;
  if (task.completed) {
    node.classList.add("is-completed");
  }

  check.checked = task.completed;
  check.addEventListener("change", () => {
    task.completed = check.checked;
    saveTasks();
    render();
  });

  title.textContent = task.title;

  const priorityText = task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低";
  const overdueText = isOverdue(task) ? " / 期限切れ" : "";
  meta.textContent = `優先度: ${priorityText} / 期限: ${formatDate(task.deadline)}${overdueText}`;

  deleteBtn.addEventListener("click", () => {
    tasks = tasks.filter((current) => current.id !== task.id);
    saveTasks();
    render();
  });

  return node;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;

  totalCount.textContent = String(total);
  activeCount.textContent = String(active);
  completedCount.textContent = String(completed);

  const ratio = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressBar.style.width = `${ratio}%`;
}

function render() {
  taskList.innerHTML = "";
  const list = getFilteredTasks();

  list.forEach((task) => {
    taskList.append(createTaskElement(task));
  });

  emptyState.hidden = list.length !== 0;
  updateStats();
}

function createTask(data) {
  return {
    id: crypto.randomUUID(),
    title: data.title.trim(),
    priority: data.priority,
    deadline: data.deadline,
    completed: false,
    createdAt: Date.now(),
  };
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  const title = String(formData.get("title") || "").trim();

  if (!title) {
    return;
  }

  const task = createTask({
    title,
    priority: String(formData.get("priority") || "medium"),
    deadline: String(formData.get("deadline") || ""),
  });

  tasks.push(task);
  saveTasks();
  taskForm.reset();
  priorityInput.value = "medium";
  titleInput.focus();
  render();
});

searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);
sortBy.addEventListener("change", render);

clearCompletedBtn.addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter((task) => !task.completed);
  if (tasks.length !== before) {
    saveTasks();
    render();
  }
});

deadlineInput.min = new Date().toISOString().split("T")[0];

render();
