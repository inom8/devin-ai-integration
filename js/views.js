// View renderers for the popup. Each renderer takes the current state
// + a render context and writes into the #view container.

(function (root) {
  "use strict";

  const Views = {};

  function getProject(state, id) {
    return state.projects.find((p) => p.id === id) || null;
  }

  function applyFilters(tasks, filters) {
    let out = tasks;
    if (filters.priority) out = out.filter((t) => t.priority === filters.priority);
    if (filters.tag) out = out.filter((t) => (t.tags || []).includes(filters.tag));
    return out;
  }

  function renderTask(task, state, ctx) {
    const tpl = document.getElementById("task-item-template");
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = task.id;
    if (task.done) node.classList.add("done");

    const check = node.querySelector(".check");
    check.style.borderColor = Util.priorityColor(task.priority);
    if (task.done) check.classList.add("checked");
    check.addEventListener("click", () => ctx.onToggle(task.id));

    const title = node.querySelector(".task-title");
    title.textContent = task.title;
    title.contentEditable = "true";
    title.spellcheck = true;
    title.addEventListener("blur", () => {
      const v = title.textContent.trim();
      if (v && v !== task.title) ctx.onEdit(task.id, { title: v });
      else if (!v) title.textContent = task.title;
    });
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        title.blur();
      }
    });

    const pri = node.querySelector(".task-priority");
    if (task.priority < 4) {
      pri.textContent = Util.priorityLabel(task.priority);
      pri.style.color = Util.priorityColor(task.priority);
      pri.style.borderColor = Util.priorityColor(task.priority);
    } else {
      pri.remove();
    }

    const due = node.querySelector(".task-due");
    if (task.due) {
      due.textContent = Util.formatDue(task.due);
      if (Util.isOverdue(task.due) && !task.done) due.classList.add("overdue");
    } else due.remove();

    const proj = node.querySelector(".task-project");
    const project = getProject(state, task.projectId);
    if (project) {
      proj.textContent = project.name;
      proj.style.color = project.color;
      proj.style.borderColor = project.color;
    } else proj.remove();

    const tags = node.querySelector(".task-tags");
    if (task.tags && task.tags.length) {
      tags.textContent = task.tags.map((t) => "#" + t).join(" ");
    } else tags.remove();

    const rec = node.querySelector(".task-recurrence");
    if (task.recurrence) {
      rec.textContent = "↻ " + Parser.describeRecurrence(task.recurrence);
    } else rec.remove();

    const subList = node.querySelector(".subtasks");
    (task.subtasks || []).forEach((s) => {
      const li = Util.el("li", { class: "subtask" + (s.done ? " done" : "") });
      const cb = Util.el("button", {
        class: "check small" + (s.done ? " checked" : ""),
        onclick: () => ctx.onToggleSub(task.id, s.id),
      });
      const sp = Util.el("span", { text: s.title });
      const del = Util.el("button", {
        class: "link danger tiny",
        text: "×",
        onclick: () => ctx.onDeleteSub(task.id, s.id),
      });
      li.append(cb, sp, del);
      subList.appendChild(li);
    });

    node.querySelector(".add-sub").addEventListener("click", () => {
      const v = prompt("Subtask:");
      if (v && v.trim()) ctx.onAddSub(task.id, v.trim());
    });
    node.querySelector(".edit").addEventListener("click", () => {
      ctx.onOpenEdit(task);
    });
    node.querySelector(".delete").addEventListener("click", () => {
      if (confirm("Delete this task?")) ctx.onDelete(task.id);
    });

    return node;
  }

  function renderTaskList(container, tasks, state, ctx) {
    Util.clear(container);
    if (!tasks.length) {
      container.appendChild(
        Util.el("div", { class: "empty", text: ctx.emptyText || "Nothing here." })
      );
      return;
    }
    const ul = Util.el("ul", { class: "task-list" });
    tasks.forEach((t) => ul.appendChild(renderTask(t, state, ctx)));
    container.appendChild(ul);
  }

  function sortByDueAndPriority(a, b) {
    if (!!a.done !== !!b.done) return a.done ? 1 : -1;
    const ad = a.due ? new Date(a.due).getTime() : Infinity;
    const bd = b.due ? new Date(b.due).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return a.priority - b.priority;
  }

  Views.today = function (container, state, ctx) {
    const todayEnd = Util.endOfDay(new Date()).getTime();
    const items = applyFilters(state.tasks, ctx.filters)
      .filter((t) => t.due && new Date(t.due).getTime() <= todayEnd)
      .sort(sortByDueAndPriority);
    renderTaskList(container, items, state, {
      ...ctx,
      emptyText: "No tasks due today. Quick-add one above 👆",
    });
  };

  Views.upcoming = function (container, state, ctx) {
    const now = Date.now();
    const todayEnd = Util.endOfDay(new Date()).getTime();
    const horizon = Util.addDays(new Date(), 14).getTime();
    const items = applyFilters(state.tasks, ctx.filters)
      .filter((t) => !t.done && t.due)
      .filter((t) => {
        const d = new Date(t.due).getTime();
        return d > todayEnd && d <= horizon;
      })
      .sort(sortByDueAndPriority);

    Util.clear(container);
    if (!items.length) {
      container.appendChild(
        Util.el("div", { class: "empty", text: "Nothing coming up in the next two weeks." })
      );
      return;
    }
    // Group by day
    const groups = new Map();
    items.forEach((t) => {
      const key = Util.startOfDay(new Date(t.due)).toISOString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(t);
    });
    const sortedKeys = [...groups.keys()].sort();
    for (const key of sortedKeys) {
      const heading = Util.el("h3", { class: "day-heading", text: Util.formatDue(key) });
      container.appendChild(heading);
      const ul = Util.el("ul", { class: "task-list" });
      groups.get(key).forEach((t) => ul.appendChild(renderTask(t, state, ctx)));
      container.appendChild(ul);
    }
    void now;
  };

  Views.inbox = function (container, state, ctx) {
    const items = applyFilters(state.tasks, ctx.filters)
      .filter((t) => !t.done && !t.projectId)
      .sort(sortByDueAndPriority);
    renderTaskList(container, items, state, {
      ...ctx,
      emptyText: "Inbox is empty.",
    });
  };

  Views.projects = function (container, state, ctx) {
    Util.clear(container);
    if (!state.projects.length) {
      container.appendChild(Util.el("div", { class: "empty", text: "No projects yet. Add one in Settings." }));
      return;
    }
    state.projects.forEach((project) => {
      const items = applyFilters(state.tasks, ctx.filters)
        .filter((t) => t.projectId === project.id)
        .sort(sortByDueAndPriority);
      const total = items.length;
      const open = items.filter((t) => !t.done).length;
      const heading = Util.el("h3", {
        class: "project-heading",
      });
      const dot = Util.el("span", { class: "project-dot" });
      dot.style.background = project.color;
      heading.append(dot, document.createTextNode(project.name + " "));
      heading.appendChild(
        Util.el("span", { class: "muted small", text: `${open}/${total}` })
      );
      container.appendChild(heading);
      if (!items.length) {
        container.appendChild(
          Util.el("div", { class: "empty small", text: "No tasks." })
        );
      } else {
        const ul = Util.el("ul", { class: "task-list" });
        items.forEach((t) => ul.appendChild(renderTask(t, state, ctx)));
        container.appendChild(ul);
      }
    });
  };

  Views.focus = function (container, state, ctx) {
    Focus.render(container, state, ctx);
  };

  // Compute progress + streak counters
  Views.progressFor = function (state) {
    const today = new Date();
    const tasksDueToday = state.tasks.filter((t) => t.due && Util.sameDay(t.due, today));
    const completedToday = state.tasks.filter(
      (t) => t.done && t.completedAt && Util.sameDay(t.completedAt, today)
    );
    const total = tasksDueToday.length;
    const done = tasksDueToday.filter((t) => t.done).length;
    return {
      ratio: total ? Math.round((done / total) * 100) : 0,
      label: `${done} / ${total}`,
      completedToday: completedToday.length,
      streak: (state.streak && state.streak.count) || 0,
    };
  };

  // Compute filter facets from current task list
  Views.facets = function (state) {
    const tags = new Set();
    state.tasks.forEach((t) => (t.tags || []).forEach((x) => tags.add(x)));
    return {
      tags: [...tags].sort(),
      priorities: [1, 2, 3],
    };
  };

  root.Views = Views;
})(typeof self !== "undefined" ? self : globalThis);
