
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tester = join(repo, "tester-site");
const dist = join(tester, "dist");

async function textFiles(path) {
  const found = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...await textFiles(child));
    else if ([".html", ".css", ".js"].includes(extname(child))) found.push(child);
  }
  return found;
}

test("tester build is isolated from the live Bronagh journey", async () => {
  await exec(process.execPath, [join(tester, "build.mjs")], { cwd: repo });
  const files = await textFiles(dist);
  const bundle = (await Promise.all(files.map(file => readFile(file, "utf8")))).join("\n");

  assert.match(bundle, /buy\.stripe\.com\/test_fZu6oH0t3gQN7my7Mh7Zu01/);
  assert.match(bundle, /TEST MODE/);
  assert.match(bundle, /Nothing was sent to SABI or saved in Google Drive/);
  assert.doesNotMatch(bundle, /buy\.stripe\.com\/4gMaEX0t36c9dKW8Ql7Zu00/);
  assert.doesNotMatch(bundle, /CL-2026-001/);
  assert.doesNotMatch(bundle, /Bronagh/i);
});

test("tester password protection covers the entire tester journey", async () => {
  const netlifyConfig = await readFile(join(tester, "netlify.toml"), "utf8");
  const auth = await readFile(join(tester, "netlify", "edge-functions", "tester-auth.js"), "utf8");

  assert.match(netlifyConfig, /path = "\/\*"/);
  assert.match(auth, /location: returnPath/);
  assert.match(auth, /action="\$\{action\}"/);
});

