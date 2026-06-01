---
name: api-documentation
description: >
  Write or update API documentation for the Spring Boot project.
  Use when adding new endpoints, updating request/response shapes, or generating
  OpenAPI annotations for Swagger UI.
---

# Skill: api-documentation

## OpenAPI annotations (springdoc-openapi)

Annotate controllers:
```java
@Operation(summary = "Create a task", description = "Creates a new task and returns its location.")
@ApiResponses({
    @ApiResponse(responseCode = "201", description = "Task created",
        content = @Content(schema = @Schema(implementation = TaskResponse.class))),
    @ApiResponse(responseCode = "400", description = "Validation failed"),
    @ApiResponse(responseCode = "409", description = "Task with this title already exists")
})
@PostMapping
public ResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) { ... }
```

Annotate DTOs:
```java
@Schema(description = "Request to create a new task")
public record CreateTaskRequest(
    @Schema(description = "Task title", example = "Buy groceries", requiredMode = REQUIRED)
    @NotBlank @Size(max = 255) String title,

    @Schema(description = "Task priority", example = "HIGH", defaultValue = "MEDIUM")
    Priority priority
) {}
```

## curl examples (include in documentation)

```bash
# Create a task
curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","priority":"HIGH"}' | jq .

# Get a task
curl -s http://localhost:8080/tasks/1 | jq .

# List all tasks
curl -s "http://localhost:8080/tasks?status=OPEN" | jq .
```

## CLAUDE.md skills/agents table

After adding any new skill or agent, update the tables in CLAUDE.md:
```markdown
| Skill name | When to use |
| Agent name | When to use |
```

## Rules

- Every endpoint must have documented status codes including all error cases.
- Example values must match the real field types and constraints.
- Do not document endpoints that do not exist.
- Verify examples against the actual controller before publishing.
