// Small DOM/date helpers shared between popup, options, and background.
// Kept as plain script (no modules) so it can be loaded by both classic
// pages (popup/options) and imported by the service worker.

(function (root) {
  "use strict";

  const Util = {
    uid() {
      // RFC4122-ish v4-lite. Good enough for local IDs.
      return (
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2, 10)
      );
    },

    el(tag, attrs, children) {
      const node = document.createElement(tag);
      if (attrs) {
        for (const k of Object.keys(attrs)) {
          const v = attrs[k];
          if (v === false || v === null || v === undefined) continue;
          if (k === "class") node.className = v;
          else if (k === "text") node.textContent = v;
          else if (k.startsWith("on") && typeof v === "function") {
            node.addEventListener(k.slice(2).toLowerCase(), v);
          } else if (k === "dataset") {
            for (const dk of Object.keys(v)) node.dataset[dk] = v[dk];
          } else {
            node.setAttribute(k, v);
          }
        }
      }
      if (children) {
        for (const c of [].concat(children)) {
          if (c == null) continue;
          node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        }
      }
      return node;
    },

    clear(node) {
      while (node.firstChild) node.removeChild(node.firstChild);
    },

    startOfDay(d) {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    },
    endOfDay(d) {
      const x = new Date(d);
      x.setHours(23, 59, 59, 999);
      return x;
    },
    addDays(d, n) {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    },
    sameDay(a, b) {
      a = new Date(a);
      b = new Date(b);
      return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
      );
    },
    isOverdue(due) {
      if (!due) return false;
      return new Date(due).getTime() < Date.now();
    },

    formatDue(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      const now = new Date();
      const today = Util.startOfDay(now);
      const tomorrow = Util.addDays(today, 1);
      const dayAfter = Util.addDays(today, 2);
      const time =
        d.getHours() === 0 && d.getMinutes() === 0
          ? ""
          : " " +
            d.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });
      if (Util.sameDay(d, today)) return "Today" + time;
      if (Util.sameDay(d, tomorrow)) return "Tomorrow" + time;
      if (d >= today && d < Util.addDays(today, 7)) {
        return d.toLocaleDateString([], { weekday: "short" }) + time;
      }
      if (d < today) {
        const days = Math.round((today - Util.startOfDay(d)) / 86400000);
        return days === 1 ? "Yesterday" + time : days + "d ago" + time;
      }
      void dayAfter;
      return d.toLocaleDateString([], { month: "short", day: "numeric" }) + time;
    },

    priorityLabel(p) {
      // 1 = highest, 4 = none
      return ["", "P1", "P2", "P3", ""][p] || "";
    },

    priorityColor(p) {
      return (
        {
          1: "#e5484d",
          2: "#f5a524",
          3: "#5b8def",
          4: "#9aa0a6",
        }[p] || "#9aa0a6"
      );
    },

    debounce(fn, wait) {
      let t = null;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]);
    },
  };

  root.Util = Util;
})(typeof self !== "undefined" ? self : globalThis);
