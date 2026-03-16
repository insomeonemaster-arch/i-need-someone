---
name: update-deployment-config
description: Workflow command scaffold for update-deployment-config in i-need-someone.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /update-deployment-config

Use this workflow when working on **update-deployment-config** in `i-need-someone`.

## Goal

Keeps deployment configuration files (vercel.json, vite.config.ts, package.json) in sync for both admin panel and mobile web app frontends.

## Common Files

- `ins-frontend/admin-panel/vercel.json`
- `ins-frontend/mobile-web-app/vercel.json`
- `ins-frontend/admin-panel/vite.config.ts`
- `ins-frontend/mobile-web-app/vite.config.ts`
- `ins-frontend/admin-panel/package.json`
- `ins-frontend/mobile-web-app/package.json`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit vercel.json in both ins-frontend/admin-panel and ins-frontend/mobile-web-app
- Optionally update vite.config.ts and package.json in both locations
- Commit changes together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.