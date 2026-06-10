# Claude Code Configuration Guide

This document explains every file and folder inside `.claude/` — what each one does, when it executes, and how to extend it.

---

## Overview

The `.claude/` directory is the Claude Code configuration layer for this project. It tells Claude Code how to behave, what it is allowed to do, which specialist agents to use, and how to automate multi-step workflows.

```
.claude/
├── CLAUDE.md (project root)      ← loaded into every session automatically
├── settings.json                 ← permissions, hooks, allowed tools
├── settings.local.json           ← machine-local overrides (gitignored)
├── agents/                       ← specialist sub-agents
├── commands/                     ← slash commands (/create-endpoint, etc.)
├── skills/                       ← installable skill packs
├── workflows/                    ← multi-agent orchestration scripts
└── memory/                       ← persistent cross-session memory
```

---

## CLAUDE.md

**Location:** `CLAUDE.md` (project root)

**What it is:** The primary instruction file. Loaded automatically at the start of every Claude Code session. Think of it as the system prompt for this project.

**What it contains:**
- Tech stack summary (Java 21, Spring Boot 3, Gradle, etc.)
- Architecture rules (layered architecture, no Lombok, constructor injection)
- Database conventions (Flyway only, no ddl-auto, H2 for dev, Testcontainers for integration)
- Observability conventions (Micrometer, Actuator endpoints, Grafana)
- Build commands reference
- CI/CD overview
- Index of available agents and skills

**When to update:** Whenever a new convention is established, a new tool is added to the stack, or an architectural rule changes.

---

## settings.json

**Location:** `.claude/settings.json`

**What it is:** The security and behaviour policy for Claude Code in this project. Controls what Claude is allowed to run without asking.

### Permissions

```json
"permissions": {
  "allow": [...],
  "deny": [...]
}
```

**Allow list** — commands and MCP tools Claude can run without prompting:
- `Bash(./gradlew *)` — any Gradle task
- `Bash(git *)` — read-only and staging git commands
- `Bash(gh pr/issue/run/workflow *)` — GitHub CLI read operations
- `Bash(docker compose/ps/logs *)` — Docker Compose management
- `mcp__github__*` — GitHub MCP server tools (PR review, inline comments)

**Deny list** — commands that are always blocked:
- `rm -rf *` — destructive filesystem operations
- `git push --force*` — force push (must be done manually)
- `git reset --hard *` — hard resets
- `sudo *` — privilege escalation
- `docker rm -f *` — force container removal

### Hooks

Hooks are shell commands that run automatically around tool use. They enforce project conventions without requiring Claude to remember them.

#### PreToolUse — `Bash` matcher
**Trigger:** Before any `git commit` command.
**Action:** Runs `./gradlew test`. If tests fail, blocks the commit with exit code 1.

```
[hook] Running tests before commit...
[hook] BLOCKED: tests failed. Fix before committing.
```

#### PostToolUse — `Write|Edit` (Entity files)
**Trigger:** After writing or editing a `.java` file that contains `@Entity` or `@Table`.
**Action:** Reminds Claude to create a Flyway migration if the schema changed.

#### PostToolUse — `Write` (Migration files)
**Trigger:** After writing a file matching `db/migration/V{n}__*.sql`.
**Action:** Automatically runs `./gradlew flywayMigrate` and reports success or failure.

#### PostToolUse — `Write|Edit` (Java formatting)
**Trigger:** After writing or editing any `.java` file.
**Action:** Runs `palantir-java-format` on the file if installed. Skips silently if not installed.

#### PostToolUse — `Bash` (Test result reporting)
**Trigger:** After any `gradlew test` command.
**Action:** Prints `[hook] Tests PASSED.` or `[hook] Tests FAILED — do not commit.`

#### Stop
**Trigger:** When a Claude Code session ends.
**Action:** Prints a reminder to run tests before committing.

---

## settings.local.json

**Location:** `.claude/settings.local.json` (gitignored)

