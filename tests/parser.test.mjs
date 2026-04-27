// Minimal node:test suite for the natural-language quick-add parser.
//
// The parser uses no chrome APIs and writes to a `Parser` global. We load it
// into a sandboxed `vm` context and exercise the pure parsing logic.

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadParser() {
  const ctx = { self: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "js/util.js"), "utf8"), ctx);
  vm.runInContext(fs.readFileSync(path.join(root, "js/parser.js"), "utf8"), ctx);
  return ctx.self.Parser;
}

const Parser = loadParser();

function dueOn(iso) {
  return new Date(iso);
}

test("title is extracted with no annotations", () => {
  const r = Parser.parse("Read chapter 4");
  assert.equal(r.title, "Read chapter 4");
  assert.equal(r.due, null);
  assert.equal(r.priority, 4);
  assert.deepEqual(r.tags, []);
  assert.equal(r.recurrence, null);
});

test("priority p1 is parsed and removed from title", () => {
  const r = Parser.parse("Write essay p1");
  assert.equal(r.title, "Write essay");
  assert.equal(r.priority, 1);
});

test("bang-style priority", () => {
  assert.equal(Parser.parse("Submit form !!!").priority, 1);
  assert.equal(Parser.parse("Submit form !!").priority, 2);
  assert.equal(Parser.parse("Submit form !").priority, 3);
});

test("tags and project are parsed", () => {
  const r = Parser.parse("Math homework #school #math @homework");
  assert.equal(r.title, "Math homework");
  assert.deepEqual(r.tags.sort(), ["math", "school"]);
  assert.equal(r.projectName, "homework");
});

test("today + time", () => {
  const r = Parser.parse("Call mom today 6pm");
  assert.equal(r.title, "Call mom");
  const d = dueOn(r.due);
  assert.equal(d.getHours(), 18);
  assert.equal(d.getMinutes(), 0);
});

test("tomorrow without time defaults to midnight tomorrow", () => {
  const r = Parser.parse("Buy milk tomorrow");
  const d = dueOn(r.due);
  const t = new Date();
  t.setDate(t.getDate() + 1);
  assert.equal(d.getDate(), t.getDate());
  assert.equal(d.getHours(), 0);
});

test("in 3 days", () => {
  const r = Parser.parse("Project draft in 3 days");
  const d = dueOn(r.due);
  const expected = new Date();
  expected.setDate(expected.getDate() + 3);
  expected.setHours(0, 0, 0, 0);
  assert.equal(d.toDateString(), expected.toDateString());
});

test("recurrence: every day", () => {
  const r = Parser.parse("Read 30 minutes every day");
  assert.equal(r.title, "Read 30 minutes");
  assert.deepEqual(r.recurrence, { type: "daily", interval: 1 });
});

test("recurrence: every weekday with time", () => {
  const r = Parser.parse("Standup every weekday 9am");
  assert.equal(r.title, "Standup");
  assert.equal(r.recurrence.type, "weekly");
  assert.deepEqual(r.recurrence.days, [1, 2, 3, 4, 5]);
  assert.equal(dueOn(r.due).getHours(), 9);
});

test("recurrence: explicit weekdays", () => {
  const r = Parser.parse("Workout every monday, wednesday, friday 7am");
  assert.equal(r.title, "Workout");
  assert.deepEqual(r.recurrence.days.sort(), [1, 3, 5]);
});

test("recurrence: due date snaps to a day in the rule", () => {
  // Regression: previously, when a time-of-day already passed today, the
  // parser bumped due to tomorrow without checking that tomorrow was in
  // recurrence.days. This verifies due always lands on a rule day.
  for (const phrase of [
    "Workout every monday, wednesday, friday 7am",
    "Standup every weekday 9am",
    "Brunch every saturday, sunday 11am",
  ]) {
    const r = Parser.parse(phrase);
    assert.ok(r.due, `expected a due date for: ${phrase}`);
    const day = new Date(r.due).getDay();
    assert.ok(
      r.recurrence.days.includes(day),
      `due day ${day} not in rule ${JSON.stringify(r.recurrence.days)} for: ${phrase}`
    );
    assert.ok(new Date(r.due) > new Date(), `due must be in the future for: ${phrase}`);
  }
});

test("nextRecurrence rolls daily forward", () => {
  const start = "2026-04-27T09:00:00.000Z";
  const next = Parser.nextRecurrence(start, { type: "daily", interval: 1 });
  const d = new Date(next);
  assert.equal(d.toISOString().slice(0, 10), "2026-04-28");
});

test("nextRecurrence picks next configured weekday", () => {
  // 2026-04-27 is a Monday.
  const start = "2026-04-27T09:00:00.000Z";
  const next = Parser.nextRecurrence(start, { type: "weekly", days: [1, 3, 5] });
  const d = new Date(next);
  // Next slot from Monday is Wednesday → 2026-04-29
  assert.equal(d.toISOString().slice(0, 10), "2026-04-29");
});

test("describeRecurrence is human-readable", () => {
  assert.equal(Parser.describeRecurrence({ type: "daily", interval: 1 }), "every day");
  assert.equal(
    Parser.describeRecurrence({ type: "weekly", days: [1, 2, 3, 4, 5] }),
    "every weekday"
  );
  assert.equal(
    Parser.describeRecurrence({ type: "weekly", days: [1, 3, 5] }),
    "every Mon, Wed, Fri"
  );
});
