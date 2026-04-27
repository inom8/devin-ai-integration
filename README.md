# Student To-Do — Chrome Extension

A focused, student-friendly to-do list that lives in your browser toolbar. Built as a Manifest V3 Chrome extension — no build step, no servers, no accounts. Everything is stored locally via `chrome.storage`.

![Today view, Quick Add, Focus mode](icons/icon128.png)

## Highlights

- **Quick Add with natural language.** Type *"Math homework tomorrow 6pm #school p1"* — it understands dates, times, tags, projects, priorities, and recurrence.
- **Today / Upcoming / Inbox / Projects** views, plus tag and priority filters.
- **Smart reminders** via `chrome.alarms` + desktop notifications.
- **Recurring tasks** — completing a recurring task rolls it forward to the next occurrence (daily, weekly, weekday-only, monthly, yearly, or specific weekdays).
- **Subtasks** for breaking big assignments into next actions.
- **Focus Mode** — a 50-minute Pomodoro-style timer (configurable). The timer keeps running even with the popup closed, and notifies you when the session ends.
- **Progress tracking** — daily completed-vs-total counter and a streak of consecutive completion days 🔥.
- **Import / Export** as JSON for backup and portability.
- **Dark mode** — follows your system preference.

## Quick Add cheat sheet

| Input | Result |
| --- | --- |
| `tomorrow`, `today`, `tonight` | Sets the due date |
| `next monday`, `on friday`, `this thursday` | Sets the due date |
| `in 3 days`, `in 2 weeks` | Relative due date |
| `at 7`, `6pm`, `18:00` | Sets the due time |
| `every day`, `every week`, `every month` | Recurring task |
| `every weekday`, `every weekend` | Recurring task on a weekday set |
| `every monday, wednesday, friday` | Custom weekly recurrence |
| `p1` … `p4` (or `!!!`, `!!`, `!`) | Priority |
| `#school`, `#math` | Tags |
| `@homework` | Project (created on the fly) |

## Install (unpacked)

1. Run `git clone https://github.com/inom8/student-todo-extension.git`.
2. (First time only) Run `python3 scripts/make_icons.py` to generate icons. *Already committed — only needed if you change the source.*
3. Open `chrome://extensions` in Chrome.
4. Toggle **Developer mode** on (top-right).
5. Click **Load unpacked** and select the repo folder.
6. Pin the extension from the toolbar puzzle-piece menu.

## Settings

Right-click the extension → **Options** to:

- Change focus / break duration.
- Set the default reminder lead time (minutes before due).
- Enable or disable desktop notifications.
- Manage projects.
- Export, import, or wipe your data.

## Project layout

```
manifest.json            # MV3 manifest
background.js            # Service worker — alarms, reminders, focus end
popup.html / popup.css   # Toolbar popup UI
options.html / options.css
icons/                   # Generated icons (16, 48, 128)
js/
  util.js                # Shared helpers (no deps)
  parser.js              # Natural-language quick-add parser
  store.js               # chrome.storage wrapper + task mutations
  views.js               # Renderers for Today / Upcoming / Inbox / Projects
  focus.js               # Focus Mode timer (storage-backed)
  popup.js               # Popup controller
  options.js             # Options page controller
scripts/make_icons.py    # Regenerate icons from the source design
tests/                   # Minimal node:test suites for the pure modules
```

## Tests

The pure JS modules (`util.js`, `parser.js`) have a tiny `node:test` suite that runs without a browser:

```
npm test
```

(Just `node --test tests/` under the hood — there are no runtime dependencies.)

## License

MIT.
