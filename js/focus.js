// Focus Mode (Pomodoro-style timer). State is held in chrome.storage so the
// timer keeps running while the popup is closed; the service worker handles
// the alarm that fires when the session ends.

(function (root) {
  "use strict";

  const FOCUS_KEY = "studentTodoFocus_v1";

  function loadFocus() {
    return new Promise((resolve) => {
      chrome.storage.local.get([FOCUS_KEY], (res) => resolve(res[FOCUS_KEY] || null));
    });
  }

  function saveFocus(s) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [FOCUS_KEY]: s }, resolve);
    });
  }

  async function start(mode, durationMin) {
    const endsAt = Date.now() + durationMin * 60 * 1000;
    const session = { mode, endsAt, durationMin, paused: false, remainingMs: null };
    await saveFocus(session);
    chrome.runtime.sendMessage({ type: "focus:scheduleAlarm", endsAt });
    return session;
  }

  async function pause() {
    const s = await loadFocus();
    if (!s || s.paused) return s;
    s.paused = true;
    s.remainingMs = Math.max(0, s.endsAt - Date.now());
    await saveFocus(s);
    chrome.runtime.sendMessage({ type: "focus:cancelAlarm" });
    return s;
  }

  async function resume() {
    const s = await loadFocus();
    if (!s || !s.paused) return s;
    s.endsAt = Date.now() + (s.remainingMs || 0);
    s.paused = false;
    s.remainingMs = null;
    await saveFocus(s);
    chrome.runtime.sendMessage({ type: "focus:scheduleAlarm", endsAt: s.endsAt });
    return s;
  }

  async function stop() {
    await saveFocus(null);
    chrome.runtime.sendMessage({ type: "focus:cancelAlarm" });
  }

  function fmt(ms) {
    if (ms < 0) ms = 0;
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function render(container, state, ctx) {
    Util.clear(container);
    const wrap = Util.el("div", { class: "focus" });
    const display = Util.el("div", { class: "focus-display", text: "--:--" });
    const label = Util.el("div", { class: "focus-label muted" });
    const buttons = Util.el("div", { class: "focus-buttons" });

    const startFocus = Util.el("button", {
      class: "primary",
      text: `Start ${state.settings.focusDurationMin}m focus`,
    });
    const startBreak = Util.el("button", {
      class: "secondary",
      text: `Start ${state.settings.breakDurationMin}m break`,
    });
    const pauseBtn = Util.el("button", { class: "secondary", text: "Pause" });
    const resumeBtn = Util.el("button", { class: "primary", text: "Resume" });
    const stopBtn = Util.el("button", { class: "danger", text: "Stop" });

    let timerId = null;

    async function paint() {
      const s = await loadFocus();
      buttons.innerHTML = "";
      if (!s) {
        display.textContent = `${state.settings.focusDurationMin}:00`;
        label.textContent = "Ready when you are.";
        buttons.append(startFocus, startBreak);
      } else if (s.paused) {
        display.textContent = fmt(s.remainingMs);
        label.textContent = `Paused (${s.mode})`;
        buttons.append(resumeBtn, stopBtn);
      } else {
        const remaining = s.endsAt - Date.now();
        display.textContent = fmt(remaining);
        label.textContent = `${s.mode === "focus" ? "Focus" : "Break"} — ${s.durationMin}m`;
        buttons.append(pauseBtn, stopBtn);
      }
    }

    startFocus.onclick = async () => {
      await start("focus", state.settings.focusDurationMin);
      paint();
    };
    startBreak.onclick = async () => {
      await start("break", state.settings.breakDurationMin);
      paint();
    };
    pauseBtn.onclick = async () => {
      await pause();
      paint();
    };
    resumeBtn.onclick = async () => {
      await resume();
      paint();
    };
    stopBtn.onclick = async () => {
      await stop();
      paint();
    };

    wrap.append(display, label, buttons);

    const tip = Util.el("p", {
      class: "muted small focus-tip",
      text:
        "Tip: pick a single task and put your phone on Do Not Disturb. The timer keeps running even if you close the popup.",
    });
    wrap.appendChild(tip);

    container.appendChild(wrap);

    paint();
    timerId = setInterval(paint, 1000);
    ctx.onCleanup(() => clearInterval(timerId));
  }

  root.Focus = { start, pause, resume, stop, render };
})(typeof self !== "undefined" ? self : globalThis);
