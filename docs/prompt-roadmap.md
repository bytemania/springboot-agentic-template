# Task Manager — Prompt Roadmap

This document is an ordered sequence of prompts you type directly into Claude Code. Run them in order the first time, starting from Phase 0. Each prompt has a purpose label, the exact text to paste (as a blockquote or code block — copy it verbatim), and a one-line description of what to expect as output. No setup beyond a working Claude Code session is needed. The prompts are self-contained: each one builds on the context established by the ones before it, so do not skip steps.

---

## Phase 0 — Orient (run before anything else)

These prompts build your mental model before you touch any code. Run all of them in a fresh Claude Code session before opening any files yourself. The goal is to let Claude map the codebase for you so you can make informed decisions from the start.

### 0.1 — Explain the project

**Purpose:** Get a full picture of what the project does, its tech stack, and how the layers connect.

> Explain this project to me as if I've never seen it before. Cover: what it does, the tech stack, the main architectural layers (controller → service → repository → domain → dto), how data flows through a request, how to run it locally, and what would break if Docker wasn't installed.

**Expected output:** A structured overview covering all layers, the run options (local vs Docker Compose vs Minikube), and a note about what requires Docker.

---

### 0.2 — Explore the API contract

**Purpose:** Understand every endpoint before writing anything.

> List every REST endpoint this API exposes. For each one show: HTTP method, path, request body fields and types, response body fields and types, HTTP status codes returned, and which service method handles it.

**Expected output:** A table or numbered list of all endpoints with full request/response detail.

---

### 0.3 — Explore the database schema

**Purpose:** Understand what is in the database before adding anything.

> Show me the full database schema. List every table, every column with its type and constraints, every index, and the current highest Flyway migration version. Then tell me what would need to change in the schema if I wanted to add a labels feature to tasks.

**Expected output:** Schema dump from Flyway migrations plus a short analysis of the labels feature impact.

---

### 0.4 — Understand the .claude configuration

**Purpose:** Know what automation is available before starting work.

> Explain the .claude/ folder in this project. For each file and folder, tell me: what it is, when it runs or is loaded, and give me a one-line example of when I'd use it. Include agents, commands, skills, workflows, memory files, settings.json hooks, and the MCP server.

**Expected output:** A walkthrough of every .claude/ file with practical usage examples.

---

### 0.5 — Surface known issues

**Purpose:** Know what is broken or risky before you start.

> Read the project memory files in .claude/memory/. Summarise: known bugs or gotchas I should watch out for, architectural decisions already made that I must not reverse, infrastructure quirks (ports, Docker memory, etc.), and any conventions I must follow when writing Java or committing code.

**Expected output:** A summary of all memory files with the most critical items highlighted.

---

## Phase 1 — Setup

These prompts set up your working environment and initial branch. Run them after Phase 0 and before touching any source files.

### 1.1 — Verify the environment

**Purpose:** Confirm everything needed to run the project is installed.

> Check my local environment. Verify: Java 21 is installed and JAVA_HOME is set, Docker Desktop is running, Node 20+ is installed, Gradle wrapper works. Run ./gradlew --version, java --version, docker info, node --version. Report any missing tools with install instructions.

**Expected output:** A health check report with a clear pass/fail status per tool.

---

### 1.2 — Run the test suite

**Purpose:** Confirm the baseline is green before making any changes.

> Run the full test suite. First run ./gradlew test (unit + slice tests, no Docker needed). Then run ./gradlew integrationTest (requires Docker). Report: total tests run, passed, failed, skipped. If anything fails, show me the stack trace and suggest a fix.

**Expected output:** Test results with counts. All tests should be green on a clean checkout.

---

### 1.3 — Create the initial feature branch

**Purpose:** Never work on main.

> Create a new branch called feature/FEAT-1 from main. Confirm it was created and that I'm on it. Show me the current git status.

**Expected output:** Branch created confirmation and a clean git status output.

---

## Phase 2 — Implement the full project using the workflow

> **Current state (as of 2026-06-10):** `main` has the base scaffold only — one Flyway migration, the `Task` entity, basic CRUD endpoints, and a minimal React frontend. `feature/FEAT-1` contains a complete production implementation (all enums, PUT/PATCH status endpoints, TaskDetailPanel, full Grafana dashboard, Micrometer metrics) but has not yet been merged to main. Start by merging FEAT-1, then continue from there.

### 2.0 — Merge the existing feature branch (FEAT-1)

**Purpose:** Get the already-completed production implementation onto main before starting new work.

