---
name: i-need-someone-conventions
description: Development conventions and patterns for i-need-someone. TypeScript Express project with mixed commits.
---

# I Need Someone Conventions

> Generated from [insomeonemaster-arch/i-need-someone](https://github.com/insomeonemaster-arch/i-need-someone) on 2026-03-16

## Overview

This skill teaches Claude the development patterns and conventions used in i-need-someone.

## Tech Stack

- **Primary Language**: TypeScript
- **Framework**: Express
- **Architecture**: type-based module organization
- **Test Location**: separate

## When to Use This Skill

Activate this skill when:
- Making changes to this repository
- Adding new features following established patterns
- Writing tests that match project conventions
- Creating commits with proper message format

## Commit Conventions

Follow these commit message conventions based on 8 analyzed commits.

### Commit Style: Mixed Style

### Prefixes Used

- `fix`

### Message Guidelines

- Average message length: ~24 characters
- Keep first line concise and descriptive
- Use imperative mood ("Add feature" not "Added feature")


*Commit message example*

```text
fix: use gpt-4o
```

*Commit message example*

```text
Update package.json
```

*Commit message example*

```text
fix: openai key added
```

*Commit message example*

```text
fix: frontend backend
```

*Commit message example*

```text
fix: all ui issues
```

*Commit message example*

```text
fix: config
```

*Commit message example*

```text
fix: vercel.json updated
```

*Commit message example*

```text
added vercel json
```

## Architecture

### Project Structure: Single Package

This project uses **type-based** module organization.

### Source Layout

```
src/
├── config/
├── controllers/
├── lib/
├── middleware/
├── routes/
├── utils/
```

### Entry Points

- `src/app.js`

### Configuration Files

- `ins-frontend/admin-panel/package.json`
- `ins-frontend/admin-panel/vercel.json`
- `ins-frontend/admin-panel/vite.config.ts`
- `ins-frontend/mobile-web-app/package.json`
- `ins-frontend/mobile-web-app/tsconfig.json`
- `ins-frontend/mobile-web-app/vercel.json`
- `ins-frontend/mobile-web-app/vite.config.ts`
- `package.json`

### Guidelines

- Group code by type (components, services, utils)
- Keep related functionality in the same type folder
- Avoid circular dependencies between type folders

## Code Style

### Language: TypeScript

### Naming Conventions

| Element | Convention |
|---------|------------|
| Files | camelCase |
| Functions | camelCase |
| Classes | PascalCase |
| Constants | SCREAMING_SNAKE_CASE |

### Import Style: Relative Imports

### Export Style: Named Exports


*Preferred import style*

```typescript
// Use relative imports
import { Button } from '../components/Button'
import { useAuth } from './hooks/useAuth'
```

*Preferred export style*

```typescript
// Use named exports
export function calculateTotal() { ... }
export const TAX_RATE = 0.1
export interface Order { ... }
```

## Common Workflows

These workflows were detected from analyzing commit patterns.

### Update Deployment Config

Keeps deployment configuration files (vercel.json, vite.config.ts, package.json) in sync for both admin panel and mobile web app frontends.

**Frequency**: ~2 times per month

**Steps**:
1. Edit vercel.json in both ins-frontend/admin-panel and ins-frontend/mobile-web-app
2. Optionally update vite.config.ts and package.json in both locations
3. Commit changes together

**Files typically involved**:
- `ins-frontend/admin-panel/vercel.json`
- `ins-frontend/mobile-web-app/vercel.json`
- `ins-frontend/admin-panel/vite.config.ts`
- `ins-frontend/mobile-web-app/vite.config.ts`
- `ins-frontend/admin-panel/package.json`
- `ins-frontend/mobile-web-app/package.json`

**Example commit sequence**:
```
Edit vercel.json in both ins-frontend/admin-panel and ins-frontend/mobile-web-app
Optionally update vite.config.ts and package.json in both locations
Commit changes together
```

### Cross Frontend Ui Fix

Applies UI fixes or improvements across both admin panel and mobile web app frontends, often touching similar screen/component files in both projects.

**Frequency**: ~2 times per month

**Steps**:
1. Identify UI issues in both admin-panel and mobile-web-app
2. Edit relevant component and screen files in both projects
3. Commit changes together

**Files typically involved**:
- `ins-frontend/admin-panel/src/app/components/ui/*.tsx`
- `ins-frontend/admin-panel/src/app/pages/*.tsx`
- `ins-frontend/mobile-web-app/src/app/components/ui/*.tsx`
- `ins-frontend/mobile-web-app/src/app/screens/**/*.tsx`

**Example commit sequence**:
```
Identify UI issues in both admin-panel and mobile-web-app
Edit relevant component and screen files in both projects
Commit changes together
```

### Backend Controller And Route Update

Updates or fixes backend controller and route files, often together, to add or modify API logic.

**Frequency**: ~2 times per month

**Steps**:
1. Edit or add files in src/controllers/
2. Edit or add files in src/routes/
3. Optionally update src/server.js or middleware

**Files typically involved**:
- `src/controllers/*.js`
- `src/routes/*.js`
- `src/server.js`

**Example commit sequence**:
```
Edit or add files in src/controllers/
Edit or add files in src/routes/
Optionally update src/server.js or middleware
```

### Frontend Backend Service Sync

Synchronizes changes between frontend service files and corresponding backend controllers/routes, ensuring API and frontend stay in sync.

**Frequency**: ~2 times per month

**Steps**:
1. Edit backend controller and route files (src/controllers, src/routes)
2. Edit frontend service files (e.g., ins-frontend/mobile-web-app/src/services/*.ts)
3. Edit related frontend screens/components if needed
4. Commit changes together

**Files typically involved**:
- `src/controllers/*.js`
- `src/routes/*.js`
- `ins-frontend/mobile-web-app/src/services/*.ts`
- `ins-frontend/mobile-web-app/src/app/screens/**/*.tsx`

**Example commit sequence**:
```
Edit backend controller and route files (src/controllers, src/routes)
Edit frontend service files (e.g., ins-frontend/mobile-web-app/src/services/*.ts)
Edit related frontend screens/components if needed
Commit changes together
```

### Package Json Update

Updates package.json files, sometimes across multiple projects, to manage dependencies or scripts.

**Frequency**: ~3 times per month

**Steps**:
1. Edit package.json (optionally in multiple locations)
2. Commit changes

**Files typically involved**:
- `package.json`
- `ins-frontend/admin-panel/package.json`
- `ins-frontend/mobile-web-app/package.json`

**Example commit sequence**:
```
Edit package.json (optionally in multiple locations)
Commit changes
```


## Best Practices

Based on analysis of the codebase, follow these practices:

### Do

- Use camelCase for file names
- Prefer named exports

### Don't

- Don't deviate from established patterns without discussion

---

*This skill was auto-generated by [ECC Tools](https://ecc.tools). Review and customize as needed for your team.*
