---
name: review-code
description: >
  Use this skill to review the current git diff for correctness, quality, test coverage,
  Spring Boot best practices, and production risks. Invoke after implementing a feature,
  fixing a bug, or before committing. Never modifies any file — read and report only.
---

# Skill: review-code

Reviews the current uncommitted changes against the project's conventions in CLAUDE.md.
Read-only. Never edits, creates, or deletes any file.

---

## Step 1 — Understand what changed

```bash
git status
git diff
git diff --cached
```

Read the full diff before forming any opinion.
If the diff is empty, report that and stop.

---

## Step 2 — Read the changed files in full

Do not review a diff in isolation — always read the full file for context:

```
Read  → every file that appears in the diff
Read  → CLAUDE.md to confirm which conventions apply
Grep  → existing tests for each changed class
```

---

## Step 3 — Run the tests

```bash
./gradlew test
```

Record the result. A failing test suite is always a blocking issue regardless of code quality.

---

## Step 4 — Review checklist

Work through every category. Do not skip any.

**Correctness**
- Does the logic match the intended behaviour?
- Are edge cases handled — null, empty collection, zero, boundary values?
- Are HTTP status codes semantically correct (`201` for creation, `404` for not found, `409` for conflict)?
- Are optional values handled safely — no unchecked `.get()` on `Optional`?

**Layering**
- Is the controller → service → repository → domain boundary respected?
- Is there any business logic inside a controller method?
- Is any repository called directly from a controller?
- Are domain objects returned from endpoints instead of DTOs?

**Spring Boot practices**
- Constructor injection only — no `@Autowired` on fields?
- `@Valid` present on `@RequestBody` parameters?
- Bean Validation on request DTOs, not inside service methods?
- Exception handling via `@ControllerAdvice`, not scattered try/catch?
- No logic inside `@RestController` methods beyond delegation to the service?

**Error handling**
- Are exceptions specific and named per domain concept?
- Are all error paths returning a consistent response body?
- Are exceptions logged at the right level before being handled?
- Are any exceptions silently swallowed?

**Test coverage**
- Is every changed behaviour covered by at least one test?
- Are failure paths and edge cases tested — not just the happy path?
- Are service tests plain unit tests (JUnit 5 + AssertJ)?
- Are controller tests using `@WebMvcTest`?
- Is `@SpringBootTest` being used where a slice test would be sufficient?
- Are tests testing behaviour, not implementation details?
- Was any existing test modified to make it pass instead of fixing the code?

**Code quality**
- Are Java 21 features used where appropriate — records, sealed classes, switch expressions?
- Are method and class names clear and honest about what they do?
- Are there any methods doing more than one thing?
- Is there any dead code, commented-out code, or TODO left in?
- Are there any unnecessary dependencies introduced?

**Security**
- Is all input validated before use?
- Is any sensitive data (passwords, tokens, PII) being logged?
- Are there any obvious injection risks?

**Observability**
- Are meaningful log messages present at key decisions and failure paths?
- Are log levels appropriate — `DEBUG` for detail, `INFO` for milestones, `WARN`/`ERROR` for failures?

---

## Step 5 — Output

Use exactly this structure:

---

### ✅ Test result
`./gradlew test` — PASSED / FAILED
If failed: include the test name and failure message.

---

### 📋 Summary
One short paragraph. What does this change do and is it generally sound?

---

### 🚨 Blocking issues
Must be fixed before committing.
If none: write `None.`

- **[File:Line]** — problem description and why it matters.

---

### ⚠️ Non-blocking improvements
Worth doing but not commit-blockers.
If none: write `None.`

- **[File:Line]** — suggestion and reasoning.

---

### 🧪 Missing tests
Behaviours that are untested and should be.
If none: write `None.`

- **[Scenario]** — why this case matters.

---

### 🔒 Production risks
Anything that could cause problems in a live environment.
If none: write `None.`

- **[Risk]** — what could go wrong and under what conditions.

---

## Rules

- Never edit, write, or delete any file.
- Always read the full file — never review a diff line without its context.
- Be specific — always reference file and line number.
- Flag real problems only — do not nitpick style unless it harms readability or maintainability.
- If the change is correct and well-structured, say so clearly.
- Do not rewrite code in the review — describe the problem, let the engineer fix it.
