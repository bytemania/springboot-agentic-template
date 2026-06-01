---
name: create-endpoint
description: >
  Use this skill to create a complete REST endpoint slice in a Spring Boot 3 + Java 21 project.
  Covers: controller, request DTO, response DTO, service method, domain model (if needed),
  exception handling, and tests. Invoke when creating a new endpoint or extending an existing one.
---

# Skill: create-endpoint

Creates a full, tested REST endpoint slice following the project's layered architecture.
One endpoint at a time. No shortcuts.

---

## Step 1 — Gather requirements

Before writing any code, confirm:

- HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Path and path variables (e.g. `/tasks/{id}`)
- Request body fields, types, and which are required
- Response body fields and types
- Expected HTTP status codes (success and failure)
- Validation rules (e.g. `@NotBlank`, `@Size`, `@Min`)
- Error cases (not found, conflict, invalid input)

If any of these are unclear, ask before proceeding.

---

## Step 2 — Inspect what already exists

```
Glob  → src/main/java/**/*.java       (map all existing classes)
LS    → src/main/java/.../controller  (check existing controllers)
LS    → src/main/java/.../service     (check existing services)
LS    → src/main/java/.../domain      (check existing domain models)
LS    → src/main/java/.../dto         (check existing DTOs)
Grep  → @RequestMapping, @RestController  (find base paths)
Grep  → existing domain class name    (avoid duplicating models)
```

Never create a class that already exists. Extend it if it is close enough.

---

## Step 3 — Plan the slice

Write out the plan before creating any file:

```
Controller method : [METHOD] [path]
Request DTO       : [ClassName] — fields and validation annotations
Response DTO      : [ClassName] — fields returned to the client
Service method    : [methodSignature] — what it does
Domain change     : [new model / update existing / none]
Exceptions        : [which errors, which HTTP status]
Tests             : [list of scenarios to cover]
```

---

## Step 4 — Implement in layer order

Always implement in this order — never skip layers or implement bottom-up:

### 4a. Domain model (if new or changed)
- Plain Java class or record
- No Spring annotations
- No JPA yet — add fields only if they belong to the domain concept

### 4b. Request DTO
- Java `record`
- Bean Validation annotations on every field that needs it
- Example:
```java
public record CreateTaskRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    String title,

    @NotNull(message = "Priority is required")
    Priority priority
) {}
```

### 4c. Response DTO
- Java `record`
- No validation annotations — this is outbound only
- Map from domain in the service, not in the controller

### 4d. Service method
- Constructor-injected dependencies only
- Accepts request DTO or primitives — never a domain object from the controller
- Returns response DTO — never a domain object
- Throws specific, named exceptions for each error case
- No try/catch for flow control

### 4e. Controller method
- Annotated with `@RestController`
- One method per endpoint
- Delegates immediately to service — no logic here
- Uses `ResponseEntity<T>` with explicit status codes
- `@Valid` on `@RequestBody` parameters
- Example:
```java
@PostMapping
public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(taskService.create(request));
}
```

### 4f. Exception handling
- Add a specific exception class if one does not already exist
- Register the handler in the existing `@ControllerAdvice`
- Return a consistent error response body (use whatever structure already exists)

---

## Step 5 — Write tests

### Controller test (`@WebMvcTest`)
Cover every scenario:
- ✅ Happy path — correct input returns expected status and body
- ❌ Invalid input — missing required field returns `400`
- ❌ Not found — missing resource returns `404`
- ❌ Conflict — duplicate or constraint violation returns `409` (if applicable)

### Service test (plain unit test)
- Test the logic directly — no Spring context
- Use AssertJ assertions
- Use Mockito only to mock repository dependencies
- Cover: happy path, not found, invalid state, edge cases

---

## Step 6 — Verify

```bash
./gradlew test
```

All tests must pass before the skill is complete.
If any test fails, fix the implementation — never change the test to pass.

---

## Output summary

When done, report:

```
## Endpoint created
[METHOD] [path]

## Files created or modified
- [file path] — what changed

## Tests
- [test class] — scenarios covered

## Verify
./gradlew test — PASSED

## Example request
curl -X [METHOD] http://localhost:8080[path] \
  -H "Content-Type: application/json" \
  -d '[example body]'
```
