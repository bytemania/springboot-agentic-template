# Task Manager — Developer Tutorials Guide

A practical guide for developers using Claude Code with this Spring Boot 3 + Java 21 + React project.
Follow these tutorials in order the first time, then use the Quick Reference at the bottom for day-to-day work.

---

## Table of Contents

1. [Understanding the Project](#1-understanding-the-project)
2. [Pre-Implementation Discovery Prompts](#2-pre-implementation-discovery-prompts)
3. [Tutorial: End-to-End Feature with /feature-end-to-end](#3-tutorial-end-to-end-feature-with-feature-end-to-end)
4. [Tutorial: Recording Decisions with /record-decision](#4-tutorial-recording-decisions-with-record-decision)
5. [Tutorial: Code Review with /review-code and GitHub MCP](#5-tutorial-code-review-with-review-code-and-github-mcp)
6. [Quick Reference](#6-quick-reference)

---

## 1. Understanding the Project

Before writing a single line of code, spend 10–15 minutes asking Claude Code to orient you. These prompts are safe to run on any branch — they are read-only explorations that produce no side effects.

### Orientation prompts

> Explain this project to me as if I've never seen it before. Start with what it does, then the tech stack, then the main layers, then how to run it.

Reveals the overall purpose, the layered architecture (controller → service → repository → domain), and the commands needed to start the app locally.

---

> What are all the REST endpoints this API exposes? For each one show the HTTP method, path, request body, response body, and status codes.

Produces a complete endpoint inventory — useful before adding a new endpoint to check for collisions or gaps.

---

> Show me the database schema. What tables exist, what are the column types, and what constraints are in place?

Reads the Flyway migrations and existing entity classes to reconstruct the full schema, including primary keys, foreign keys, and nullable/not-null constraints.

---

> What tests exist? Categorise them by type (unit, slice, integration) and tell me what each group tests.

Maps every test class to its category and summarises coverage. Run this before adding a feature so you know what already has coverage and where gaps are.

---

> What observability is in place? List every Micrometer metric, what it measures, and where I can see it.

Finds all `MeterRegistry` usages, lists metric names and their tags, and explains how to view them in Prometheus and Grafana.

---

> What would break if I ran this without Docker?

Identifies which parts of the stack require Docker — integration tests (Testcontainers + PostgreSQL), the full observability stack (Prometheus, Grafana, ELK), and the frontend Nginx proxy — and what the fallback behaviour is.

---

> Explain the .claude/ folder. What does each file do and when does it execute?

Describes every file under `.claude/`: skills, hooks, memory files, settings, and agent definitions. Helps you understand how Claude Code is customised for this project before running any commands.

---

> What known issues or gotchas should I be aware of before making changes?

Scans open TODOs, FIXME comments, deprecation warnings, and any notes in CLAUDE.md or architecture-decisions.md. Read this before starting work on any area you are unfamiliar with.

---

> Walk me through the lifecycle of a single HTTP request from the moment it hits the controller to the moment the response is returned. Use the task creation endpoint as the example.

Shows the exact call chain, where validation happens, which JPA methods are called, and when Micrometer records a metric. Useful for understanding cross-cutting concerns.

---

> What Flyway migrations have run so far? Show me the current schema version and the sequence of changes from the beginning.

Lists every migration file in order, what each one did, and the resulting schema. Establishes a baseline before adding a new migration.

---

## 2. Pre-Implementation Discovery Prompts

Run these prompts **before** starting any new feature. They surface naming conflicts, identify files to read, and reveal risks before any code is written. Replace the bracketed placeholders with your actual feature details.

---

> I want to add [feature]. What existing code will I need to modify? Which files should I read first?

Produces a prioritised reading list — the most impactful files first. Prevents you from discovering a dependency mid-implementation.

---

> What is the highest Flyway migration version? What does the current schema look like?

Returns the next version number you must use and a summary of the current schema state. Always run this before writing a new `.sql` migration file.

---

> Are there any open issues with the current implementation I should know about before adding [feature]?

Checks TODOs, recent commit messages, and any notes in memory files for warnings relevant to the area you are about to change.

---

> What tests cover [area]? Will my change require new tests or will it break existing ones?

Identifies the test classes that exercise the code you are about to change and flags any assertions that will need updating.

---

> Check if there are any naming conflicts between my proposed [entity/endpoint/field] and what already exists.

Searches entity classes, DTOs, controller request mappings, and database column names for collisions with your proposed names.

---

> What Micrometer metrics should I add for [feature]? Follow the existing naming conventions.

Reads the existing `MeterRegistry` usages, infers the naming pattern in use, and suggests metric names and tags that fit the convention.

---

> What would a senior architect say about adding [feature] to this codebase? What are the risks?

Produces an honest risk assessment covering schema changes, backward compatibility, performance implications, and test coverage gaps.

---

> Before I implement [feature], review the CLAUDE.md rules and tell me which conventions I must follow.

Prints the relevant subset of CLAUDE.md rules — database conventions, architecture rules, test strategy — so you have them in front of you before writing code.

---

> If I add [field] to the [entity] entity, what is the minimum set of files I must touch to keep the app compiling and all tests green?

Returns a checklist: entity class, DTO record, Flyway migration, service method, controller, and any affected test fixtures. Use it as a working checklist.

---

> What is the current state of the frontend TypeScript types? Do they match the API response shapes?

Compares the React TypeScript interfaces against the controller response DTOs and flags any mismatches before you add a new field.

---

## 3. Tutorial: End-to-End Feature with /feature-end-to-end

### Feature: Add color support to task tags

In this tutorial you will add an optional `color` field to task tags. Each tag becomes a JSON object `{ name: string, color?: string }` instead of a plain string. You will add two new endpoints and update the frontend `TagBadge` component to display the color as a background when present.

This feature is intentionally small and self-contained — it is the right size to learn the full workflow without being overwhelmed.

---

### 3.1 Setup

Create a dedicated branch before starting. This keeps the feature isolated and makes the GitHub PR code review in Section 5 straightforward.

```bash
git checkout main
git pull
git checkout -b feature/FEAT-2
```

Verify you are on the correct branch:

```bash
git branch --show-current
# Expected output: feature/FEAT-2
```

---

### 3.2 The workflow prompt

Open Claude Code in the project root and paste this exact prompt:

```
/feature-end-to-end "Add color support to task tags. Each tag should have an optional hex color string (e.g. #FF5733). Store tag data as a JSON object {name: string, color?: string} instead of a plain string. Add POST /tasks/{id}/tags with body {name, color} and DELETE /tasks/{id}/tags/{name}. Update the frontend TagBadge component to display the color as a background when present."
```

Do not add anything else. The workflow prompt is self-contained. Claude will ask for clarification only if the specification is genuinely ambiguous.

---

### 3.3 What happens in each phase

The `/feature-end-to-end` skill runs 11 sequential phases. Each phase is performed by a specialist agent. Here is what to expect at each stage.

#### Phase 1 — Analyse

**What happens:** The architect agent reads CLAUDE.md, the current entity classes, existing migrations, and the frontend TypeScript types. It maps every file that will be affected.

**Expected output:** A bullet list of affected files grouped by layer (domain, migration, service, controller, dto, frontend).

**What could go wrong:** If Claude reports that tags are already stored as JSON objects, the feature may already be partially implemented. Run `git log --oneline` and check the existing `Tag` entity or `tags` column before proceeding.

---

#### Phase 2 — Architect

**What happens:** The `java-architect` agent designs the data model. For this feature it will decide whether to use a `@ElementCollection` of embeddable objects, a separate `Tag` entity, or a JSONB column. It will also design the two new endpoint contracts.

**Expected output:** A short architecture note describing the chosen approach and the reason, plus the proposed request/response shapes in JSON.

**What could go wrong:** The architect may propose a more complex solution (e.g. a full `tags` table with a foreign key) when a simpler embedded approach is sufficient. If you prefer simpler, say: "Use `@ElementCollection` with an `@Embeddable` Tag class for now. We can promote it to a full entity later if needed."

---

#### Phase 3 — Plan

**What happens:** A detailed implementation plan is written as a numbered checklist. This is the contract that all subsequent phases follow.

**Expected output:** A numbered list of tasks, each tied to a specific file. Example:
1. Create `Tag.java` embeddable with `name` and `color` fields
2. Update `Task.java` to replace `Set<String> tags` with `Set<Tag> tags`
3. Write migration `V2__add_tag_color.sql`
4. Update `TaskService.addTag` and `TaskService.removeTag`
5. Add `AddTagRequest` and `TagResponse` DTOs
6. Add `POST /tasks/{id}/tags` and `DELETE /tasks/{id}/tags/{name}` to `TaskController`
7. Update frontend `Tag` type and `TagBadge` component

**What could go wrong:** If the plan lists more than 15 files, the scope may have expanded beyond the original request. Review the plan and ask Claude to scope it back if needed.

---

#### Phase 4 — Migrate

**What happens:** The `database-engineer` agent writes the Flyway SQL migration. It reads the current highest version number first.

**Expected output:** A new file at `src/main/resources/db/migration/V{N}__add_tag_color.sql`. For example:

```sql
-- V2__add_tag_color.sql
ALTER TABLE task_tags ADD COLUMN color VARCHAR(7);
```

**What could go wrong:** If Flyway has already run migrations in your local H2 database, you may see a checksum mismatch error on the next `./gradlew bootRun`. Fix it by running `./gradlew flywayClean flywayMigrate` in your dev environment. Never run `flywayClean` against a production database.

---

#### Phase 5 — Implement

**What happens:** The `spring-boot-engineer` agent writes all the Java code according to the plan from Phase 3.

**Expected output:** New and modified `.java` files. You can watch them appear in the file tree. Claude will run `./gradlew compileJava` at the end of this phase to verify the code compiles.

**What could go wrong:**
- Compilation failure due to a missing import. Claude will usually self-correct. If it loops more than twice, ask: "Stop and show me the exact compiler error."
- The agent may introduce Lombok annotations. Per CLAUDE.md, Lombok is not allowed. If you see `@Data`, `@Builder`, or `@Getter`, say: "Remove Lombok. Use explicit constructors, getters, and records as appropriate."

---

#### Phase 6 — Test

**What happens:** The `testing-engineer` agent writes unit tests (with Mockito where needed), a `@WebMvcTest` slice test for the new endpoints, and an `@SpringBootTest` integration test using Testcontainers.

**Expected output:** New test files under `src/test/java/`. The agent will run `./gradlew test` and `./gradlew integrationTest` (requires Docker) and report results.

**What could go wrong:**
- If Docker is not running, the integration test phase will fail. Start Docker and re-run: `./gradlew integrationTest`.
- A test may fail because the H2 dialect does not support a PostgreSQL-specific column type used in the migration (e.g. `JSONB`). Fix by using `VARCHAR` in the migration and converting at the service layer, or by adding an H2-compatible migration override under `src/test/resources/db/migration/`.

---

#### Phase 7 — Security

**What happens:** The `security-reviewer` agent audits the new code for injection vulnerabilities, missing input validation, and insecure data storage.

**Expected output:** A short security report. For this feature, expect at least one finding about the `color` field not being validated as a proper hex string.

**What could go wrong:** The agent may flag the color field as an XSS risk if it is rendered as a raw CSS `background-color` in the frontend without sanitisation. This is a valid MAJOR finding — add a `@Pattern(regexp = "^#[0-9A-Fa-f]{6}$")` constraint to the `AddTagRequest` DTO.

---

#### Phase 8 — Observability

**What happens:** The `observability-engineer` agent adds Micrometer metrics for the new endpoints and any domain events (tag added, tag removed).

**Expected output:** New `Counter` or `Timer` registrations in the service class. Metric names will follow the existing convention (e.g. `tasks.tags.added`, `tasks.tags.removed`).

**What could go wrong:** If the agent adds metrics with names that conflict with existing ones, `./gradlew bootRun` will throw a `MeterAlreadyExistsException`. Rename the conflicting metric.

---

#### Phase 9 — Review

**What happens:** The `github-reviewer` agent performs a final internal review of all changes produced in Phases 4–8 against the CLAUDE.md conventions checklist.

**Expected output:** A review report with BLOCKER, MAJOR, MINOR, and NIT findings. Any BLOCKER findings will be fixed automatically before the workflow continues. MAJOR findings are presented for your decision.

**What could go wrong:** If the review finds a BLOCKER (e.g. missing validation), the workflow will pause and ask you to confirm the fix before continuing. Review the proposed fix and confirm or redirect.

---

#### Phase 10 — Ship

**What happens:** The agent runs the full test suite one final time, then creates a git commit with a conventional commit message.

**Expected output:**

```
feat(tags): add optional hex color field to task tags

- Add Tag embeddable with name and color fields
- Add POST /tasks/{id}/tags and DELETE /tasks/{id}/tags/{name}
- Add hex color validation via @Pattern constraint
- Add tasks.tags.added and tasks.tags.removed Micrometer counters
- Add TagBadge color rendering in frontend
```

**What could go wrong:** If the pre-commit hook (if configured) runs linting and fails, the commit will not be created. Fix the lint errors reported and re-run `/feature-end-to-end` from Phase 10, or commit manually with `git commit`.

---

#### Phase 11 — Frontend

**What happens:** The `frontend-engineer` agent updates the React TypeScript types and the `TagBadge` component.

**Expected output:**
- `frontend/src/types/tag.ts` — updated `Tag` type from `string` to `{ name: string; color?: string }`
- `frontend/src/components/TagBadge.tsx` — updated to apply `backgroundColor: tag.color` when color is present

**What could go wrong:** If the frontend uses `npm run build` as a check and it fails due to TypeScript errors, Claude will usually fix them. If the loop continues, ask: "Show me the exact TypeScript compiler error and the line it refers to."

---

### 3.4 Expected outputs

By the end of the workflow, the following files will have been created or modified:

| File | Change |
|---|---|
| `src/main/java/.../domain/Tag.java` | New `@Embeddable` class |
| `src/main/java/.../domain/Task.java` | `tags` field changed from `Set<String>` to `Set<Tag>` |
| `src/main/java/.../dto/AddTagRequest.java` | New record with `name` and `color` fields |
| `src/main/java/.../dto/TagResponse.java` | New record |
| `src/main/java/.../service/TaskService.java` | Updated `addTag` and `removeTag` methods |
| `src/main/java/.../controller/TaskController.java` | New `POST` and `DELETE` tag endpoints |
| `src/main/resources/db/migration/V{N}__add_tag_color.sql` | New migration |
| `src/test/java/.../controller/TaskControllerTest.java` | New slice tests for tag endpoints |
| `src/test/java/.../service/TaskServiceTest.java` | Updated unit tests |
| `src/test/java/.../integration/TaskIntegrationTest.java` | New integration test for tag color flow |
| `frontend/src/types/tag.ts` | Updated `Tag` type |
| `frontend/src/components/TagBadge.tsx` | Color rendering logic |

---

### 3.5 Smoke test

After the workflow completes and the app is running (`./gradlew bootRun`), verify the feature works end to end:

```bash
# 1. Create a task
TASK_ID=$(curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task","priority":"HIGH"}' | jq -r .id)

echo "Created task ID: $TASK_ID"

# 2. Add a colored tag
curl -s -X POST "http://localhost:8080/tasks/${TASK_ID}/tags" \
  -H "Content-Type: application/json" \
  -d '{"name":"urgent","color":"#FF5733"}' | jq .

# Expected response:
# {
#   "name": "urgent",
#   "color": "#FF5733"
# }

# 3. Verify the tag has a color on the task
curl -s "http://localhost:8080/tasks/${TASK_ID}" | jq .tags

# Expected response:
# [
#   {
#     "name": "urgent",
#     "color": "#FF5733"
#   }
# ]

# 4. Verify validation rejects an invalid color
curl -s -X POST "http://localhost:8080/tasks/${TASK_ID}/tags" \
  -H "Content-Type: application/json" \
  -d '{"name":"bad","color":"not-a-color"}' | jq .status

# Expected response: 400

# 5. Delete the tag
curl -s -X DELETE "http://localhost:8080/tasks/${TASK_ID}/tags/urgent" -w "%{http_code}"

# Expected response: 204
```

---

## 4. Tutorial: Recording Decisions with /record-decision

Architectural decisions are the most expensive things to change later. The `/record-decision` command captures them in a queryable, durable format inside `.claude/memory/` so that future Claude sessions — and future team members — know not just what was decided but why.

### 4.1 When to use it

Use `/record-decision` after any of the following events:

- You finish a `/feature-end-to-end` workflow and the architect chose one approach over another (e.g. embedded tags vs. a separate table)
- A production incident reveals a design weakness and the team agrees on a fix
- A code review raises a convention question and the team decides on a standard
- A team discussion produces a tradeoff decision that is not obvious from the code alone
- You reject a library or approach that future engineers might consider — record why

The goal is to prevent the same discussion from happening twice.

---

### 4.2 Example session

After the color-tag feature, suppose the team decides to store tags as a JSONB column on the `tasks` table rather than a separate `task_tags` join table. Here is the full `/record-decision` session.

#### Step 1 — Invoke the command

```
/record-decision
```

#### Step 2 — Claude asks clarifying questions

Claude will respond with something like:

```
I'll record this architectural decision. Please answer the following so I can write a complete entry:

1. What is the decision in one sentence?
2. What alternatives did you consider?
3. Why did you choose this approach over the alternatives?
4. Which files or areas of the codebase does this decision affect?
5. Are there any known downsides or future migration paths to be aware of?
6. What category is this? (data-model / api-design / infrastructure / security / testing / other)
```

#### Step 3 — Provide your answers

Reply with:

```
1. Store tags as a JSONB column on the tasks table instead of a separate task_tags join table.
2. Alternatives considered: (a) @ElementCollection with a join table, (b) a full Tag entity with a foreign key, (c) a plain VARCHAR array column.
3. JSONB avoids a join on every task read, supports flexible tag structure (name + color + future fields), and PostgreSQL has mature JSONB indexing (GIN indexes) for tag-based queries. The tag list is short (< 20 per task) and always read alongside the task — there is no use case for querying tags independently.
4. Affects: Task entity, Flyway migration, TaskRepository (any JPQL queries over tags), TaskService (serialisation logic).
5. Downside: JPQL cannot query inside JSONB without native queries or a custom Hibernate type. If we ever need complex tag queries, we will revisit. Migration path: extract to a Tag table via a Flyway migration that reads the JSONB and inserts rows.
6. data-model
```

#### Step 4 — Claude writes the architecture-decisions.md entry

Claude creates or appends to `.claude/memory/architecture-decisions.md`:

```markdown
## ADR-002 — Store tags as JSONB column on tasks table

**Date:** 2026-06-10
**Status:** Accepted
**Category:** data-model
**Affects:** Task.java, V{N}__tags_jsonb.sql, TaskRepository.java, TaskService.java

### Decision

Tags are stored as a JSONB column (`tags`) on the `tasks` table rather than a separate `task_tags` join table or a full `Tag` entity.

### Context

Tags have a variable structure (name + optional color, with potential future fields). They are always read alongside the task and are never queried independently. The task list is the primary read path and must be fast.

### Alternatives considered

| Option | Rejected because |
|---|---|
| `@ElementCollection` join table | Adds a JOIN to every task read; no benefit for our query patterns |
| Full `Tag` entity with FK | Overkill; tag data is not an independent aggregate |
| Plain `VARCHAR[]` array | Cannot store structured data; no path to add color or other fields |

### Rationale

- Avoids a JOIN on every task read
- JSONB supports flexible tag structure without schema changes for new fields
- PostgreSQL GIN indexes on JSONB provide tag-based query support if needed later
- Tag lists are short (< 20 per task) — there is no performance concern with document storage

### Known downsides

- JPQL cannot query inside JSONB without native queries or a custom Hibernate type descriptor
- If complex tag queries are needed (e.g. "find all tasks with tag X"), a native query or schema change will be required

### Migration path

If the tag model needs to become a first-class entity: write a Flyway migration that reads the JSONB column and inserts rows into a new `tags` table, then drop the JSONB column.
```

#### Step 5 — Claude updates MEMORY.md

Claude appends a one-line summary to `.claude/memory/MEMORY.md`:

```markdown
- [2026-06-10] ADR-002: Tags stored as JSONB on tasks table (not a join table). See architecture-decisions.md.
```

#### Step 6 — Claude updates CLAUDE.md

Claude adds a rule to the database conventions section of `CLAUDE.md`:

```markdown
- Tags are stored as a JSONB column on the `tasks` table. Do not introduce a separate tags table without first updating ADR-002 in architecture-decisions.md.
```

---

### 4.3 Verifying the decision was recorded

```bash
grep -A 8 "JSONB" .claude/memory/architecture-decisions.md
```

Expected output — the first 8 lines of the ADR entry containing "JSONB".

To list all decisions recorded so far:

```bash
grep "^## ADR" .claude/memory/architecture-decisions.md
```

---

## 5. Tutorial: Code Review with /review-code and GitHub MCP

The `/review-code` command runs the `github-reviewer` agent against the current branch diff and posts inline comments directly to the open GitHub pull request. This gives you a code review that follows your project conventions before you ask a human reviewer.

### 5.1 Prerequisites

Before running the review, verify the following:

1. **A PR exists on GitHub for the current branch.** If not, push and create one:

```bash
git push -u origin feature/FEAT-2
gh pr create --title "feat(tags): add optional hex color field to task tags" \
  --body "Adds color support to task tags per FEAT-2 requirements."
```

2. **A valid `GITHUB_TOKEN` is set.** The token must have `repo` scope (read + write on pull requests):

```bash
echo $GITHUB_TOKEN
# Must not be empty. If it is, export it:
export GITHUB_TOKEN=ghp_your_token_here
```

3. **Docker is running.** The GitHub MCP server runs in a Docker container:

```bash
docker info > /dev/null 2>&1 && echo "Docker is running" || echo "Start Docker first"
```

---

### 5.2 Running the review

```bash
# Confirm you are on the feature branch
git checkout feature/FEAT-2
git status
# Should show: On branch feature/FEAT-2, nothing to commit

# Run the review
/review-code
```

No additional arguments are needed. The command reads the current branch, finds the open PR, and runs the full review pipeline.

---

### 5.3 What happens

The command executes the following steps in order:

1. **Reads CLAUDE.md** — loads the project conventions checklist: architecture rules, database conventions, test requirements, and naming standards.

2. **Calls `list_pull_requests`** via GitHub MCP — finds the open PR for the current branch. If more than one open PR exists, Claude will ask you to confirm which one to review.

3. **Calls `get_pull_request` and `list_pull_request_files`** — retrieves the PR title, description, changed file list, and per-file change counts.

4. **Gets the full diff** — calls `get_pull_request_diff` (or equivalent) to retrieve the complete unified diff for the PR.

5. **Passes to `github-reviewer` agent** — the agent reads the diff against the CLAUDE.md checklist and produces structured findings in four severity levels: BLOCKER, MAJOR, MINOR, and NIT.

6. **Posts the review via `create_pull_request_review`** — submits the review summary as a PR review comment (appears in the GitHub Conversation tab).

7. **Posts inline comments for BLOCKER and MAJOR findings** — for each high-severity finding, posts an inline comment on the exact file and line number using `create_pull_request_review_comment`.

---

### 5.4 Reading the output

Findings are categorised by severity. Act on them in this order:

| Severity | Meaning | Action required |
|---|---|---|
| BLOCKER | Will cause a bug, security vulnerability, or data loss | Fix before merging. The PR should not be merged until all BLOCKERs are resolved. |
| MAJOR | Violates a project convention or introduces a significant risk | Fix before requesting human review. These will be flagged by reviewers anyway. |
| MINOR | Suboptimal but not harmful | Fix if time allows or leave with a comment explaining the tradeoff. |
| NIT | Style or naming preference | Fix if it takes less than 2 minutes; otherwise leave. |

**Example BLOCKER finding:**

```
### BLOCKER — Tag color not validated
File: src/main/java/com/example/taskmanager/dto/AddTagRequest.java:8
Problem: The color field accepts any string. A value like "javascript:alert(1)"
would be stored and potentially rendered as a raw CSS value in the frontend,
creating an XSS vector.
Fix:
  @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "color must be a valid hex color e.g. #FF5733")
  String color
```

**Example MAJOR finding:**

```
### MAJOR — Missing test for invalid color input
File: src/test/java/com/example/taskmanager/controller/TaskControllerTest.java
Problem: There is no test asserting that POST /tasks/{id}/tags returns 400
when an invalid color string is provided. The validation annotation is present
but untested.
Fix: Add a @Test method that posts color "not-a-color" and asserts status 400.
```

**Example MINOR finding:**

```
### MINOR — TagResponse could be a record
File: src/main/java/com/example/taskmanager/dto/TagResponse.java
Problem: TagResponse is a class with a constructor and getters. CLAUDE.md
specifies "records for simple DTOs".
Fix: Convert to a record: public record TagResponse(String name, String color) {}
```

---

### 5.5 Responding to the review

Fix the findings in severity order. After fixing each BLOCKER or MAJOR:

```bash
# Stage and commit the fix
git add src/main/java/com/example/taskmanager/dto/AddTagRequest.java
git commit -m "fix(tags): add hex color validation to AddTagRequest"

# Re-run the review to confirm the finding is resolved
/review-code
```

The second run will post a new review to the PR. If the finding was resolved, it will not appear in the new review. GitHub will show both review rounds in the PR timeline — this is a useful audit trail.

---

### 5.6 Skipping GitHub posting (local-only review)

If you are on a local-only branch with no GitHub PR, or you want a quick review without posting comments:

```bash
# Copy the diff to clipboard (macOS)
git diff main...HEAD | pbcopy

# Then paste into Claude Code and ask:
```

> Review this diff using the github-reviewer checklist from CLAUDE.md. Report findings by severity: BLOCKER, MAJOR, MINOR, NIT. Do not post to GitHub.

This produces the same structured output in the terminal without requiring a GitHub token or open PR.

---

## 6. Quick Reference

| Command | What it does | When to use it |
|---|---|---|
| `/feature-end-to-end "<spec>"` | Runs 11 phases: Analyse → Architect → Plan → Migrate → Implement → Test → Security → Observability → Review → Ship → Frontend | Starting any new feature from scratch |
| `/record-decision` | Captures an architectural decision in `.claude/memory/architecture-decisions.md` | After any design decision, team tradeoff, or rejected approach |
| `/review-code` | Runs the `github-reviewer` agent and posts inline PR comments to GitHub | Before requesting human review on any PR |
| `/review-code` (no PR) | Paste diff manually and ask for a review without GitHub posting | Local branches or quick pre-commit checks |
| `/create-endpoint` | Add a single new REST endpoint (controller + service + repo + tests) | When you need one endpoint without a full feature workflow |
| `/docker-development` | Manage the full Docker Compose and Minikube stack | Starting/stopping observability stack, rebuilding images, checking logs |
| `./gradlew test` | Run unit and slice tests (no Docker required) | Fast feedback loop during development |
| `./gradlew integrationTest` | Run `@SpringBootTest` integration tests with Testcontainers (requires Docker) | Before committing or opening a PR |
| `./gradlew flywayMigrate` | Apply pending Flyway migrations to the local dev database | After pulling a branch that adds a new migration |
| `./gradlew flywayClean flywayMigrate` | Drop and recreate the local schema from scratch | When local H2 schema is in an inconsistent state |
| `git diff main...HEAD \| pbcopy` | Copy the current branch diff to clipboard | Before pasting into Claude for a manual review |

---

*Document maintained by the Task Manager team. Update this file via `/record-decision` whenever a convention changes.*
