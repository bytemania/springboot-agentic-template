# Project Memory

This is a Spring Boot 3 + Java 21 + Gradle backend API.

The application is a Task Manager API used to learn production-level
backend engineering with Claude Code, agent skills, and project memory.

## Technical stack

- Java 21
- Spring Boot 3.3.x
- Gradle
- Spring Data JPA (entity persistence)
- H2 (in-memory database for dev and unit tests)
- Testcontainers + PostgreSQL (integration tests only)
- Flyway (schema migrations)
- OpenTelemetry + Micrometer (metrics and tracing)
- Grafana / Prometheus (observability stack — local Docker Compose)
- JUnit 5
- AssertJ
- Mockito when needed

## Architecture rules

Use a simple layered architecture first:

- controller
- service
- repository (Spring Data JPA `JpaRepository`)
- domain (`@Entity` classes)
- dto (records)

Do not introduce unnecessary complexity too early.

Prefer:

- constructor injection
- records for simple DTOs
- explicit validation
- small services
- clear package boundaries
- tests for all behavior

Avoid:

- Lombok unless explicitly requested
- large God services
- hidden magic
- changing architecture without explaining why
- adding dependencies without justification

## Database conventions

- H2 for local dev (`spring.datasource.url=jdbc:h2:mem:taskdb`) and unit/slice tests
- Testcontainers PostgreSQL for `@SpringBootTest` integration tests only
- All schema changes go through Flyway migrations in `src/main/resources/db/migration/`
- Migration naming: `V{version}__{description}.sql` (e.g. `V1__create_tasks_table.sql`)
- Never use `spring.jpa.hibernate.ddl-auto=create` — Flyway owns the schema
- Entity IDs: use `Long` with `@GeneratedValue(strategy = GenerationType.IDENTITY)`

## Observability conventions

- Expose `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`
- Use `MeterRegistry` for custom counters/timers (constructor-injected)
- OpenTelemetry auto-instrumentation via `-javaagent` in dev
- Grafana dashboards live in `observability/dashboards/`
- Docker Compose for local Prometheus + Grafana: `docker-compose.yml` at project root

## Build commands

```bash
./gradlew clean build
./gradlew test
./gradlew bootRun

# Integration tests only (requires Docker for Testcontainers)
./gradlew integrationTest

# Run observability stack locally
docker compose up -d

# Apply Flyway migrations manually
./gradlew flywayMigrate
```

## CI / CD

- GitHub Actions workflow: `.github/workflows/build.yml`
- On every push and PR: compile → unit tests → integration tests → build jar
- Integration tests require Docker (Testcontainers)
- Artifacts: fat jar uploaded on `main` branch builds

## Skills available

| Skill | When to use |
|---|---|
| `create-endpoint` | Add a new REST endpoint slice (controller + service + repo + tests) |
| `add-tests` | Add tests to an existing feature |
| `jpa` | Add or modify JPA entities, repositories, or queries |
| `flyway` | Create or modify a Flyway migration |
| `performance-engineer` | Profile endpoints, add caching, optimize queries |
| `ci-cd` | Modify GitHub Actions workflows or release process |
| `review-code` | Review the current diff before committing |
| `update-docs` | Update documentation |

## Agents available

| Agent | When to use |
|---|---|
| `backend-engineer` | Feature implementation (endpoints, services, domain) |
| `database-agent` | Schema design, query optimization, migration strategy |
| `performance-engineer` | Profiling, caching, load testing, OTEL instrumentation |
| `code-reviewer` | Pre-commit review |
| `qa-engineer` | Test strategy and coverage |
| `architect` | Architecture decisions and design tradeoffs |
