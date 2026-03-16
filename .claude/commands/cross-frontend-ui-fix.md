---
name: cross-frontend-ui-fix
description: Workflow command scaffold for cross-frontend-ui-fix in i-need-someone.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /cross-frontend-ui-fix

Use this workflow when working on **cross-frontend-ui-fix** in `i-need-someone`.

## Goal

Applies UI fixes or improvements across both admin panel and mobile web app frontends, often touching similar screen/component files in both projects.

## Common Files

- `ins-frontend/admin-panel/src/app/components/ui/*.tsx`
- `ins-frontend/admin-panel/src/app/pages/*.tsx`
- `ins-frontend/mobile-web-app/src/app/components/ui/*.tsx`
- `ins-frontend/mobile-web-app/src/app/screens/**/*.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify UI issues in both admin-panel and mobile-web-app
- Edit relevant component and screen files in both projects
- Commit changes together

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.