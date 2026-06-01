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
- PostgreSQL 16 (production database — Docker/Minikube)
- Logstash + Elasticsearch + Kibana (ELK stack — log shipping and search)
- Nginx (frontend reverse proxy in Docker/Minikube)

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

# Full local stack (app + frontend + postgres + grafana + ELK)
./gradlew clean build -x test && docker compose up --build -d

# Minikube
eval $(minikube docker-env)
docker build -t task-manager-app:latest .
docker build -t task-manager-frontend:latest ./frontend
kubectl apply -f k8s/ -n task-manager

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
| `docker-development` | Manage full Docker Compose + Minikube stack (app, frontend, postgres, prometheus, grafana, ELK) |

## Agents available

| Agent | When to use |
|---|---|
| `java-architect` | Architecture decisions and design tradeoffs |
| `spring-boot-engineer` | Feature implementation (endpoints, services, domain) |
| `testing-engineer` | Test strategy and coverage |
| `security-reviewer` | Security review and vulnerability analysis |
| `observability-engineer` | OTEL instrumentation, metrics, tracing, Grafana dashboards |
| `database-engineer` | Schema design, query optimization, migration strategy |
| `documentation-writer` | API docs, README, and project documentation |
| `performance-engineer` | Profiling, caching, load testing |
| `frontend-engineer` | Frontend interfaces and web UI |