**What it is:** Machine-local permission overrides. Same format as `settings.json`. Use this for developer-specific allow rules that should not be shared with the team (e.g. allowing `npm install` on your machine).

---

## agents/

**Location:** `.claude/agents/`

**What they are:** Specialist sub-agents. Each `.md` file defines an agent with a specific role, knowledge scope, and set of allowed tools. Claude Code automatically selects the right agent based on the task, or you can invoke one explicitly.

**How they work:** When Claude Code decides to use a sub-agent, it spawns a fresh context with the agent's system prompt. The agent operates independently, then returns its result to the main session.

### Available agents

| File | Agent name | When to use |
|---|---|---|
| `java-architect.md` | `java-architect` | Architecture decisions, package structure, design tradeoffs. Read-only. |
| `spring-boot-engineer.md` | `spring-boot-engineer` | Feature implementation: endpoints, services, domain, repositories. |
| `testing-engineer.md` | `testing-engineer` | Test strategy, coverage gaps, Testcontainers setup, fixing failing tests. |
| `security-reviewer.md` | `security-reviewer` | OWASP Top 10 review, input validation, auth gaps, secrets detection. Read-only. |
| `observability-engineer.md` | `observability-engineer` | OTEL instrumentation, Micrometer metrics, Grafana dashboards. |
| `database-engineer.md` | `database-engineer` | Schema design, Flyway migrations, query optimisation, Testcontainers. |
| `documentation-writer.md` | `documentation-writer` | API docs, README, OpenAPI annotations. Write-only to docs files. |
| `performance-engineer.md` | `performance-engineer` | Profiling, caching, load testing, slow endpoint investigation. |
| `react-engineer.md` | `react-engineer` | React frontend: components, hooks, API wiring, Tailwind. |
| `api-engineer.md` | `api-engineer` | OpenAPI/Swagger annotations, curl examples, response shape review. |
| `github-reviewer.md` | `github-reviewer` | Full PR code review using GitHub MCP. Posts inline comments to GitHub. |

### Agent file format

```markdown
---
name: agent-name
description: >
  When Claude Code should trigger this agent.
  Include trigger phrases and exclusions.
tools:
  - Bash
  - Read
  - Write
  - mcp__github__get_pull_request   ← optional: explicit MCP tool access
---

# Agent system prompt here
```

The `tools` field is optional. If omitted, the agent inherits the session's default tool set.

---

## commands/

**Location:** `.claude/commands/`

**What they are:** Slash commands — typed as `/command-name` in the Claude Code prompt. Each `.md` file defines one command.

**How they work:** When you type `/create-endpoint`, Claude Code loads the corresponding `.md` file and executes the instructions inside as a structured prompt, with access to all project tools.

### Available commands

| Command | File | What it does |
|---|---|---|
| `/create-endpoint` | `create-endpoint.md` | Scaffolds a full REST endpoint: domain → migration → repo → service → controller → tests |
| `/create-entity` | `create-entity.md` | Creates a new JPA entity with migration, repository, and CRUD service |
| `/create-integration` | `create-integration.md` | Adds a Testcontainers integration test for an existing feature |
| `/create-test-suite` | `create-test-suite.md` | Adds missing test coverage to existing code |
| `/review-code` | `review-code.md` | Full PR code review via GitHub MCP — posts findings as inline GitHub comments |
| `/review-security` | `review-security.md` | OWASP Top 10 security review of the current code |
| `/review-observability` | `review-observability.md` | Reviews Micrometer metrics, OTEL spans, logging, and Prometheus output |

### Command file format

```markdown
---
description: "Short description shown in the command picker"
---

Step-by-step instructions that Claude executes when the command is invoked.
```

---

## skills/

**Location:** `.claude/skills/`

**What they are:** Installable skill packs. Each subdirectory contains a `SKILL.md` that defines a reusable capability. Skills are invoked by name and can orchestrate agents, tools, and commands.