> I'm on main. The branch feature/FEAT-1 has a complete production Task Manager implementation (all CRUD endpoints, CANCELLED/URGENT enums, PUT /tasks/{id}, PATCH /tasks/{id}/status, TaskDetailPanel, Grafana dashboard, Micrometer metrics). Merge it into main now: checkout feature/FEAT-1, run the full test suite to confirm it's green, then merge to main. Show me the test results and confirm the merge succeeded.

**Expected output:** Green test suite output followed by merge confirmation on main.

---

### 2.1 — Run the end-to-end workflow for production hardening

**Purpose:** With FEAT-1 merged, use the workflow to harden the implementation — fill any remaining gaps in tests, security, observability, and frontend — and produce a production-grade, fully reviewed result.

**Prerequisite:** You must be on a feature branch, not main. Run step 1.3 first if you haven't.

```
/feature-end-to-end "Harden the existing Task Manager for production. The base implementation exists with these endpoints: POST /tasks, GET /tasks (with ?status and ?priority filters), GET /tasks/{id}, PATCH /tasks/{id} (partial update), PUT /tasks/{id} (full replace, resets status to TODO), PATCH /tasks/{id}/status, DELETE /tasks/{id}, POST /tasks/{id}/tags, DELETE /tasks/{id}/tags/{tag}. TaskStatus values: TODO, IN_PROGRESS, DONE, CANCELLED. TaskPriority values: LOW, MEDIUM, HIGH, URGENT. Current gaps to close: (1) replaceTask does not clear tags on PUT — fix it to set tags to empty set; (2) deleteTask has no @Transactional — fix it; (3) getTaskById and getAllTasks are missing @Transactional(readOnly=true) — add them; (4) CreateTaskModal priority dropdown is missing URGENT option — add it; (5) add @Transactional(readOnly=true) to all read-only service methods; (6) ensure every service method has a unit test for happy path, not-found, and invalid input; (7) ensure every controller endpoint has a @WebMvcTest slice test. Flyway highest migration version is V1. Do not add new endpoints or new entities — fix and harden what exists."
```

**What to expect — all 11 phases:**

| Phase | What happens |
|---|---|
| Analyse | Reads CLAUDE.md, memory files, all Java files, current migration version. Produces a structured gap list. |
| Architect | `java-architect` agent reviews the gap list against architecture rules. Blocks if any fix would violate layering. |
| Plan | Produces a line-by-line fix plan: which files change, which methods to add `@Transactional` to, which tests to write. |
| Migrate | No new migration needed for these fixes. Phase completes immediately. |
| Implement | `spring-boot-engineer` applies all fixes in dependency order: domain → service → controller. |
| Test | `testing-engineer` writes missing unit and slice tests. Runs `./gradlew test` and fixes failures. |
| Security | `security-reviewer` checks the diff for OWASP issues. Auto-fixes any critical findings. |
| Observability | `observability-engineer` verifies all service methods have Micrometer counters or timers. Adds any missing ones. |
| Review | `github-reviewer` reviews the full diff using the Spring Boot checklist. Auto-fixes any blockers. |
| Ship | Runs `./gradlew build` and `./gradlew integrationTest` in parallel. Both must pass. |
| Frontend | `react-engineer` adds the missing URGENT option to CreateTaskModal. Runs `npm run build`. |

The workflow self-heals: if security or review finds a blocker, a `spring-boot-engineer` agent fixes it before moving on.

---

### 2.2 — Smoke test after the workflow

**Purpose:** Confirm everything works end-to-end after the workflow completes.

> The hardening workflow just completed. Smoke test the full API: start ./gradlew bootRun in the background, then run these operations in order: (1) create a task with priority URGENT, (2) get all tasks, (3) get the task by ID, (4) update status to IN_PROGRESS via PATCH /tasks/{id}/status, (5) do a full replace with PUT /tasks/{id} and confirm status resets to TODO and tags are empty, (6) add a tag called "backend", (7) delete the tag, (8) delete the task and confirm 204. Show the curl command and response for each step. Stop the app when done.

**Expected output:** Eight curl responses showing HTTP 200/201/204 for each step, with the PUT confirming tags=[] and status=TODO.

---

## Phase 3 — Full code review

Before committing or creating a PR, run a thorough review across all dimensions. These prompts catch issues that automated tests do not: architecture violations, security gaps, and instrumentation blind spots.

### 3.1 — Architecture review

**Purpose:** Check that the implementation follows the layered architecture rules in CLAUDE.md.

> Review the current implementation against the architecture rules in CLAUDE.md. Check: is the controller → service → repository boundary respected everywhere? Are all DTOs records? Is there any business logic in controllers? Are @Transactional annotations on the service layer only? Are there any Lombok annotations? Report findings with file:line for each violation.

**Expected output:** An architecture compliance report listing any violations by file and line number.

---

### 3.2 — Security review

**Purpose:** Catch OWASP Top 10 issues before the PR is opened.

