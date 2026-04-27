// Service worker: schedules reminders + focus alarms and shows notifications.

importScripts("js/util.js", "js/parser.js", "js/store.js");

const ALARM_PREFIX = "task:";
const FOCUS_ALARM = "focus:end";

async function rescheduleAllReminders() {
  const state = await Store.getState();
  const enabled = !!state.settings.enableNotifications;
  // Clear existing task alarms
  const all = await chrome.alarms.getAll();
  for (const a of all) {
    if (a.name.startsWith(ALARM_PREFIX)) await chrome.alarms.clear(a.name);
  }
  if (!enabled) return;
  for (const t of state.tasks) {
    if (t.done || !t.due) continue;
    const dueMs = new Date(t.due).getTime();
    const before = (t.reminderMinutesBefore != null
      ? t.reminderMinutesBefore
      : state.settings.defaultReminderMinutesBefore || 0) * 60 * 1000;
    const when = dueMs - before;
    if (when > Date.now()) {
      try {
        await chrome.alarms.create(ALARM_PREFIX + t.id, { when });
      } catch (e) {
        // ignore
      }
    }
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await rescheduleAllReminders();
});

chrome.runtime.onStartup.addListener(async () => {
  await rescheduleAllReminders();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (!msg || !msg.type) return;
    if (msg.type === "reminders:reschedule") {
      await rescheduleAllReminders();
      sendResponse({ ok: true });
    } else if (msg.type === "focus:scheduleAlarm") {
      await chrome.alarms.clear(FOCUS_ALARM);
      await chrome.alarms.create(FOCUS_ALARM, { when: msg.endsAt });
      sendResponse({ ok: true });
    } else if (msg.type === "focus:cancelAlarm") {
      await chrome.alarms.clear(FOCUS_ALARM);
      sendResponse({ ok: true });
    }
  })();
  return true; // keep channel open for async sendResponse
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === FOCUS_ALARM) {
    chrome.storage.local.get(["studentTodoFocus_v1"], (res) => {
      const session = res["studentTodoFocus_v1"];
      const which = session && session.mode === "break" ? "Break" : "Focus";
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: `${which} session complete`,
        message:
          which === "Focus"
            ? "Time for a short break. Stretch, breathe, hydrate."
            : "Break is over — back to it!",
        priority: 2,
      });
      chrome.storage.local.remove("studentTodoFocus_v1");
    });
    return;
  }

  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const id = alarm.name.slice(ALARM_PREFIX.length);
    const state = await Store.getState();
    const task = state.tasks.find((t) => t.id === id);
    if (!task || task.done) return;
    const due = task.due ? new Date(task.due) : null;
    chrome.notifications.create("reminder:" + id, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: task.title,
      message: due ? "Due " + Util.formatDue(due.toISOString()) : "Reminder",
      priority: task.priority === 1 ? 2 : 1,
    });
  }
});

chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup().catch(() => {
    // openPopup() only works in response to user gesture in some Chrome
    // versions. Fall back to opening the options page so the user has somewhere
    // to land.
    chrome.runtime.openOptionsPage();
  });
});

// Re-sync alarms whenever stored data changes (e.g. user edits settings).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes[Store.STORAGE_KEY]) {
    rescheduleAllReminders();
  }
});