**How they differ from commands:** Commands are simple step-by-step instructions. Skills are richer — they can include decision logic, invoke multiple agents, and describe complex multi-step behaviours.

### Available skills

| Skill | Directory | What it does |
|---|---|---|
| `github-code-review` | `github-code-review/` | Fetches PR from GitHub, reviews with `github-reviewer` agent, posts inline comments |
| `api-documentation` | `api-documentation/` | Writes or updates OpenAPI/Swagger annotations |
| `docker-development` | `docker-development/` | Manages full Docker Compose + Minikube stack |
| `junit-testing` | `junit-testing/` | Writes or improves JUnit 5 tests |
| `prometheus-observability` | `prometheus-observability/` | Adds/reviews Prometheus metrics and Grafana dashboards |
| `react-frontend` | `react-frontend/` | React component and hook patterns |
| `security-review` | `security-review/` | OWASP security audit |
| `spring-boot-api` | `spring-boot-api/` | Spring Boot API patterns and conventions |
| `testcontainers` | `testcontainers/` | Testcontainers integration test setup |
| `hexagonal-architecture` | `hexagonal-architecture/` | Hexagonal/ports-and-adapters patterns |
| `integration-patterns` | `integration-patterns/` | Service integration patterns |

### Skill file format

```markdown
---
trigger: skill-name
description: One-line description shown in the skill picker
---

## What this skill does
...

## Steps
1. ...
2. ...

## Usage
/skill-name
```

---

## workflows/

**Location:** `.claude/workflows/`

**What they are:** Multi-agent orchestration scripts written in JavaScript. They run multiple specialist agents in sequence or parallel, passing results between phases. Workflows are the most powerful automation layer.

**How they work:** Workflows use the Claude Code workflow runtime API: `agent()`, `parallel()`, `pipeline()`, `phase()`. Each `agent()` call spawns a fresh sub-agent with a specific prompt and optional JSON schema for structured output.

### Available workflows

#### `feature-end-to-end.js`

The flagship workflow. Takes a feature specification and delivers a complete, tested, reviewed, and shipped feature across 11 phases.

**Invoke with:**
```
/feature-end-to-end "add due date reminders — GET /tasks/reminders returns all tasks where reminder_date is today or past and status is not DONE"
```

**Phases:**

| Phase | Agent | What happens |
|---|---|---|
| Analyse | — | Reads codebase, maps entities, finds migration version, identifies new fields/endpoints |
| Architect | `java-architect` | Reviews design against architecture rules. Blocks if violations found. |
| Plan | — | Produces detailed plan: DTOs, service methods, repo queries, exception names, test scenarios, migration filenames |
| Migrate | `database-engineer` | Writes Flyway SQL, runs `./gradlew test` to confirm Flyway validates |
| Implement | `spring-boot-engineer` | Writes domain → DTOs → repository → exceptions → service → controller in that order |
| Test | `testing-engineer` | Unit tests + `@WebMvcTest` slice tests + Testcontainers integration tests. Runs and fixes until green. |
| Security | `security-reviewer` | OWASP Top 10 check on the diff. Auto-fixes critical/high findings. |
| Observability | `observability-engineer` | Adds Micrometer counters/timers for new service methods |
| Review | `github-reviewer` | Full diff review using the github-reviewer checklist. Auto-fixes blockers. |
| Ship | — | Parallel `./gradlew build` + `./gradlew test`, then `./gradlew integrationTest` gate |
| Frontend | `react-engineer` | TypeScript types + API wrappers + TanStack Query hooks + page components. `npm run build` gate. |

**Workflow script format:**
```javascript
export const meta = {
  name: 'workflow-name',
  description: 'What this workflow does',
  phases: [
    { title: 'Phase Name', detail: 'What happens' },
  ],
}

phase('Phase Name')
const result = await agent('prompt', { label: 'label', schema: SCHEMA })
```

---

## memory/

**Location:** `.claude/memory/`