```
/review-security
```

**Expected output:** OWASP findings grouped into three buckets: Critical, High, and Medium/Low.

---

### 3.3 — Observability review

**Purpose:** Confirm every service method is instrumented with Micrometer metrics.

```
/review-observability
```

**Expected output:** A list of instrumented methods and any gaps where metrics are missing.

---

### 3.4 — Full GitHub PR code review

**Purpose:** Post a formal review to the PR on GitHub with inline comments so findings are traceable.

**Step 1 — Push the branch and create a PR:**

> Push the current branch to GitHub and create a pull request with title "feat(FEAT-1): production Task Manager implementation" and a description summarising all changes made by the workflow.

**Expected output:** A GitHub PR URL.

**Step 2 — Run the review:**

```
/review-code
```

**Expected output:** A review posted to GitHub with inline comments for any BLOCKER or MAJOR findings.

---

## Phase 4 — Add a new feature: Labels for tasks

Labels are a new concept — a task can have multiple labels, each with a name and an optional hex color. Unlike tags (plain strings stored inline), labels are first-class entities with their own table and can be reused across tasks. Run these prompts on a fresh branch from main.

### 4.1 — Pre-implementation discovery

**Purpose:** Scope the feature before writing a single line of code.

> I want to add a Labels feature. A label has a name (string, max 50 chars) and an optional color (hex string, e.g. #FF5733). Tasks can have many labels. Labels are reusable across tasks. Before I implement this: what is the highest Flyway migration version currently? What existing code will I need to modify? Are there any naming conflicts with existing code? What endpoints should I add? What tests will I need? What Micrometer metrics should I add?

**Expected output:** A scoping analysis covering the current migration version, affected files, proposed endpoints, and a test plan.

---

### 4.2 — Create the feature branch

**Purpose:** Isolate the labels feature from the FEAT-1 work.

> Create a new branch called feature/FEAT-2 from main. Confirm it was created and show git status.

**Expected output:** Branch creation confirmation and a clean git status.

---

### 4.3 — Run the end-to-end workflow for labels

**Purpose:** Deliver the full labels feature — entity, migration, service, controller, tests, and frontend — in one automated workflow.

```
/feature-end-to-end "Add a Labels feature to tasks. A Label entity has: id (Long, auto-generated), name (String, max 50 chars, not blank), color (String, optional, must match regex #[0-9A-Fa-f]{6} if present), createdAt (LocalDateTime). Tasks have a many-to-many relationship with labels via a task_labels join table. Endpoints: POST /labels (create label), GET /labels (list all labels), POST /tasks/{id}/labels/{labelId} (attach label to task), DELETE /tasks/{id}/labels/{labelId} (detach label from task), GET /tasks/{id}/labels (list labels on a task). The React frontend should show label badges on task cards with the label color as background, and allow attaching/detaching labels from the task detail panel."
```

**Expected output:** All 11 workflow phases complete with a green test suite, new Flyway migration created, and the React frontend updated with label badges.

---

### 4.4 — Smoke test the labels feature

**Purpose:** Manually verify the new endpoints end-to-end before review.

> Smoke test the labels feature. Start the app with ./gradlew bootRun, then: create a label called "bug" with color #FF0000, create a label called "feature" with no color, create a task, attach the "bug" label to it, list the task's labels, detach the label, confirm it's gone. Show the curl commands and responses. Then stop the app.

**Expected output:** Six curl responses confirming the full attach/detach lifecycle works correctly.

---

## Phase 5 — Review the labels feature

### 5.1 — Record the design decision

**Purpose:** Capture in project memory why labels were implemented as a separate entity rather than embedded strings like tags.

```
/record-decision
```

When Claude asks for details, provide the following answers:
- **Decision:** Labels are a separate @Entity with their own table, not stored as strings like tags
- **Why:** Labels are reusable across tasks and have structured data (name + color). A separate table allows querying all labels, managing them independently, and adding metadata later such as description or owner.
- **Affects:** Label.java, TaskLabel join, LabelRepository, LabelService, LabelController, V3 migration
- **Type:** Architectural decision

**Expected output:** A new decision record saved to .claude/memory/ with the provided details.

---

### 5.2 — Security review of the labels feature

**Purpose:** Check the new endpoints for injection, missing validation, and access control gaps.

```
/review-security
```

**Expected output:** OWASP findings scoped to the new label endpoints.

---

### 5.3 — Full PR code review for labels

**Purpose:** Open the PR and post inline review comments before merging.

> Push the feature/FEAT-2 branch to GitHub and create a pull request with title "feat(FEAT-2): add Labels feature with color support". Then run /review-code to post a full review with inline GitHub comments.

**Expected output:** A GitHub PR URL and a review with inline comments for any BLOCKER or MAJOR findings.

---

## Phase 6 — Comprehensive platform audit

Before merging anything to main, run a full cross-cutting audit. These prompts treat the entire codebase as the subject, not just the latest diff. Run them after all feature branches have been reviewed and you are preparing the final merge.

### 6.1 — Architecture audit

**Purpose:** Catch any layering drift, missing transactions, or structural violations across the whole project.

> Perform a comprehensive architecture audit of the entire codebase. Check every Java file against the rules in CLAUDE.md. Report violations grouped by category: layering violations, missing @Transactional, Lombok usage, field injection, DTOs that are not records, service methods missing Micrometer instrumentation, endpoints returning entity objects directly. Give me a prioritised fix list.

**Expected output:** An architecture compliance report grouped by violation category with a prioritised fix list.

---

### 6.2 — Security audit

**Purpose:** Verify OWASP Top 10 coverage across every endpoint before any code reaches main.

> Perform a full OWASP Top 10 security audit of this Spring Boot API. Check every endpoint for: missing @Valid, path variable injection, SQL injection risk, sensitive data in error responses, actuator exposure, CORS misconfiguration, JWT/auth gaps, PII in logs. For each finding state the severity (CRITICAL/HIGH/MEDIUM/LOW), the file and line number, and the exact fix.

**Expected output:** A severity-ordered security findings list with file, line, and fix for each item.

---

### 6.3 — Test coverage audit

**Purpose:** Find the most dangerous gaps in the test suite before merging.

> Audit the test coverage of this project. For every service method, check if a unit test exists for: happy path, not-found case, and invalid input. For every controller endpoint, check if a @WebMvcTest slice test exists. For every major business flow, check if a Testcontainers integration test exists. Give me a gap list ordered by risk — which missing tests are most dangerous?

**Expected output:** A risk-ordered list of missing tests, grouped by service method, controller endpoint, and integration flow.

---

### 6.4 — Observability audit

**Purpose:** Confirm instrumentation completeness across the entire codebase, not just the latest feature.

```
/review-observability
```

**Expected output:** Full instrumentation coverage report with gaps identified by service and method.

---

### 6.5 — Memory and decisions check

**Purpose:** Ensure no known issues remain unfixed before merging to main.

> Read all files in .claude/memory/. Are there any known issues listed as "not yet fixed"? For each one, tell me: what the issue is, what file it's in, and give me the exact code fix I should apply before merging to main.

**Expected output:** A list of any unresolved issues from memory files with ready-to-apply code fixes.

---

## Quick Reference

| Phase | What to type | Purpose |
|---|---|---|
| 0.1 Orient | Natural language prompt | Understand the project end-to-end |
| 0.2 Orient | Natural language prompt | Explore the full API contract |
| 0.3 Orient | Natural language prompt | Explore the database schema |
| 0.4 Orient | Natural language prompt | Understand the .claude/ configuration |
| 0.5 Orient | Natural language prompt | Surface known issues and memory |
| 1.1 Setup | Natural language prompt | Verify the local environment |
| 1.2 Setup | Natural language prompt | Run the full test suite |
| 1.3 Setup | Natural language prompt | Create the feature/FEAT-1 branch |
| 2.0 Implement | Natural language prompt | Merge feature/FEAT-1 into main |
| 2.1 Implement | `/feature-end-to-end "..."` | Harden implementation — fix known gaps, missing tests, @Transactional |
| 2.2 Implement | Natural language prompt | Smoke test all endpoints |
| 3.1 Review | Natural language prompt | Architecture compliance check |
| 3.2 Review | `/review-security` | Security review |
| 3.3 Review | `/review-observability` | Observability review |
| 3.4 Review | Natural language prompt + `/review-code` | Push PR and post inline GitHub review |
| 4.1 Labels | Natural language prompt | Pre-implementation scoping |
| 4.2 Labels | Natural language prompt | Create feature/FEAT-2 branch |
| 4.3 Labels | `/feature-end-to-end "..."` | Labels feature workflow |
| 4.4 Labels | Natural language prompt | Smoke test labels endpoints |
| 5.1 Labels review | `/record-decision` | Record architectural decision |
| 5.2 Labels review | `/review-security` | Security review of labels feature |
| 5.3 Labels review | Natural language prompt | Push PR and post inline GitHub review |
| 6.1 Audit | Natural language prompt | Full architecture audit |
| 6.2 Audit | Natural language prompt | Full OWASP security audit |
| 6.3 Audit | Natural language prompt | Full test coverage audit |
| 6.4 Audit | `/review-observability` | Full observability audit |
| 6.5 Audit | Natural language prompt | Memory and unresolved issues check |
