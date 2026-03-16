---
name: backend-controller-and-route-update
description: Workflow command scaffold for backend-controller-and-route-update in i-need-someone.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /backend-controller-and-route-update

Use this workflow when working on **backend-controller-and-route-update** in `i-need-someone`.

## Goal

Updates or fixes backend controller and route files, often together, to add or modify API logic.

## Common Files

- `src/controllers/*.js`
- `src/routes/*.js`
- `src/server.js`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Edit or add files in src/controllers/
- Edit or add files in src/routes/
- Optionally update src/server.js or middleware

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.