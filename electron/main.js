// Electron main process for the desktop (.exe) build of Student To-Do.
//
// The original Chrome extension is loaded as-is. This file plus
// `preload.js` provide a small `chrome.*` shim (storage, alarms,
// notifications, runtime messaging) so that popup.html, options.html,
// and background.js can run unchanged inside Electron.

"use strict";

const { app, BrowserWindow, Notification, Menu, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_ROOT = path.resolve(__dirname, "..");
const PRELOAD = path.join(__dirname, "preload.js");
const ICON = path.join(APP_ROOT, "icons", "icon128.png");

// --------------------------------------------------------------------------
// Persistent storage (shim for chrome.storage.local).
// --------------------------------------------------------------------------

function storagePath() {
  return path.join(app.getPath("userData"), "storage.json");
}

function readStore() {
  try {
    const txt = fs.readFileSync(storagePath(), "utf8");
    const parsed = JSON.parse(txt);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeStore(data) {
  const file = storagePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
}

// --------------------------------------------------------------------------
// Window management.
// --------------------------------------------------------------------------

let popupWindow = null;
let optionsWindow = null;
let backgroundWindow = null;
let isQuitting = false;

function defaultWebPrefs() {
  return {
    preload: PRELOAD,
    contextIsolation: false,
    nodeIntegration: false,
    sandbox: false,
    backgroundThrottling: false,
  };
}

function showPopupWindow() {
  if (popupWindow && !popupWindow.isDestroyed()) {
    if (popupWindow.isMinimized()) popupWindow.restore();
    popupWindow.show();
    popupWindow.focus();
    return popupWindow;
  }
  popupWindow = new BrowserWindow({
    width: 440,
    height: 720,
    minWidth: 360,
    minHeight: 480,
    title: "Student To-Do",
    icon: ICON,
    autoHideMenuBar: false,
    webPreferences: defaultWebPrefs(),
  });
  popupWindow.loadFile(path.join(APP_ROOT, "popup.html"));
  popupWindow.on("closed", () => {
    popupWindow = null;
  });
  return popupWindow;
}

function showOptionsWindow() {
  if (optionsWindow && !optionsWindow.isDestroyed()) {
    optionsWindow.show();
    optionsWindow.focus();
    return optionsWindow;
  }
  optionsWindow = new BrowserWindow({
    width: 760,
    height: 720,
    title: "Student To-Do — Settings",
    icon: ICON,
    parent: popupWindow || undefined,
    webPreferences: defaultWebPrefs(),
  });
  optionsWindow.loadFile(path.join(APP_ROOT, "options.html"));
  optionsWindow.on("closed", () => {
    optionsWindow = null;
  });
  return optionsWindow;
}

function startBackgroundWindow() {
  // Hidden window that runs background.js (the service-worker logic) so
  // alarms keep firing while the popup is closed.
  backgroundWindow = new BrowserWindow({
    show: false,
    skipTaskbar: true,
    webPreferences: defaultWebPrefs(),
  });
  backgroundWindow.loadFile(path.join(__dirname, "background.html"));
  backgroundWindow.on("closed", () => {
    backgroundWindow = null;
  });
}

function broadcastToRenderers(channel, ...args) {
  for (const w of [popupWindow, optionsWindow, backgroundWindow]) {
    if (w && !w.isDestroyed() && w.webContents && !w.webContents.isDestroyed()) {
      try {
        w.webContents.send(channel, ...args);
      } catch (_) {
        /* ignore */
      }
    }
  }
}

function sendToBackground(channel, ...args) {
  if (
    backgroundWindow &&
    !backgroundWindow.isDestroyed() &&
    backgroundWindow.webContents &&
    !backgroundWindow.webContents.isDestroyed()
  ) {
    try {
      backgroundWindow.webContents.send(channel, ...args);
    } catch (_) {
      /* ignore */
    }
  }
}

// --------------------------------------------------------------------------
// chrome.alarms shim (in main process).
// --------------------------------------------------------------------------

const alarms = new Map(); // name -> { when: number, timeout: NodeJS.Timeout }

function fireAlarm(name) {
  const entry = alarms.get(name);
  if (!entry) return;
  alarms.delete(name);
  // Background.js listens for alarms; it's the canonical handler.
  sendToBackground("chrome:alarm", { name, scheduledTime: entry.when });
}

function clearAlarmInternal(name) {
  const entry = alarms.get(name);
  if (entry) {
    clearTimeout(entry.timeout);
    alarms.delete(name);
  }
}

function createAlarmInternal(name, info) {
  clearAlarmInternal(name);
  let when;
  if (info && typeof info.when === "number") {
    when = info.when;
  } else if (info && typeof info.delayInMinutes === "number") {
    when = Date.now() + info.delayInMinutes * 60 * 1000;
  } else {
    when = Date.now();
  }
  const ms = Math.max(0, when - Date.now());
  // setTimeout's max is ~24.8 days; this app never schedules that far out.
  const timeout = setTimeout(() => fireAlarm(name), ms);
  alarms.set(name, { when, timeout });
}

// --------------------------------------------------------------------------
// IPC handlers.
// --------------------------------------------------------------------------

ipcMain.handle("chrome:storage-get", (_evt, keys) => {
  const store = readStore();
  if (keys === null || keys === undefined) {
    return { ...store };
  }
  if (Array.isArray(keys)) {
    const out = {};
    for (const k of keys) if (k in store) out[k] = store[k];
    return out;
  }
  if (typeof keys === "string") {
    return keys in store ? { [keys]: store[keys] } : {};
  }
  if (typeof keys === "object") {
    // Object form: keys are property names with default values.
    const out = {};
    for (const k of Object.keys(keys)) {
      out[k] = k in store ? store[k] : keys[k];
    }
    return out;
  }
  return {};
});

ipcMain.handle("chrome:storage-set", (_evt, items) => {
  const store = readStore();
  const changes = {};
  for (const k of Object.keys(items || {})) {
    changes[k] = { oldValue: store[k], newValue: items[k] };
    store[k] = items[k];
  }
  writeStore(store);
  if (Object.keys(changes).length) {
    broadcastToRenderers("chrome:storage-changed", changes, "local");
  }
  return undefined;
});

ipcMain.handle("chrome:storage-remove", (_evt, keys) => {
  const arr = Array.isArray(keys) ? keys : [keys];
  const store = readStore();
  const changes = {};
  for (const k of arr) {
    if (k in store) {
      changes[k] = { oldValue: store[k], newValue: undefined };
      delete store[k];
    }
  }
  writeStore(store);
  if (Object.keys(changes).length) {
    broadcastToRenderers("chrome:storage-changed", changes, "local");
  }
  return undefined;
});

ipcMain.handle("chrome:alarms-create", (_evt, name, info) => {
  createAlarmInternal(name, info || {});
  return true;
});

ipcMain.handle("chrome:alarms-clear", (_evt, name) => {
  clearAlarmInternal(name);
  return true;
});

ipcMain.handle("chrome:alarms-getAll", () => {
  const out = [];
  for (const [name, entry] of alarms.entries()) {
    out.push({ name, scheduledTime: entry.when });
  }
  return out;
});

ipcMain.handle("chrome:notifications-create", (_evt, id, opts) => {
  const options = opts || {};
  const actualId =
    id ||
    "notif-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8);
  if (!Notification.isSupported()) return actualId;
  const iconPath = options.iconUrl
    ? path.join(APP_ROOT, options.iconUrl.replace(/^\/+/, ""))
    : ICON;
  const n = new Notification({
    title: options.title || "Student To-Do",
    body: options.message || "",
    icon: iconPath,
    silent: false,
  });
  n.on("click", () => {
    broadcastToRenderers("chrome:notification-clicked", actualId);
    showPopupWindow();
  });
  n.show();
  return actualId;
});

ipcMain.handle("chrome:runtime-sendMessage", (_evt, msg) => {
  // The original extension only sends messages from popup → background.
  // We simply forward to the background window.
  sendToBackground("chrome:message", msg);
  return { ok: true };
});

ipcMain.handle("chrome:runtime-openOptionsPage", () => {
  showOptionsWindow();
});

ipcMain.handle("chrome:action-openPopup", () => {
  showPopupWindow();
});

// --------------------------------------------------------------------------
// App lifecycle.
// --------------------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showPopupWindow();
  });

  app.whenReady().then(() => {
    // Application menu.
    const isMac = process.platform === "darwin";
    const template = [
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: "about" },
                { type: "separator" },
                { role: "services" },
                { type: "separator" },
                { role: "hide" },
                { role: "hideOthers" },
                { role: "unhide" },
                { type: "separator" },
                { role: "quit" },
              ],
            },
          ]
        : []),
      {
        label: "File",
        submenu: [
          {
            label: "Settings…",
            accelerator: "CmdOrCtrl+,",
            click: () => showOptionsWindow(),
          },
          { type: "separator" },
          isMac ? { role: "close" } : { role: "quit" },
        ],
      },
      {
        label: "Edit",
        submenu: [
          { role: "undo" },
          { role: "redo" },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" },
          { role: "selectAll" },
        ],
      },
      {
        label: "View",
        submenu: [
          { role: "reload" },
          { role: "toggleDevTools" },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn" },
          { role: "zoomOut" },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Source repository",
            click: () =>
              shell.openExternal(
                "https://github.com/inom8/devin-ai-integration"
              ),
          },
        ],
      },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    startBackgroundWindow();
    showPopupWindow();

    // Fire chrome.runtime.onInstalled / onStartup analogs once the
    // background window has finished loading.
    if (backgroundWindow) {
      backgroundWindow.webContents.once("did-finish-load", () => {
        sendToBackground("chrome:installed");
        sendToBackground("chrome:startup");
      });
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        showPopupWindow();
      } else {
        showPopupWindow();
      }
    });
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("window-all-closed", () => {
    // The hidden background window prevents this from firing in normal
    // operation, but if it's destroyed for some reason we still want to
    // exit on non-mac platforms.
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}

// Expose a tiny helper for tests / debugging.
module.exports = {
  _internal: {
    createAlarmInternal,
    clearAlarmInternal,
    alarms,
    readStore,
    writeStore,
  },
};
