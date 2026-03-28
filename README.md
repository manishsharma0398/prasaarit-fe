# prasaarit-fe

Frontend for Prasaarit — built with [Next.js](https://nextjs.org), TypeScript, Tailwind CSS, and shadcn/ui components.

---

## Requirements

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) — install with:
  ```bash
  npm install -g pnpm
  ```

---

## Getting started after cloning

Run these steps once after cloning the repo on a new machine:

```bash
# 1. Install all dependencies
#    This also automatically installs the git pre-commit hooks via the
#    "prepare" script (husky) — no extra step needed.
pnpm install

# 2. Set up environment variables
cp .env.local.example .env.local
# Fill in the required values in .env.local
```

> **Note:** The `prepare` script runs `husky` automatically on every `pnpm install`,
> so pre-commit hooks are set up for all contributors without any manual step.

---

## Running locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment variables

These are **server-side only** — no `NEXT_PUBLIC_` prefix, so they are never sent to the browser.
Next.js Route Handlers (`/app/api/...`) proxy all upload API calls so the real endpoint URL stays private.

| Variable              | Example                                             | Description                                      |
| --------------------- | --------------------------------------------------- | ------------------------------------------------ |
| `UPLOAD_API_BASE_URL` | `https://<id>.execute-api.ap-south-1.amazonaws.com` | Base URL of the upload service (AWS API Gateway) |
| `API_STAGE`           | `stg`                                               | API Gateway stage — appended to the base URL     |
| `NODE_ENV`            | `development`                                       | Node environment                                 |

`.env.local` overrides for local development (e.g. `UPLOAD_API_BASE_URL=http://localhost:8000`).

---

## Code quality

This project uses **prettier** for formatting and **eslint** for linting.

### Format all files

```bash
pnpm exec prettier --write .
```

### Lint all files

```bash
pnpm lint
# or with auto-fix
pnpm exec eslint --fix src/
```

---

## Pre-commit hooks

Hooks run automatically on every `git commit` via [husky](https://typicode.github.io/husky) +
[lint-staged](https://github.com/lint-staged/lint-staged). Only staged files are processed —
commits stay fast regardless of project size.

### What runs on commit

| File types                                | Checks                              |
| ----------------------------------------- | ----------------------------------- |
| `*.ts`, `*.tsx`, `*.js`, `*.jsx`, `*.mjs` | `prettier --write` → `eslint --fix` |
| `*.json`, `*.css`, `*.md`                 | `prettier --write`                  |

### Run on all files manually

Useful when you first clone, add a new hook, or want to reformat everything at once:

```bash
# Format everything with prettier
pnpm exec prettier --write .

# Lint and fix everything with eslint
pnpm exec eslint --fix src/
```

### Run lint-staged manually (simulates what runs on commit)

```bash
pnpm exec lint-staged
```

---

## Tech stack

| Tool                                                                    | Purpose                         |
| ----------------------------------------------------------------------- | ------------------------------- |
| [Next.js 16](https://nextjs.org)                                        | React framework                 |
| [TypeScript](https://www.typescriptlang.org)                            | Type safety                     |
| [Tailwind CSS v4](https://tailwindcss.com)                              | Styling                         |
| [shadcn/ui](https://ui.shadcn.com)                                      | Component library (Radix UI)    |
| [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | Form handling & validation      |
| [Prettier](https://prettier.io)                                         | Code formatting                 |
| [ESLint](https://eslint.org)                                            | Linting (Next.js config)        |
| [Husky](https://typicode.github.io/husky)                               | Git hooks                       |
| [lint-staged](https://github.com/lint-staged/lint-staged)               | Run checks on staged files only |
