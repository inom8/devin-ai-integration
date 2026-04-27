// chrome.storage.local wrapper + task/project mutations.
// Loaded by popup, options, and (via importScripts) the service worker.

(function (root) {
  "use strict";

  const STORAGE_KEY = "studentTodoState_v1";

  const DEFAULTS = {
    tasks: [],
    projects: [
      { id: "school", name: "School", color: "#5b8def" },
      { id: "personal", name: "Personal", color: "#48a9a6" },
    ],
    settings: {
      focusDurationMin: 50,
      breakDurationMin: 10,
      defaultReminderMinutesBefore: 0,
      enableNotifications: true,
      theme: "system",
    },
    streak: { count: 0, lastCompletedDay: null },
  };

  function deepMerge(base, override) {
    const out = Array.isArray(base) ? [...base] : { ...base };
    for (const k of Object.keys(override || {})) {
      const v = override[k];
      if (v && typeof v === "object" && !Array.isArray(v) && base && typeof base[k] === "object" && !Array.isArray(base[k])) {
        out[k] = deepMerge(base[k], v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  function getRaw() {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        resolve(res[STORAGE_KEY] || null);
      });
    });
  }

  async function getState() {
    const raw = await getRaw();
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS));
    return deepMerge(DEFAULTS, raw);
  }

  function setState(state) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: state }, resolve);
    });
  }

  async function update(mutator) {
    const state = await getState();
    const next = mutator(state) || state;
    await setState(next);
    return next;
  }

  function newTask(input) {
    return {
      id: Util.uid(),
      title: input.title || "(untitled)",
      notes: input.notes || "",
      projectId: input.projectId || null,
      tags: input.tags || [],
      priority: input.priority || 4,
      due: input.due || null,
      reminderMinutesBefore:
        typeof input.reminderMinutesBefore === "number"
          ? input.reminderMinutesBefore
          : null,
      recurrence: input.recurrence || null,
      subtasks: input.subtasks || [],
      done: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  function ensureProjectByName(state, name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    let p = state.projects.find((x) => x.name.toLowerCase() === lower);
    if (!p) {
      p = {
        id: Util.uid(),
        name,
        color: pickProjectColor(state.projects.length),
      };
      state.projects.push(p);
    }
    return p.id;
  }

  function pickProjectColor(i) {
    const palette = [
      "#5b8def",
      "#48a9a6",
      "#e5484d",
      "#f5a524",
      "#9b59b6",
      "#2ecc71",
      "#34495e",
    ];
    return palette[i % palette.length];
  }

  // -------- Task mutations --------

  async function addTaskFromQuick(input, projectIdOverride) {
    return update((state) => {
      const projectId =
        projectIdOverride ||
        (input.projectName ? ensureProjectByName(state, input.projectName) : null);
      const reminder =
        input.reminderMinutesBefore != null
          ? input.reminderMinutesBefore
          : state.settings.defaultReminderMinutesBefore;
      const t = newTask({ ...input, projectId, reminderMinutesBefore: reminder });
      state.tasks.unshift(t);
      return state;
    });
  }

  async function updateTask(id, patch) {
    return update((state) => {
      const i = state.tasks.findIndex((t) => t.id === id);
      if (i < 0) return state;
      state.tasks[i] = { ...state.tasks[i], ...patch };
      return state;
    });
  }

  async function deleteTask(id) {
    return update((state) => {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      return state;
    });
  }

  async function toggleTask(id) {
    return update((state) => {
      const i = state.tasks.findIndex((t) => t.id === id);
      if (i < 0) return state;
      const t = state.tasks[i];
      const willComplete = !t.done;
      if (willComplete && t.recurrence) {
        // Roll the recurring task forward instead of marking done.
        const nextDue = Parser.nextRecurrence(t.due, t.recurrence);
        // Reset subtask completion for the next occurrence.
        const subtasks = (t.subtasks || []).map((s) => ({ ...s, done: false }));
        state.tasks[i] = { ...t, due: nextDue, subtasks };
        bumpStreak(state);
      } else {
        t.done = willComplete;
        t.completedAt = willComplete ? new Date().toISOString() : null;
        if (willComplete) bumpStreak(state);
      }
      return state;
    });
  }

  async function addSubtask(taskId, title) {
    return update((state) => {
      const t = state.tasks.find((x) => x.id === taskId);
      if (!t) return state;
      t.subtasks = t.subtasks || [];
      t.subtasks.push({ id: Util.uid(), title, done: false });
      return state;
    });
  }

  async function toggleSubtask(taskId, subId) {
    return update((state) => {
      const t = state.tasks.find((x) => x.id === taskId);
      if (!t) return state;
      const s = (t.subtasks || []).find((x) => x.id === subId);
      if (!s) return state;
      s.done = !s.done;
      return state;
    });
  }

  async function deleteSubtask(taskId, subId) {
    return update((state) => {
      const t = state.tasks.find((x) => x.id === taskId);
      if (!t) return state;
      t.subtasks = (t.subtasks || []).filter((x) => x.id !== subId);
      return state;
    });
  }

  function bumpStreak(state) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);
    const last = state.streak && state.streak.lastCompletedDay;
    if (last === todayKey) return;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    if (last === yKey) state.streak.count = (state.streak.count || 0) + 1;
    else state.streak.count = 1;
    state.streak.lastCompletedDay = todayKey;
  }

  // -------- Project mutations --------

  async function addProject(name, color) {
    return update((state) => {
      state.projects.push({
        id: Util.uid(),
        name,
        color: color || pickProjectColor(state.projects.length),
      });
      return state;
    });
  }

  async function deleteProject(id) {
    return update((state) => {
      state.projects = state.projects.filter((p) => p.id !== id);
      state.tasks.forEach((t) => {
        if (t.projectId === id) t.projectId = null;
      });
      return state;
    });
  }

  async function updateSettings(patch) {
    return update((state) => {
      state.settings = { ...state.settings, ...patch };
      return state;
    });
  }

  async function clearCompleted() {
    return update((state) => {
      state.tasks = state.tasks.filter((t) => !t.done);
      return state;
    });
  }

  async function resetAll() {
    return setState(JSON.parse(JSON.stringify(DEFAULTS)));
  }

  async function exportJSON() {
    const state = await getState();
    return JSON.stringify(state, null, 2);
  }

  async function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
    const merged = deepMerge(DEFAULTS, parsed);
    await setState(merged);
    return merged;
  }

  root.Store = {
    STORAGE_KEY,
    DEFAULTS,
    getState,
    setState,
    update,
    addTaskFromQuick,
    updateTask,
    deleteTask,
    toggleTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addProject,
    deleteProject,
    updateSettings,
    clearCompleted,
    resetAll,
    exportJSON,
    importJSON,
  };
})(typeof self !== "undefined" ? self : globalThis);
