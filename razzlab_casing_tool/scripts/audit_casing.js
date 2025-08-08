#!/usr/bin/env node
/**
 * RazzLab Casing Audit & Fixer
 * Scans files for incorrect "RazzLab" casing (e.g., "RazzLab", "RazzLab") and optionally fixes them.
 *
 * Usage:
 *   node scripts/audit_casing.js --root ../my-project
 *   node scripts/audit_casing.js --root ../my-project --fix
 *
 * Notes:
 * - Skips node_modules, .git, build, dist, .next, out
 * - Does NOT change occurrences that are part of a domain like "razzlab.com"
 * - Only normalizes brand casing to exactly "RazzLab"
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
function getArg(name, def = null) {
  const idx = argv.indexOf(`--${name}`);
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  if (argv.includes(`--${name}`)) return true;
  return def;
}

const ROOT = path.resolve(getArg('root', '.'));
const DO_FIX = argv.includes('--fix');
const EXT_LIST = (getArg('ext') || '.js,.jsx,.ts,.tsx,.mjs,.cjs,.html,.css,.scss,.md,.json,.yml,.yaml').split(',');

const SKIP_DIRS = new Set(['node_modules', '.git', 'build', 'dist', '.next', 'out', 'tmp', 'coverage']);

const reportRows = [];
let totalFinds = 0;
let totalFixed = 0;

function shouldSkipDir(dir) {
  return SKIP_DIRS.has(require('path').basename(dir));
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let out = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (shouldSkipDir(p)) continue;
      out = out.concat(listFiles(p));
    } else {
      const ext = path.extname(e.name);
      if (EXT_LIST.includes(ext)) out.push(p);
    }
  }
  return out;
}

/** 
 * Return true if the match should be skipped (domains like razzlab.com)
 */
function isDomainContext(line, startIdx, endIdx) {
  const after = line.slice(endIdx, endIdx + 12).toLowerCase();
  if (after.startsWith('.com') || after.startsWith('.io') || after.startsWith('.net') || after.startsWith('.app')) {
    return true;
  }
  // Skip email-like contexts
  const before = line.slice(Math.max(0, startIdx - 1), startIdx);
  if (before === '@') return true;
  return false;
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  // case-insensitive "RazzLab" finder
  const regex = /RazzLab/gi;

  let modified = false;
  let newLines = [...lines];

  lines.forEach((line, i) => {
    let m;
    regex.lastIndex = 0;
    while ((m = regex.exec(line)) !== null) {
      const found = m[0];
      const start = m.index;
      const end = m.index + found.length;

      // Skip correct brand casing
      if (found === 'RazzLab') continue;

      // Skip domains/emails
      if (isDomainContext(line, start, end)) continue;

      totalFinds++;
      const suggestion = 'RazzLab';

      reportRows.push({
        file: filePath,
        line: i + 1,
        column: start + 1,
        found_text: found,
        suggestion,
        context: line.trim().slice(0, 200)
      });

      if (DO_FIX) {
        const before = newLines[i].slice(0, start);
        const after = newLines[i].slice(end);
        newLines[i] = before + suggestion + after;
        // Adjust regex.lastIndex to continue correctly after replacement
        regex.lastIndex = start + suggestion.length;
        modified = true;
        totalFixed++;
      }
    }
  });

  if (DO_FIX && modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`Root path not found: ${ROOT}`);
    process.exit(1);
  }
  const files = listFiles(ROOT);
  files.forEach(scanFile);

  // Write CSV + JSON reports in the current working dir
  const outDir = path.resolve(process.cwd());
  const csvPath = path.join(outDir, 'casing_report.csv');
  const jsonPath = path.join(outDir, 'casing_report.json');

  // CSV
  const header = ['file','line','column','found_text','suggestion','context'];
  const csvLines = [header.join(',')].concat(
    reportRows.map(r => header.map(h => {
      const v = String(r[h] ?? '');
      const safe = `"${v.replace(/"/g, '""')}"`;
      return safe;
    }).join(','))
  );
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({ totalFinds, totalFixed: DO_FIX ? totalFixed : 0, items: reportRows }, null, 2), 'utf8');

  console.log(`Scanned ${files.length} files under ${ROOT}`);
  console.log(`Finds: ${totalFinds}`);
  if (DO_FIX) console.log(`Fixed: ${totalFixed}`);
  console.log(`Report written to:\n  ${csvPath}\n  ${jsonPath}`);
}

main();
