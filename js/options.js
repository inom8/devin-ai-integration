// Options page controller.

(function () {
  "use strict";

  let state = null;

  async function load() {
    state = await Store.getState();
    document.getElementById("focus-duration").value = state.settings.focusDurationMin;
    document.getElementById("break-duration").value = state.settings.breakDurationMin;
    document.getElementById("default-reminder").value = state.settings.defaultReminderMinutesBefore;
    document.getElementById("enable-notifications").checked = !!state.settings.enableNotifications;
    renderProjects();
  }

  function renderProjects() {
    const list = document.getElementById("projects-list");
    list.innerHTML = "";
    state.projects.forEach((p) => {
      const li = Util.el("li", { class: "project-row" });
      const dot = Util.el("span", { class: "project-dot" });
      dot.style.background = p.color;
      const name = Util.el("span", { class: "project-name", text: p.name });
      const del = Util.el("button", {
        class: "danger small",
        text: "Delete",
        onclick: async () => {
          if (confirm(`Delete project "${p.name}"? Tasks in it will move to Inbox.`)) {
            await Store.deleteProject(p.id);
            state = await Store.getState();
            renderProjects();
          }
        },
      });
      li.append(dot, name, del);
      list.appendChild(li);
    });
  }

  function setupSettingHandlers() {
    document.getElementById("focus-duration").addEventListener("change", async (e) => {
      const v = Math.max(1, Math.min(180, parseInt(e.target.value, 10) || 50));
      await Store.updateSettings({ focusDurationMin: v });
      e.target.value = v;
      flash("Saved");
    });
    document.getElementById("break-duration").addEventListener("change", async (e) => {
      const v = Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 10));
      await Store.updateSettings({ breakDurationMin: v });
      e.target.value = v;
      flash("Saved");
    });
    document.getElementById("default-reminder").addEventListener("change", async (e) => {
      const v = Math.max(0, parseInt(e.target.value, 10) || 0);
      await Store.updateSettings({ defaultReminderMinutesBefore: v });
      e.target.value = v;
      flash("Saved");
    });
    document.getElementById("enable-notifications").addEventListener("change", async (e) => {
      await Store.updateSettings({ enableNotifications: e.target.checked });
      flash("Saved");
    });
  }

  function setupProjectForm() {
    document.getElementById("new-project-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("new-project-name").value.trim();
      const color = document.getElementById("new-project-color").value;
      if (!name) return;
      await Store.addProject(name, color);
      state = await Store.getState();
      renderProjects();
      document.getElementById("new-project-name").value = "";
    });
  }

  function setupDataHandlers() {
    document.getElementById("export-json").addEventListener("click", async () => {
      const txt = await Store.exportJSON();
      const blob = new Blob([txt], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-todo-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
    const fileInput = document.getElementById("import-file");
    document.getElementById("import-json").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const text = await f.text();
      try {
        await Store.importJSON(text);
        flash("Imported");
        await load();
      } catch (err) {
        alert("Could not import: " + err.message);
      }
    });
    document.getElementById("clear-completed").addEventListener("click", async () => {
      if (!confirm("Delete all completed tasks?")) return;
      await Store.clearCompleted();
      flash("Completed tasks cleared");
    });
    document.getElementById("clear-all").addEventListener("click", async () => {
      if (!confirm("Wipe ALL tasks, projects, and settings?")) return;
      await Store.resetAll();
      await load();
      flash("Reset");
    });
  }

  function flash(text) {
    const s = document.getElementById("status");
    s.textContent = text;
    setTimeout(() => {
      if (s.textContent === text) s.textContent = "";
    }, 1500);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await load();
    setupSettingHandlers();
    setupProjectForm();
    setupDataHandlers();
  });
})();
