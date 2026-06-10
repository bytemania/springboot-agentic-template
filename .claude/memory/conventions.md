---
name: conventions
description: Naming, testing, commit, and code conventions enforced in this project
metadata:
  type: project
---

## Commit message format

```
<type>(<ticket>): <short description>

feat(FEAT-1): add status update endpoint
fix(FEAT-2): correct flyway dependency for PostgreSQL
chore: remove generated files from version control
docs: update API reference
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`
Ticket is optional for non-feature work.

## Branch naming

```
feature/FEAT-<n>    ← new features
fix/FEAT-<n>        ← bug fixes on a ticket
chore/<description> ← maintenance
```

## Test method naming

```java
// Preferred
void replaceTask_updatesAllFields()
void replaceTask_unknownId_throwsTaskNotFoundException()

// Also acceptable
@DisplayName("should reset status to TODO when replacing a task")
```

Structure: `given / when / then` or `arrange / act / assert`.

## No Lombok

Zero Lombok in production or test code. Use:
- Records for DTOs
- Plain constructors for services/controllers
- `@Builder` equivalent → write the builder manually if needed (rare)

## DTO rules

- All request/response objects are Java records
- Validation annotations (`@NotBlank`, `@NotNull`, `@Size`) go on the record component
- Never expose `@Entity` objects in API responses — always map to a response record

## `@Transactional` placement

- `@Transactional` belongs on **service layer methods only**
- Read-only service methods should use `@Transactional(readOnly = true)`
- Never on controllers or repositories
- Never wrap remote calls (HTTP, messaging) inside a transaction

## Micrometer metric naming

Follow Prometheus naming conventions (lowercase, underscores, `_total` suffix for counters):
- `tasks_created_total` (counter, tagged by `priority`)
- `tasks_deleted_total` (counter)
- `tasks_completed_total` (counter)
- `tasks_getById_duration_seconds` (timer)
- `tasks_list_duration_seconds` (timer)
- `tasks_by_status` (gauge, tagged by `status`)
- `tasks_by_priority` (gauge, tagged by `priority`)

## Flyway migration naming

```
V{version}__{description}.sql
V1__create_tasks_table.sql
V2__add_due_date_column.sql
```

Version is always an integer. Description uses underscores. Never reuse a version number.

## Frontend API calls

All frontend API calls go through `/api/*` (Vite proxy strips `/api` and forwards to `localhost:8080`).
Backend controller paths stay as `/tasks`, `/tasks/{id}`, etc.
Never call `localhost:8080` directly from frontend code.

## Error handling

- Custom exceptions extend `RuntimeException` and are domain-specific (`TaskNotFoundException`)
- `GlobalExceptionHandler` (`@RestControllerAdvice`) handles all exceptions centrally
- No `try/catch` returning `ResponseEntity` inside controllers or services
- Error response shape: `{ timestamp, status, error, message, path }`
