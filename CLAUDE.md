# CLAUDE.md — AI Assistant Guide for tradingcup

This file provides essential context for AI assistants (Claude and others) working on the `tradingcup` repository. Keep this document updated as the project evolves.

---

## Project Overview

**tradingcup** is a trading competition platform. The project is in its earliest stage — only a README placeholder exists at this time. This document will evolve alongside the codebase.

- **Repository:** `hangjie2013/tradingcup`
- **Current status:** Initial setup, no source code yet
- **Primary branch:** `master`

---

## Repository Structure

```
tradingcup/
├── README.md          # Project title placeholder
└── CLAUDE.md          # This file — AI assistant guide
```

As the project grows, update this section to reflect the actual directory layout. Common additions to expect:

```
tradingcup/
├── src/               # Application source code
├── tests/             # Test suites
├── docs/              # Documentation
├── scripts/           # Build/utility scripts
├── config/            # Configuration files
├── .github/           # CI/CD workflows
├── package.json       # (or equivalent dependency manifest)
├── README.md
└── CLAUDE.md
```

---

## Technology Stack

> **Not yet defined.** Update this section once the stack is chosen and the first source files are committed.

Likely candidates for a trading platform:

| Layer       | Candidates                                    |
|-------------|-----------------------------------------------|
| Language    | TypeScript / Python / Go                      |
| Backend     | Node.js / FastAPI / Gin                       |
| Frontend    | React / Next.js / Vue                         |
| Database    | PostgreSQL / TimescaleDB / Redis              |
| Messaging   | Kafka / RabbitMQ                              |
| Deployment  | Docker / Kubernetes                           |

---

## Development Workflow

### Branching Strategy

- **`master`** — stable, production-ready code
- **`dev`** or **`develop`** — integration branch (add if needed)
- **Feature branches** — `feature/<short-description>`
- **Bug fixes** — `fix/<short-description>`
- **Claude-generated branches** — `claude/<task-id>` (auto-created by Claude Code)

### Typical Workflow

1. Create a feature branch from `master`.
2. Implement changes with focused, atomic commits.
3. Write or update tests to cover the change.
4. Open a pull request targeting `master`.
5. Pass all CI checks before merging.

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(api): add endpoint for submitting trade orders
fix(auth): handle expired JWT tokens gracefully
docs(claude): update CLAUDE.md with stack details
test(matching): add unit tests for order matching engine
```

---

## Build, Test, and Lint Commands

> **Not yet configured.** Add commands here once the project tooling is set up.

Placeholder structure — update when tooling is defined:

```bash
# Install dependencies
<install command>

# Run development server
<dev command>

# Run tests
<test command>

# Run linter
<lint command>

# Build for production
<build command>
```

---

## Key Conventions for AI Assistants

### General Rules

1. **Read before modifying.** Always read a file before editing it. Never assume its contents.
2. **Minimal changes.** Only change what is necessary to satisfy the task. Avoid refactoring or adding features beyond scope.
3. **No unnecessary files.** Do not create README files, documentation, or helper utilities unless explicitly requested.
4. **No secrets.** Never commit API keys, passwords, tokens, or credentials. Use environment variables and `.env` files (which must be `.gitignore`d).
5. **Test coverage.** When adding logic, include corresponding tests. Do not skip tests unless explicitly asked.
6. **Security awareness.** Avoid introducing OWASP Top 10 vulnerabilities — SQL injection, XSS, command injection, insecure deserialization, etc.

### Git Operations

- Always work on the designated branch for the task.
- Push with: `git push -u origin <branch-name>`
- Claude-managed branches follow the pattern `claude/<task-id>`.
- If a push fails due to a network error, retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

### Code Style (to be defined)

> Update this section once linting and formatting tools are configured.

- Follow the project's linter configuration strictly.
- Do not add comments to code you did not write unless the logic is non-obvious.
- Prefer explicit over clever code.
- Keep functions small and single-purpose.

### Trading Domain Conventions

As a trading platform, expect and respect these domain concepts:

| Term            | Meaning                                              |
|-----------------|------------------------------------------------------|
| Order           | An instruction to buy or sell an asset               |
| Trade / Fill    | An executed match between a buy and a sell order     |
| Position        | Current holding of an asset for a participant        |
| P&L             | Profit and Loss — performance metric                 |
| Leaderboard     | Ranking of participants by performance               |
| Symbol / Ticker | Identifier for a tradable asset (e.g. AAPL, BTC)    |
| Lot size        | Minimum unit of trade for a given asset              |

---

## Environment Variables

> **Not yet defined.** Document all required environment variables here as they are introduced.

Format:

```
VAR_NAME=<description of value>       # required/optional
```

Example (to be replaced with actual vars):

```
DATABASE_URL=<postgres connection string>    # required
REDIS_URL=<redis connection string>          # required
JWT_SECRET=<signing secret for auth tokens> # required
PORT=3000                                    # optional, default 3000
```

---

## CI/CD

> **Not yet configured.** Add CI/CD pipeline details here once `.github/workflows/` or equivalent is set up.

Recommended checks to enforce in CI:

- [ ] Linting passes with zero warnings
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No secrets detected (e.g. via `gitleaks` or `truffleHog`)

---

## Keeping This File Updated

**Every time a significant change is made to the project, update CLAUDE.md:**

- New dependency or framework added → update Technology Stack
- New environment variable added → update Environment Variables
- New build/test command added → update Build, Test, and Lint Commands
- Architectural decision made → add an Architecture section
- New domain concept introduced → add to Trading Domain Conventions

AI assistants should treat CLAUDE.md as a living document and propose updates as part of feature PRs when relevant.