**What it is:** Persistent cross-session memory. Claude Code loads the `MEMORY.md` index at the start of each session and reads referenced files when the context is relevant. This allows knowledge from previous sessions to carry forward.

**How it works:** `MEMORY.md` is a short index (one line per entry). Each entry points to a detailed memory file. Claude reads individual files when the topic is relevant to the current task.

### Memory files

| File | Type | Contents |
|---|---|---|
| `MEMORY.md` | Index | One-line pointers to all memory files |
| `architecture-decisions.md` | Project | Why key architectural choices were made |
| `known-gotchas.md` | Project | Traps already hit: Flyway, Docker, ports, formatting |
| `conventions.md` | Project | Commit style, test naming, DTO rules, metric naming |
| `infra-notes.md` | Project | Port map, env vars, service dependencies, Docker memory |

### Memory file format

```markdown
---
name: memory-slug
description: One-line summary — used to decide relevance
metadata:
  type: project | user | feedback | reference
---

Memory content here.
**Why:** The reason this was decided.
**How to apply:** When this knowledge is relevant.
```

---

## .mcp.json

**Location:** `.mcp.json` (project root)

**What it is:** MCP (Model Context Protocol) server configuration. Defines external tool servers that Claude Code can call as first-class tools.

**Current servers:**

### `github` — GitHub MCP Server

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
               "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Runs the official GitHub MCP server via Docker. Provides tools:
- `list_pull_requests` / `get_pull_request` — fetch PR metadata
- `list_pull_request_files` / `get_pull_request_diff` — get changed files and diff
- `create_pull_request_review` — post a review (APPROVE / REQUEST_CHANGES / COMMENT)
- `add_pull_request_review_comment` — post an inline comment on a specific line
- `get_issue` / `list_issues` — read GitHub issues
- `search_code` / `search_repositories` — search GitHub

**Requires:** `GITHUB_TOKEN` in `.env` with `repo` scope (or `pull_requests:write` for fine-grained tokens).

---

## How everything connects

```
User types /feature-end-to-end "add reminders"
    │
    ▼
Claude Code loads CLAUDE.md + memory/MEMORY.md
    │
    ▼
Executes workflows/feature-end-to-end.js
    │
    ├── phase('Analyse') → agent() reads codebase
    ├── phase('Architect') → agent(agentType: 'java-architect')
    ├── phase('Migrate') → agent(agentType: 'database-engineer')
    │       └── hook: Flyway migration written → auto-runs flywayMigrate
    ├── phase('Implement') → agent(agentType: 'spring-boot-engineer')
    │       └── hook: @Entity file written → reminds about migration
    ├── phase('Test') → agent(agentType: 'testing-engineer')
    │       └── hook: gradlew test → reports PASSED/FAILED
    ├── phase('Security') → agent(agentType: 'security-reviewer')
    ├── phase('Review') → agent(agentType: 'github-reviewer')
    │       └── mcp__github__create_pull_request_review
    ├── phase('Ship') → parallel build + test gate
    └── phase('Frontend') → agent(agentType: 'react-engineer')
            └── npm run build gate
```

---

## Quick reference

### Run a slash command
```
/create-endpoint
/create-entity
/review-code
/review-security
/review-observability
```

### Invoke a skill
```
/github-code-review
/docker-development
/junit-testing
```

### Run a workflow
```
/feature-end-to-end "your feature description here"
```

### Add a new agent
1. Create `.claude/agents/my-agent.md` with frontmatter (`name`, `description`, optional `tools`)
2. Write the agent's system prompt in the body
3. Add it to the agents table in `CLAUDE.md`

### Add a new command
1. Create `.claude/commands/my-command.md` with frontmatter (`description`)
2. Write numbered steps in the body
3. Add it to the commands table in `CLAUDE.md`

### Add a new memory
1. Create `.claude/memory/my-memory.md` with frontmatter (`name`, `description`, `metadata.type`)
2. Write the memory content
3. Add a one-line pointer to `MEMORY.md`
