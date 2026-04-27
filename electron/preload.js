// Preload script: installs a `chrome.*` shim onto `window`/`self` so that
// the unmodified extension code (popup, options, background) can run inside
// Electron renderers.
//
// `contextIsolation` is intentionally disabled in main.js; this script and
// the page's scripts share the same global object.

"use strict";

const { ipcRenderer } = require("electron");

const listeners = {
  alarm: new Set(),
  message: new Set(),
  notificationClicked: new Set(),
  storageChanged: new Set(),
  installed: new Set(),
  startup: new Set(),
};

function safeFire(set, ...args) {
  for (const fn of Array.from(set)) {
    try {
      fn(...args);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[chrome-shim] listener threw:", e);
    }
  }
}

ipcRenderer.on("chrome:alarm", (_evt, alarm) => {
  safeFire(listeners.alarm, alarm);
});

ipcRenderer.on("chrome:message", (_evt, msg) => {
  // Mimic chrome.runtime.onMessage(message, sender, sendResponse). We don't
  // currently round-trip the response anywhere, but the listener API still
  // expects the third argument to be callable.
  const sender = { id: "electron-shim" };
  const sendResponse = () => {};
  safeFire(listeners.message, msg, sender, sendResponse);
});

ipcRenderer.on("chrome:notification-clicked", (_evt, id) => {
  safeFire(listeners.notificationClicked, id);
});

ipcRenderer.on("chrome:storage-changed", (_evt, changes, area) => {
  safeFire(listeners.storageChanged, changes, area);
});

ipcRenderer.on("chrome:installed", () => safeFire(listeners.installed));
ipcRenderer.on("chrome:startup", () => safeFire(listeners.startup));

function makeEvent(set) {
  return {
    addListener: (fn) => {
      if (typeof fn === "function") set.add(fn);
    },
    removeListener: (fn) => set.delete(fn),
    hasListener: (fn) => set.has(fn),
  };
}

function maybeCallback(promise, cb) {
  if (typeof cb === "function") {
    promise.then((v) => cb(v)).catch((e) => {
      // eslint-disable-next-line no-console
      console.error("[chrome-shim] async error:", e);
      try {
        cb(undefined);
      } catch (_) {
        /* ignore */
      }
    });
  }
  return promise;
}

const chromeShim = {
  storage: {
    local: {
      get(keys, cb) {
        // chrome.storage allows get() with no args to return everything.
        if (typeof keys === "function") {
          cb = keys;
          keys = null;
        }
        return maybeCallback(
          ipcRenderer.invoke("chrome:storage-get", keys ?? null),
          cb
        );
      },
      set(items, cb) {
        return maybeCallback(
          ipcRenderer.invoke("chrome:storage-set", items || {}),
          cb
        );
      },
      remove(keys, cb) {
        return maybeCallback(
          ipcRenderer.invoke("chrome:storage-remove", keys),
          cb
        );
      },
      clear(cb) {
        return maybeCallback(
          ipcRenderer.invoke("chrome:storage-set", {}).then(() => undefined),
          cb
        );
      },
    },
    onChanged: makeEvent(listeners.storageChanged),
  },

  alarms: {
    create(name, info) {
      return ipcRenderer.invoke("chrome:alarms-create", name, info || {});
    },
    clear(name, cb) {
      return maybeCallback(
        ipcRenderer.invoke("chrome:alarms-clear", name),
        cb
      );
    },
    getAll(cb) {
      return maybeCallback(ipcRenderer.invoke("chrome:alarms-getAll"), cb);
    },
    onAlarm: makeEvent(listeners.alarm),
  },

  notifications: {
    create(idOrOpts, optsOrCb, maybeCb) {
      let id, opts, cb;
      if (typeof idOrOpts === "string" || idOrOpts == null) {
        id = idOrOpts || null;
        opts = optsOrCb || {};
        cb = maybeCb;
      } else {
        id = null;
        opts = idOrOpts || {};
        cb = optsOrCb;
      }
      return maybeCallback(
        ipcRenderer.invoke("chrome:notifications-create", id, opts),
        cb
      );
    },
    onClicked: makeEvent(listeners.notificationClicked),
  },

  runtime: {
    onInstalled: makeEvent(listeners.installed),
    onStartup: makeEvent(listeners.startup),
    onMessage: makeEvent(listeners.message),
    sendMessage(msg, cb) {
      return maybeCallback(
        ipcRenderer.invoke("chrome:runtime-sendMessage", msg),
        cb
      );
    },
    openOptionsPage(cb) {
      return maybeCallback(
        ipcRenderer.invoke("chrome:runtime-openOptionsPage"),
        cb
      );
    },
    getURL(rel) {
      // Best-effort: returns the file path. The extension only uses this
      // pattern for icons in notifications, which we resolve in main.
      return rel;
    },
    id: "student-todo-electron",
  },

  action: {
    openPopup(cb) {
      return maybeCallback(
        ipcRenderer.invoke("chrome:action-openPopup"),
        cb
      );
    },
  },
};

// Install on both `window` (popup/options) and `self` (background.html, which
// uses the service-worker style `self.chrome`).
window.chrome = chromeShim;
if (typeof self !== "undefined") self.chrome = chromeShim;

// background.js calls importScripts() at the top of the file. The actual
// scripts are loaded via <script> tags in background.html, so we just
// neutralise the call here.
if (typeof window.importScripts !== "function") {
  window.importScripts = function () {
    /* no-op: dependencies are loaded via <script> tags */
  };
}
