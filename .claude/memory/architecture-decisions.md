---
name: architecture-decisions
description: Why key architectural choices were made in this project
metadata:
  type: project
---

## Layered Architecture (controller → service → repository → domain → dto)

Chose simple layered over hexagonal/ports-and-adapters because the project is a learning template.
Complexity should be introduced deliberately, not by default.
**Why:** Hexagonal adds indirection that obscures the learning goals.
**How to apply:** Do not introduce use-case interfaces, ports, or adapters unless the user explicitly asks.

## Flyway over `spring.jpa.hibernate.ddl-auto`

All schema changes go through Flyway SQL migrations in `src/main/resources/db/migration/`.
`ddl-auto=none` is set in all profiles.
**Why:** Schema changes must be versioned, reviewable, and repeatable across environments.
**How to apply:** Never use `ddl-auto=create` or `update`. Always write `V{n}__{description}.sql`.

## H2 for dev/unit tests, Testcontainers PostgreSQL for integration tests

H2 is fast and needs no Docker. Testcontainers gives a real PostgreSQL for integration tests.
**Why:** Balance of speed (unit) vs. fidelity (integration).
**How to apply:** `@SpringBootTest` tests always use Testcontainers. `@WebMvcTest` and unit tests use H2 or no DB.

## Records for DTOs

All request/response DTOs are Java records. No Lombok.
**Why:** Records are immutable, concise, and idiomatic Java 21. Lombok hides too much.
**How to apply:** `CreateTaskRequest`, `TaskResponse`, etc. are all records with `@NotNull`/`@NotBlank` on fields.

## Slide-in TaskDetailPanel over a separate route

Task detail is shown as a slide-in panel triggered from the card title, not a separate `/tasks/:id` route.
**Why:** Consistent with the existing `CreateTaskModal`/`EditTaskModal` UX pattern. Avoids route change.
**How to apply:** New detail views should follow the same panel pattern unless the user requests a page.

## Logstash port remapped to 5001

Logstash syslog input was on host port 5000. macOS AirPlay Receiver occupies 5000.
**Why:** Avoid port conflict on developer machines without requiring AirPlay to be disabled.
**How to apply:** Logstash is always `5001:5000` in docker-compose. Container stays on 5000 internally.

## No Spring Security (yet)

No authentication layer exists. All endpoints and actuator paths are open.
**Why:** Learning template — security layer is a planned future addition.
**How to apply:** Flag any endpoint or actuator exposure in security reviews. Do not add auth silently.

## Constructor injection everywhere

No `@Autowired` on fields. All dependencies injected via constructor.
**Why:** Makes dependencies explicit, enables final fields, easier to test.
**How to apply:** Always generate constructors, never field injection.
