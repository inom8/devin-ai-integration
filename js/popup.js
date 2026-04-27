// Top-level popup controller. Wires the quick-add form, tabs, filters, and
// view rendering together.

(function () {
  "use strict";

  const state = { current: null, view: "today", filters: { priority: null, tag: null }, cleanups: [] };

  function runCleanups() {
    state.cleanups.forEach((fn) => {
      try { fn(); } catch (_) { /* ignore */ }
    });
    state.cleanups = [];
  }

  async function refresh() {
    state.current = await Store.getState();
    render();
  }

  function setView(v) {
    state.view = v;
    document.querySelectorAll("#tabs .tab").forEach((b) => {
      b.classList.toggle("active", b.dataset.view === v);
    });
    render();
  }

  function render() {
    const container = document.getElementById("view");
    runCleanups();
    Util.clear(container);

    renderProgress();
    renderFilters();

    const ctx = {
      filters: state.filters,
      onToggle: async (id) => { await Store.toggleTask(id); refresh(); rescheduleReminders(); },
      onDelete: async (id) => { await Store.deleteTask(id); refresh(); rescheduleReminders(); },
      onEdit: async (id, patch) => { await Store.updateTask(id, patch); refresh(); rescheduleReminders(); },
      onOpenEdit: (task) => openEditDialog(task),
      onAddSub: async (id, title) => { await Store.addSubtask(id, title); refresh(); },
      onToggleSub: async (id, sid) => { await Store.toggleSubtask(id, sid); refresh(); },
      onDeleteSub: async (id, sid) => { await Store.deleteSubtask(id, sid); refresh(); },
      onCleanup: (fn) => state.cleanups.push(fn),
    };

    const renderer = Views[state.view];
    if (renderer) renderer(container, state.current, ctx);
  }

  function renderProgress() {
    const p = Views.progressFor(state.current);
    document.getElementById("progress").textContent = p.label;
    document.getElementById("streak").textContent =
      "🔥 " + p.streak;
  }

  function renderFilters() {
    const facets = Views.facets(state.current);
    const filtersBar = document.getElementById("filters");
    const showFilters = state.view !== "focus" && state.view !== "projects";
    filtersBar.classList.toggle("hidden", !showFilters);
    if (!showFilters) return;

    const pri = document.getElementById("filter-priority");
    const tagBox = document.getElementById("filter-tag");
    Util.clear(pri);
    Util.clear(tagBox);

    facets.priorities.forEach((p) => {
      const b = Util.el("button", {
        class: "chip" + (state.filters.priority === p ? " active" : ""),
        text: "P" + p,
      });
      b.style.borderColor = Util.priorityColor(p);
      b.style.color = state.filters.priority === p ? "#fff" : Util.priorityColor(p);
      if (state.filters.priority === p) b.style.background = Util.priorityColor(p);
      b.onclick = () => {
        state.filters.priority = state.filters.priority === p ? null : p;
        render();
      };
      pri.appendChild(b);
    });

    facets.tags.forEach((t) => {
      const b = Util.el("button", {
        class: "chip" + (state.filters.tag === t ? " active" : ""),
        text: "#" + t,
      });
      b.onclick = () => {
        state.filters.tag = state.filters.tag === t ? null : t;
        render();
      };
      tagBox.appendChild(b);
    });
  }

  // -------- Quick add --------

  function showParsedPreview(parsed) {
    const box = document.getElementById("parsed-preview");
    if (!parsed.title) {
      box.classList.remove("show");
      box.innerHTML = "";
      return;
    }
    const bits = [];
    if (parsed.due) bits.push(`📅 ${Util.formatDue(parsed.due)}`);
    if (parsed.priority < 4) bits.push(`<span style="color:${Util.priorityColor(parsed.priority)}">P${parsed.priority}</span>`);
    if (parsed.projectName) bits.push(`@${Util.escapeHtml(parsed.projectName)}`);
    if (parsed.tags && parsed.tags.length) bits.push(parsed.tags.map((t) => "#" + Util.escapeHtml(t)).join(" "));
    if (parsed.recurrence) bits.push(`↻ ${Parser.describeRecurrence(parsed.recurrence)}`);
    if (!bits.length) {
      box.classList.remove("show");
      box.innerHTML = "";
      return;
    }
    box.innerHTML =
      `<span class="muted">→ ${Util.escapeHtml(parsed.title)}</span> ` + bits.join(" · ");
    box.classList.add("show");
  }

  function setupQuickAdd() {
    const form = document.getElementById("quick-add-form");
    const input = document.getElementById("quick-add-input");
    const debounced = Util.debounce(() => {
      if (!input.value.trim()) {
        showParsedPreview({ title: "" });
        return;
      }
      showParsedPreview(Parser.parse(input.value));
    }, 100);
    input.addEventListener("input", debounced);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;
      const parsed = Parser.parse(raw);
      await Store.addTaskFromQuick(parsed);
      input.value = "";
      showParsedPreview({ title: "" });
      refresh();
      rescheduleReminders();
    });
  }

  // -------- Tabs / filters / footer --------

  function setupTabs() {
    document.getElementById("tabs").addEventListener("click", (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      setView(b.dataset.view);
    });
    document.getElementById("clear-filters").addEventListener("click", () => {
      state.filters = { priority: null, tag: null };
      render();
    });
    document.getElementById("open-options").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // -------- Edit dialog --------

  function openEditDialog(task) {
    const overlay = Util.el("div", { class: "overlay" });
    const dialog = Util.el("div", { class: "dialog" });

    const titleInput = Util.el("input", { type: "text", value: task.title });
    const notesInput = Util.el("textarea", { rows: "3", placeholder: "Notes" });
    notesInput.value = task.notes || "";

    const dueInput = Util.el("input", { type: "datetime-local" });
    if (task.due) {
      const d = new Date(task.due);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      dueInput.value = d.toISOString().slice(0, 16);
    }

    const prioritySelect = Util.el("select");
    [1, 2, 3, 4].forEach((p) => {
      const opt = Util.el("option", { value: String(p), text: p === 4 ? "No priority" : "P" + p });
      if (task.priority === p) opt.selected = true;
      prioritySelect.appendChild(opt);
    });

    const projectSelect = Util.el("select");
    projectSelect.appendChild(Util.el("option", { value: "", text: "Inbox (no project)" }));
    state.current.projects.forEach((p) => {
      const opt = Util.el("option", { value: p.id, text: p.name });
      if (task.projectId === p.id) opt.selected = true;
      projectSelect.appendChild(opt);
    });

    const tagsInput = Util.el("input", {
      type: "text",
      placeholder: "tags, comma separated",
      value: (task.tags || []).join(", "),
    });

    const reminderInput = Util.el("input", {
      type: "number",
      min: "0",
      placeholder: "Reminder min before",
    });
    if (task.reminderMinutesBefore != null) reminderInput.value = String(task.reminderMinutesBefore);

    const recurrenceText = Util.el("input", {
      type: "text",
      placeholder: "Recurrence (e.g. every monday, every day)",
      value: task.recurrence ? Parser.describeRecurrence(task.recurrence) : "",
    });

    const buttons = Util.el("div", { class: "dialog-buttons" });
    const save = Util.el("button", { class: "primary", text: "Save" });
    const cancel = Util.el("button", { class: "secondary", text: "Cancel" });
    buttons.append(save, cancel);

    save.onclick = async () => {
      const patch = {
        title: titleInput.value.trim() || task.title,
        notes: notesInput.value.trim(),
        priority: parseInt(prioritySelect.value, 10),
        projectId: projectSelect.value || null,
        tags: tagsInput.value
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
        reminderMinutesBefore: reminderInput.value === "" ? null : parseInt(reminderInput.value, 10),
        due: dueInput.value ? new Date(dueInput.value).toISOString() : null,
      };
      if (recurrenceText.value.trim()) {
        const parsed = Parser.parse("placeholder " + recurrenceText.value.trim());
        patch.recurrence = parsed.recurrence;
      } else {
        patch.recurrence = null;
      }
      await Store.updateTask(task.id, patch);
      document.body.removeChild(overlay);
      refresh();
      rescheduleReminders();
    };
    cancel.onclick = () => document.body.removeChild(overlay);

    function row(label, node) {
      const r = Util.el("label", { class: "dialog-row" });
      r.append(Util.el("span", { class: "dialog-label", text: label }), node);
      return r;
    }

    dialog.append(
      Util.el("h3", { text: "Edit task" }),
      row("Title", titleInput),
      row("Notes", notesInput),
      row("Due", dueInput),
      row("Priority", prioritySelect),
      row("Project", projectSelect),
      row("Tags", tagsInput),
      row("Reminder (min)", reminderInput),
      row("Recurrence", recurrenceText),
      buttons
    );
    overlay.appendChild(dialog);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
    document.body.appendChild(overlay);
    setTimeout(() => titleInput.focus(), 0);
  }

  // -------- Reminders --------

  function rescheduleReminders() {
    chrome.runtime.sendMessage({ type: "reminders:reschedule" });
  }

  // -------- Init --------

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    } else {
      delete document.documentElement.dataset.theme;
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    setupQuickAdd();
    setupTabs();
    await refresh();
    applyTheme(state.current && state.current.settings && state.current.settings.theme);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[Store.STORAGE_KEY]) {
        state.current = changes[Store.STORAGE_KEY].newValue || state.current;
        applyTheme(state.current && state.current.settings && state.current.settings.theme);
        render();
      }
    });
  });
})();
