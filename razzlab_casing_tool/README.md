
# RazzLab Casing Audit Kit

This kit helps you find and fix inconsistent capitalization of the brand name **RazzLab** across your codebase and content.

## What's inside

- `scripts/audit_casing.js` — Node.js script that scans your project, writes a report, and can auto-fix.
- `assets/RazzLab-logo.svg` — Simple, text-based SVG wordmark (you can replace with your official asset later).
- `.github/workflows/casing_audit.yml` — GitHub Actions workflow to run the audit on every push/PR.

## Quick start

1. Copy the `RazzLab_casing_tool/` folder into your repo.
2. Ensure Node.js >= 16 is available locally and in CI.
3. Run a **report-only** scan first:

```bash
node RazzLab_casing_tool/scripts/audit_casing.js --root .
```

This writes `casing_report.csv` and `casing_report.json` to your current working directory.

4. Review the report. If everything looks good, run the fixer:

```bash
node RazzLab_casing_tool/scripts/audit_casing.js --root . --fix
```

> ⚠️ The fixer will replace any case-insensitive "RazzLab" with **RazzLab**, except when it looks like a domain/email (e.g., `razzlab.com`, `hello@razzlab.com`). Always commit first or run on a branch.

## CI (GitHub Actions)

If your repo is on GitHub, keep `.github/workflows/casing_audit.yml`. It runs the audit on pushes/PRs to `main`/`master` and fails if any issues are found.

## License

Use however you want. No attribution required.
