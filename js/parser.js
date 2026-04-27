// Natural-language quick-add parser.
//
// Examples it understands:
//   "Math homework tomorrow 6pm #school p1"
//   "Read chapter 4 next monday"
//   "Standup every weekday 9am"
//   "Pay rent every month"
//   "Workout every monday, wednesday, friday 7am"
//   "Buy milk today"
//   "Submit essay in 3 days at 5pm"
//
// Returns: { title, due, recurrence, priority, tags, projectName }

(function (root) {
  "use strict";

  const WEEKDAYS = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sun: 0,
    mon: 1,
    tue: 2,
    tues: 2,
    wed: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    fri: 5,
    sat: 6,
  };

  function setTime(date, hours, minutes) {
    const d = new Date(date);
    d.setHours(hours, minutes || 0, 0, 0);
    return d;
  }

  function parseTime(str) {
    // Returns {hours, minutes} or null
    let m;
    m = str.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (m) {
      let h = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      const ap = m[3].toLowerCase();
      if (ap === "pm" && h < 12) h += 12;
      if (ap === "am" && h === 12) h = 0;
      return { hours: h, minutes: min, raw: m[0] };
    }
    m = str.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
    if (m) {
      const h = parseInt(m[1], 10);
      const min = m[2] ? parseInt(m[2], 10) : 0;
      return { hours: h, minutes: min, raw: m[0] };
    }
    m = str.match(/\b(\d{1,2}):(\d{2})\b/);
    if (m) {
      return {
        hours: parseInt(m[1], 10),
        minutes: parseInt(m[2], 10),
        raw: m[0],
      };
    }
    return null;
  }

  function nextWeekday(from, target) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    const diff = (target - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
    return d;
  }

  function parse(input) {
    let s = " " + input + " ";
    const result = {
      title: "",
      due: null,
      recurrence: null,
      priority: 4,
      tags: [],
      projectName: null,
    };

    // priority: p1..p4 or !!! / !! / !
    let m = s.match(/\sp([1-4])\b/i);
    if (m) {
      result.priority = parseInt(m[1], 10);
      s = s.replace(m[0], " ");
    } else if (/\s!!!\s/.test(s)) {
      result.priority = 1;
      s = s.replace(/\s!!!\s/, " ");
    } else if (/\s!!\s/.test(s)) {
      result.priority = 2;
      s = s.replace(/\s!!\s/, " ");
    } else if (/\s!\s/.test(s)) {
      result.priority = 3;
      s = s.replace(/\s!\s/, " ");
    }

    // tags: #tag (letters/digits/underscore/hyphen)
    s = s.replace(/\s#([a-z0-9_\-]+)/gi, (_, tag) => {
      result.tags.push(tag.toLowerCase());
      return " ";
    });

    // project: @project (single token; underscores become spaces)
    const proj = s.match(/\s@([a-z0-9_\-]+)/i);
    if (proj) {
      result.projectName = proj[1].replace(/_/g, " ");
      s = s.replace(proj[0], " ");
    }

    // recurrence: "every <unit>" or "every <weekday[, weekday...]>"
    // Alternation order matters: longer names must come before shorter ones,
    // otherwise `mon` would match inside `monday` and leave "day" behind.
    const dayAlt =
      "sunday|monday|tuesday|wednesday|thursday|friday|saturday|tues|thurs|thur|sun|mon|tue|wed|thu|fri|sat";
    const rec = s.match(
      new RegExp(
        `\\severy\\s+(day|weekday|weekend|week|month|year|((?:${dayAlt})(?:\\s*,\\s*(?:${dayAlt}))*))`,
        "i"
      )
    );
    if (rec) {
      const unit = rec[1].toLowerCase();
      if (unit === "day") result.recurrence = { type: "daily", interval: 1 };
      else if (unit === "weekday")
        result.recurrence = { type: "weekly", interval: 1, days: [1, 2, 3, 4, 5] };
      else if (unit === "weekend")
        result.recurrence = { type: "weekly", interval: 1, days: [0, 6] };
      else if (unit === "week") result.recurrence = { type: "weekly", interval: 1 };
      else if (unit === "month") result.recurrence = { type: "monthly", interval: 1 };
      else if (unit === "year") result.recurrence = { type: "yearly", interval: 1 };
      else {
        const days = unit
          .split(",")
          .map((x) => WEEKDAYS[x.trim()])
          .filter((x) => x !== undefined);
        if (days.length) result.recurrence = { type: "weekly", interval: 1, days };
      }
      s = s.replace(rec[0], " ");
    }

    // time
    const time = parseTime(s);
    if (time) s = s.replace(time.raw, " ");

    // dates
    let due = null;
    const now = new Date();
    let dm;
    if ((dm = s.match(/\stoday\b/i))) {
      due = new Date(now);
      due.setHours(0, 0, 0, 0);
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(/\stonight\b/i))) {
      due = new Date(now);
      due.setHours(20, 0, 0, 0);
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(/\stomorrow\b/i))) {
      due = new Date(now);
      due.setDate(due.getDate() + 1);
      due.setHours(0, 0, 0, 0);
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(/\sin\s+(\d+)\s+(day|days|week|weeks)\b/i))) {
      const n = parseInt(dm[1], 10);
      const unit = dm[2].toLowerCase();
      due = new Date(now);
      due.setHours(0, 0, 0, 0);
      due.setDate(due.getDate() + (unit.startsWith("week") ? n * 7 : n));
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(new RegExp(`\\snext\\s+(${dayAlt})\\b`, "i")))) {
      due = nextWeekday(now, WEEKDAYS[dm[1].toLowerCase()]);
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(new RegExp(`\\sthis\\s+(${dayAlt})\\b`, "i")))) {
      // "this monday" — upcoming occurrence in the current week (or today if it matches)
      const target = WEEKDAYS[dm[1].toLowerCase()];
      due = new Date(now);
      due.setHours(0, 0, 0, 0);
      const diff = (target - due.getDay() + 7) % 7;
      due.setDate(due.getDate() + diff);
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(new RegExp(`\\son\\s+(${dayAlt})\\b`, "i")))) {
      due = nextWeekday(now, WEEKDAYS[dm[1].toLowerCase()]);
      s = s.replace(dm[0], " ");
    } else if ((dm = s.match(new RegExp(`\\b(${dayAlt})\\b`, "i")))) {
      // bare weekday — only consume if it's clearly a date hint near the end
      // (avoid eating words inside the title). Heuristic: only if it's the last token.
      if (s.trim().endsWith(dm[1])) {
        due = nextWeekday(now, WEEKDAYS[dm[1].toLowerCase()]);
        s = s.replace(dm[0], " ");
      }
    } else if ((dm = s.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/))) {
      const month = parseInt(dm[1], 10) - 1;
      const day = parseInt(dm[2], 10);
      let year = now.getFullYear();
      if (dm[3]) year = parseInt(dm[3], 10) < 100 ? 2000 + parseInt(dm[3], 10) : parseInt(dm[3], 10);
      due = new Date(year, month, day);
      // if the date is in the past and no year was specified, bump to next year
      if (!dm[3] && due < Util.startOfDay(now)) due.setFullYear(year + 1);
      s = s.replace(dm[0], " ");
    }

    if (time) {
      if (!due) {
        due = new Date(now);
        if (setTime(due, time.hours, time.minutes) <= now) {
          due.setDate(due.getDate() + 1);
        }
      }
      due = setTime(due, time.hours, time.minutes);
    }

    if (due) result.due = due.toISOString();

    // recurrence with a weekday list and no due date → first matching weekday
    if (!result.due && result.recurrence && result.recurrence.days && result.recurrence.days.length) {
      let next = nextWeekday(now, result.recurrence.days[0]);
      if (time) next = setTime(next, time.hours, time.minutes);
      result.due = next.toISOString();
    }

    result.title = s.replace(/\s+/g, " ").trim();
    return result;
  }

  // Compute next due date for a recurring task, given the current due date.
  function nextRecurrence(currentDueIso, recurrence) {
    if (!recurrence) return null;
    const base = currentDueIso ? new Date(currentDueIso) : new Date();
    const interval = recurrence.interval || 1;
    if (recurrence.type === "daily") {
      const d = new Date(base);
      d.setDate(d.getDate() + interval);
      return d.toISOString();
    }
    if (recurrence.type === "weekly") {
      if (recurrence.days && recurrence.days.length) {
        const d = new Date(base);
        for (let i = 1; i <= 14; i++) {
          d.setDate(d.getDate() + 1);
          if (recurrence.days.includes(d.getDay())) return d.toISOString();
        }
      }
      const d = new Date(base);
      d.setDate(d.getDate() + 7 * interval);
      return d.toISOString();
    }
    if (recurrence.type === "monthly") {
      const d = new Date(base);
      d.setMonth(d.getMonth() + interval);
      return d.toISOString();
    }
    if (recurrence.type === "yearly") {
      const d = new Date(base);
      d.setFullYear(d.getFullYear() + interval);
      return d.toISOString();
    }
    return null;
  }

  function describeRecurrence(r) {
    if (!r) return "";
    if (r.type === "daily") return "every day";
    if (r.type === "monthly") return "every month";
    if (r.type === "yearly") return "every year";
    if (r.type === "weekly") {
      if (!r.days || !r.days.length) return "every week";
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const sorted = [...r.days].sort();
      if (sorted.join(",") === "1,2,3,4,5") return "every weekday";
      if (sorted.join(",") === "0,6") return "every weekend";
      return "every " + sorted.map((d) => names[d]).join(", ");
    }
    return "";
  }

  root.Parser = { parse, nextRecurrence, describeRecurrence };
})(typeof self !== "undefined" ? self : globalThis);
