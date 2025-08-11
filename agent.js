#!/usr/bin/env node
/**
 * RazzLab Repo Agent (single-file, no deps)
 * Node >=18 required.
 *
 * Usage:
 *  OPENAI_API_KEY=sk-... node agent.js --task "Describe the change you want" [--yes] [--model gpt-4.1-mini]
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { exec as _exec } from "child_process";
import { fileURLToPath } from "url";

const exec = (cmd, opts = {}) =>
  new Promise((res, rej) => _exec(cmd, { maxBuffer: 1024 * 1024 * 20, ...opts }, (e, so, se) => e ? rej({ e, so, se }) : res({ so, se })));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- CLI ----------------
const args = new Map(process.argv.slice(2).map((a, i, arr) => {
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : true;
    return [k, v];
  }
  return [a, true];
}));

const TASK = args.get("task") || args.get("t");
const AUTO_YES = !!args.get("yes");
const MODEL = args.get("model") || process.env.MODEL || "gpt-4.1-mini";
const API_KEY = process.env.OPENAI_API_KEY;

if (!TASK) {
  console.error("Error: --task is required.");
  process.exit(1);
}
if (!API_KEY) {
  console.error("Error: set OPENAI_API_KEY in env.");
  process.exit(1);
}

// ---------------- Config ----------------
const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".hg", ".svn",
  "dist", "build", ".next", ".turbo", ".vercel", "coverage",
  ".agent_backups", ".cache", ".parcel-cache", ".output"
]);
const IMPORTANT_FILES = new Set([
  "package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock",
  "firebase.json", ".firebaserc", ".env", ".env.local", "vercel.json",
  "tsconfig.json", "jsconfig.json", "next.config.js", "vite.config.ts", "vite.config.js",
  "netlify.toml", "Dockerfile"
]);

const MAX_FILES = 220;
const MAX_BYTES_PER_FILE = 6000;
const MAX_TOTAL_BYTES = 900000;

// ---------------- Helpers ----------------
function* walk(dir) {
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const ents = fs.readdirSync(cur, { withFileTypes: true });
    for (const ent of ents) {
      const p = path.join(cur, ent.name);
      const rel = path.relative(process.cwd(), p);
      if (ent.isDirectory()) {
        const base = path.basename(p);
        if (IGNORE_DIRS.has(base)) continue;
        stack.push(p);
      } else if (ent.isFile()) {
        yield rel;
      }
    }
  }
}

function readHead(p, maxBytes = MAX_BYTES_PER_FILE) {
  try {
    const fd = fs.openSync(p, "r");
    const buf = Buffer.allocUnsafe(maxBytes);
    const r = fs.readSync(fd, buf, 0, maxBytes, 0);
    fs.closeSync(fd);
    return buf.subarray(0, r).toString("utf8");
  } catch {
    return "";
  }
}

function isTextLike(filename) {
  const ext = path.extname(filename).toLowerCase();
  const textExts = new Set([
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".mdx",
    ".html", ".css", ".scss", ".sass", ".less",
    ".yml", ".yaml", ".toml", ".txt", ".gitignore", ".gitattributes",
    ".env", ".sh", ".bash", ".zsh", ".dockerfile"
  ]);
  if (textExts.has(ext)) return true;
  if (!ext) return true;
  return false;
}

function summarizeRepo() {
  const files = [];
  let total = 0;

  for (const f of IMPORTANT_FILES) {
    if (fs.existsSync(f) && fs.statSync(f).isFile()) {
      const content = readHead(f);
      total += Buffer.byteLength(content, "utf8");
      files.push({ path: f, size: content.length, content });
    }
  }

  for (const rel of walk(process.cwd())) {
    if (files.length >= MAX_FILES) break;
    if (!isTextLike(rel)) continue;
    if (IMPORTANT_FILES.has(rel)) continue;

    const st = fs.statSync(rel);
    if (st.size === 0) continue;

    const chunk = readHead(rel);
    if (!chunk) continue;

    const add = Buffer.byteLength(chunk, "utf8");
    if (total + add > MAX_TOTAL_BYTES) break;

    files.push({ path: rel, size: Math.min(st.size, MAX_BYTES_PER_FILE), content: chunk });
    total += add;
  }

  return files.map(f => ({
    path: f.path,
    head_bytes: f.size,
    content_head: f.content
  }));
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function promptYesNo(q) {
  if (AUTO_YES) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise(res => rl.question(`${q} (y/N): `, res));
  rl.close();
  return /^y(es)?$/i.test(ans.trim());
}

// ---------------- OpenAI minimal client ----------------
async function chatComplete({ model, messages, temperature = 0 }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

// ---------------- Patch/Write ----------------
function ensureBackupDir() {
  const dir = path.join(process.cwd(), ".agent_backups");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function backupFile(filePath) {
  const backups = ensureBackupDir();
  const stamp = nowStamp();
  const dst = path.join(backups, `${filePath.replace(/[\\/]/g, "__")}__${stamp}`);
  try {
    if (fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(filePath, dst);
    }
  } catch {}
}

function applyFullUpsert(edit) {
  const p = edit.path;
  backupFile(p);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, edit.content, "utf8");
}

function applyUnifiedPatch(edit) {
  const p = edit.path;
  const original = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  const lines = original.split("\n");
  const patch = edit.patch.split("\n");

  const hunks = [];
  let i = 0;
  while (i < patch.length) {
    const line = patch[i];
    if (line.startsWith("@@")) {
      const m = /@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/.exec(line);
      if (!m) { i++; continue; }
      const startNew = parseInt(m[3], 10) - 1;
      i++;
      const h = { startNew, lines: [] };
      while (i < patch.length && !patch[i].startsWith("@@")) {
        h.lines.push(patch[i]);
        i++;
      }
      hunks.push(h);
    } else {
      i++;
    }
  }

  let out = lines.slice();
  for (const h of hunks) {
    const seg = [];
    for (const l of h.lines) {
      if (l.startsWith("+")) seg.push(l.slice(1));
      else if (l.startsWith(" ")) { seg.push(l.slice(1)); }
      else if (l.startsWith("-")) { }
      else { seg.push(l); }
    }
    const removeCount = h.lines.filter(x => x.startsWith(" ") || x.startsWith("-")).length;
    out.splice(h.startNew, removeCount, ...seg);
  }

  backupFile(p);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, out.join("\n"), "utf8");
}

function previewEdits(edits) {
  const header = "Planned edits:\n";
  const lines = [header];
  for (const e of edits) {
    if (e.patch) lines.push(`• ${e.path} (patch)`);
    else if (e.content) lines.push(`• ${e.path} (upsert)`);
    else lines.push(`• ${e.path} (unknown)`);
  }
  return lines.join("\n");
}

// ---------------- Main ----------------
(async () => {
  const repo = summarizeRepo();

  const system = {
    role: "system",
    content:
`You are a code-modification agent for a Firebase/Node/React web app.
Constraints:
- Output strict JSON only. No prose. Use this schema:
{
  "plan": "short summary",
  "edits": [
    {
      "path": "relative/path.ext",
      "content": "entire new file content"
    }
  ],
  "commands": [],
  "notes": ""
}
Rules:
- Prefer 'content' for new files.
- For large files, prefer 'patch'.
- No changes to ignored paths.`
  };

  const user = {
    role: "user",
    content:
`Task: ${TASK}

Repo snapshot (truncated heads):
${JSON.stringify(repo, null, 2)}`
  };

  let result;
  try {
    result = await chatComplete({ model: MODEL, messages: [system, user] });
  } catch (e) {
    console.error(`Model call failed: ${e.message}`);
    process.exit(1);
  }

  const { plan, edits = [], commands = [], notes = "" } = result || {};
  if (!Array.isArray(edits)) {
    console.error("Invalid response: 'edits' missing.");
    process.exit(1);
  }

  console.log("\nPlan:\n" + (plan || "(none)"));
  if (notes) console.log("\nNotes:\n" + notes);

  console.log("\n" + previewEdits(edits));
  const proceed = await promptYesNo("Apply these edits?");
  if (!proceed) {
    console.log("Aborted.");
    process.exit(0);
  }

  for (const e of edits) {
    if (!e?.path) continue;
    if (e.content != null) {
      applyFullUpsert(e);
      console.log(`Applied upsert: ${e.path}`);
    } else if (e.patch != null) {
      applyUnifiedPatch(e);
      console.log(`Applied patch: ${e.path}`);
    } else {
      console.warn(`Skipped ${e.path}: neither 'content' nor 'patch'.`);
    }
  }

  if (commands.length) {
    const run = await promptYesNo(`Run ${commands.length} command(s) now?`);
    if (run) {
      for (const c of commands) {
        console.log(`\n$ ${c}`);
        try {
          const { so, se } = await exec(c, { cwd: process.cwd() });
          if (so) process.stdout.write(so);
          if (se) process.stderr.write(se);
        } catch ({ so, se }) {
          if (so) process.stdout.write(so);
          if (se) process.stderr.write(se);
        }
      }
    }
  }

  console.log("\nDone.");
})();
