---
name: update-docs
description: >
  Use this skill after any feature, behaviour, or architecture change that affects
  how the project works, how to run it, or how the API behaves. Triggers include:
  new endpoint, changed request/response shape, new environment variable, updated
  build process, or structural refactor. Never modifies production code — docs only.
---

# Skill: update-docs

Updates documentation to reflect what actually exists in the code.
Documentation should describe reality — not intentions, not outdated behaviour.
Never modifies production code or test files.

---

## Step 1 — Understand what changed

```bash
git diff
git diff --cached
git log --oneline -5
```

Read the full diff before touching any doc.
If the diff is empty, report that and stop.

---

## Step 2 — Read the affected code in full

Do not update docs from the diff alone — always read the full implementation:

```
Read  → every changed controller, service, or domain class
Read  → CLAUDE.md to confirm current architecture conventions
Grep  → @RequestMapping, @PostMapping, @GetMapping  (confirm actual endpoints)
Grep  → @Value, application.properties, application.yml  (confirm config)
LS    → docs/  (see what doc files already exist)
```

---

## Step 3 — Identify what needs updating

For each change, decide which documents are affected:

| What changed | Documents to update |
|---|---|
| New or modified endpoint | `docs/api.md`, `README.md` |
| New domain model or behaviour | `docs/architecture.md` |
| New environment variable or config | `README.md`, `docs/runbook.md` |
| Changed build or run process | `README.md`, `docs/runbook.md` |
| Structural/package refactor | `docs/architecture.md` |
| New dependency added | `README.md`, `docs/architecture.md` |

Only update documents that are genuinely affected. Do not touch unrelated sections.

---

## Step 4 — Update each document

### `README.md`
Keep it short and honest. Must always reflect:
- What the project does (one paragraph)
- Prerequisites (Java version, Gradle version)
- How to build and run:
```bash
./gradlew clean build
./gradlew bootRun
./gradlew test
```
- Environment variables required (name, purpose, example value)
- How to run tests

### `docs/api.md`
One section per endpoint. Each section must include:
```
## [METHOD] /path

**Description:** what this endpoint does

**Request body:**
\```json
{
  "field": "type — description",
  "field": "type — description"
}
\```

**Response (`2xx`):**
\```json
{
  "field": "type — description"
}
\```

**Error responses:**
| Status | When |
|--------|------|
| 400    | Validation failed |
| 404    | Resource not found |

**Example:**
\```bash
curl -X POST http://localhost:8080/path \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
\```
```

### `docs/architecture.md`
Describes the current structure — not the target. Include:
- Package layout with one-line description per package
- Layer responsibilities (controller → service → repository → domain)
- Key design decisions and why they were made
- What has been intentionally deferred and when to revisit

### `docs/runbook.md`
Operational reference. Include:
- How to start the application locally
- Required environment variables and where to set them
- How to run specific test suites
- Common failure modes and how to diagnose them

---

## Step 5 — Rules for writing docs

- Write in plain English — no jargon, no filler phrases.
- Describe what the code does now, not what it should do eventually.
- Keep every section as short as it can be while remaining complete.
- Use code blocks for all commands, JSON, and file paths.
- Never copy-paste implementation code into docs — show examples only.
- If a doc file does not exist yet, create it with only what is currently true.
- Do not add placeholder sections for features that do not exist yet.

---

## Step 6 — Verify

Re-read every section you changed and check:
- Does this match what the code actually does right now?
- Can a new developer follow these instructions without asking questions?
- Are all commands accurate and runnable?

---

## Output summary

When done, report:

```
## Docs updated
- [file] — what section was added or changed and why

## Docs not updated
- [file] — reason (not affected by this change)

## Accuracy check
- All commands verified against current build.gradle and source
- All endpoints verified against current controllers
```
