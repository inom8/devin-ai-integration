// Sanity tests for the extension manifest and required files.

import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

test("manifest version is 3", () => {
  assert.equal(manifest.manifest_version, 3);
});

test("manifest declares required permissions", () => {
  for (const p of ["storage", "alarms", "notifications"]) {
    assert.ok(manifest.permissions.includes(p), `permission ${p} declared`);
  }
});

test("popup, background, options, and icon files referenced by manifest exist", () => {
  const referenced = [
    manifest.action.default_popup,
    manifest.background.service_worker,
    manifest.options_page,
    manifest.action.default_icon["16"],
    manifest.action.default_icon["48"],
    manifest.action.default_icon["128"],
  ];
  for (const rel of referenced) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} exists`);
  }
});
