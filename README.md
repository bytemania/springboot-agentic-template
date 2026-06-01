# Task Manager API

A production-grade Spring Boot 3 + React task manager — built as a learning template for backend engineering with Claude Code.

## Stack

| Layer | Technology |
|---|---|
| API | Java 21 + Spring Boot 3.3 + Spring Data JPA |
| Database | PostgreSQL 16 (H2 for unit tests) |
| Migrations | Flyway |
| Validation | Jakarta Bean Validation |
| Observability | Micrometer + Prometheus + Grafana + OpenTelemetry |
| Logging | Logback JSON → Logstash → Elasticsearch → Kibana |
| Frontend | React 18 + Vite + TypeScript + Tailwind + TanStack Query |
| Tests | JUnit 5 + AssertJ + Mockito + Testcontainers |
| Build | Gradle 8 + Spotless (palantir-java-format) |

---

## Prerequisites

| Tool | Purpose | Install |
|---|---|---|
| Java 21 | Run the API | [sdkman.io](https://sdkman.io) — `sdk install java 21` |
| Docker Desktop | All local stacks | [docker.com](https://www.docker.com/products/docker-desktop/) |
| Node 20+ | React frontend | [nodejs.org](https://nodejs.org) |
| kubectl | Kubernetes CLI | `brew install kubectl` |
| minikube | Local Kubernetes | `brew install minikube` |

---

## Option 1 — Local dev (Gradle + H2)

Fastest. No Docker needed. Uses H2 in-memory database.

```bash
./gradlew bootRun
```

API available at http://localhost:8080

```bash
# Health check
curl http://localhost:8080/actuator/health

# Create a task
curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","priority":"HIGH"}' | jq .

# List tasks
curl -s http://localhost:8080/tasks | jq .

# Filter by status
curl -s "http://localhost:8080/tasks?status=TODO" | jq .

# Get by id
curl -s http://localhost:8080/tasks/1 | jq .

# Update task
curl -s -X PATCH http://localhost:8080/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}' | jq .

# Add tag
curl -s -X POST http://localhost:8080/tasks/1/tags \
  -H "Content-Type: application/json" \
  -d '{"tag":"urgent"}' | jq .

# Delete task
curl -s -X DELETE http://localhost:8080/tasks/1 -w "%{http_code}"
```

---

## Option 2 — Docker Compose (full local stack)

Runs everything: API + React UI + PostgreSQL + Prometheus + Grafana + ELK.

### Start

```bash
# Build the Spring Boot jar first
./gradlew clean build -x test

# Build images and start all services
docker compose up --build -d
```

### Service URLs

| Service | URL | Credentials |
|---|---|---|
| React UI | http://localhost:3000 | — |
| Spring Boot API | http://localhost:8080 | — |
| Grafana | http://localhost:3001 | admin / admin |
| Prometheus | http://localhost:9090 | — |
| Kibana | http://localhost:5601 | — |
| Elasticsearch | http://localhost:9200 | — |
| PostgreSQL | localhost:5432 | taskuser / taskpass / taskdb |

### Common commands

```bash
# Check all containers are healthy
docker compose ps

# Follow logs for the API
docker compose logs -f app

# Follow logs for Logstash (verify log shipping)
docker compose logs -f logstash

# Rebuild only the API after a code change
./gradlew clean build -x test
docker compose build app && docker compose up -d app

# Rebuild only the frontend
docker compose build frontend && docker compose up -d frontend

# Stop everything
docker compose down

# Stop and wipe all volumes (clean slate)
docker compose down -v
```

### First-time Kibana setup

1. Open http://localhost:5601
2. Go to **Stack Management → Index Patterns**
3. Create index pattern: `task-manager-*`, time field: `@timestamp`
4. Go to **Discover** to search logs

### Grafana dashboard

1. Open http://localhost:3001 (admin / admin)
2. Go to **Dashboards → Task Manager**
3. Panels: task creation rate, deletion rate, p95 latency, JVM heap, HTTP request rate

---

## Option 3 — Minikube (local Kubernetes)

Simulates a real production Kubernetes environment on your laptop.

### Prerequisites check

```bash
minikube version
kubectl version --client
docker info
```

### Start Minikube

```bash
minikube start --memory=6144 --cpus=4
```

> Elasticsearch needs at least 4 GB RAM allocated to Minikube.

### Build images inside Minikube's Docker daemon

```bash
# Point your local Docker CLI at Minikube's daemon
eval $(minikube docker-env)

# Build both images (Minikube can see them without a registry)
./gradlew clean build -x test
docker build -t task-manager-app:latest .
docker build -t task-manager-frontend:latest ./frontend
```

### Deploy

```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/ -n task-manager
```

### Enable Ingress and expose cluster

```bash
minikube addons enable ingress

# In a separate terminal — keep it running
minikube tunnel
```

### Service URLs (after tunnel is running)

| Service | URL |
|---|---|
| React UI | http://localhost/ |
| API health | http://localhost/api/actuator/health |
| Grafana | http://localhost/grafana/ |
| Kibana | http://localhost/kibana/ |

### Watch everything come up

```bash
# Watch pod status (Ctrl+C to stop)
kubectl get pods -n task-manager -w

# All pods should reach Running or Completed
# Elasticsearch takes ~60s; app waits for db to be healthy
```

### Useful kubectl commands

```bash
# List all resources in the namespace
kubectl get all -n task-manager

# Check logs for the API pod
kubectl logs -n task-manager -l app=app -f

# Check logs for Elasticsearch
kubectl logs -n task-manager -l app=elasticsearch -f

# Describe a pod that is not starting
kubectl describe pod -n task-manager <pod-name>

# Get events (useful for debugging)
kubectl get events -n task-manager --sort-by='.lastTimestamp'

# Port-forward a service directly (without Ingress)
kubectl port-forward -n task-manager svc/app 8080:8080
kubectl port-forward -n task-manager svc/grafana 3001:3000
kubectl port-forward -n task-manager svc/kibana 5601:5601

# Shell into the app pod
kubectl exec -it -n task-manager $(kubectl get pod -n task-manager -l app=app -o name | head -1) -- sh

# Restart a deployment after a config change
kubectl rollout restart deployment/app -n task-manager

# Check rollout status
kubectl rollout status deployment/app -n task-manager
```

### Redeploy after a code change

```bash
eval $(minikube docker-env)
./gradlew clean build -x test
docker build -t task-manager-app:latest .
kubectl rollout restart deployment/app -n task-manager
kubectl rollout status deployment/app -n task-manager
```

### Tear down

```bash
# Delete the namespace (removes everything)
kubectl delete namespace task-manager

# Stop Minikube
minikube stop

# Delete cluster entirely (clean slate)
minikube delete
```

---

## Running tests

```bash
# Unit + controller slice tests (uses H2 — no Docker needed)
./gradlew test

# Integration tests (requires Docker for Testcontainers)
./gradlew integrationTest

# All tests
./gradlew check

# Test report
open build/reports/tests/test/index.html
```

---

## Build

```bash
# Full build with all tests
./gradlew clean build

# Build without integration tests
./gradlew clean build -x integrationTest

# Apply code formatting (palantir-java-format)
./gradlew spotlessApply

# Check formatting without changing files
./gradlew spotlessCheck
```

---

## Project structure

```
.
├── src/
│   ├── main/java/com/example/taskmanager/
│   │   ├── controller/       # HTTP layer — delegates to service
│   │   ├── service/          # Business logic + Micrometer metrics
│   │   ├── repository/       # Spring Data JPA interfaces
│   │   ├── domain/           # @Entity classes + enums
│   │   ├── dto/              # Request/response records
│   │   └── exception/        # Custom exceptions + GlobalExceptionHandler
│   ├── main/resources/
│   │   ├── application.properties
│   │   ├── logback-spring.xml
│   │   └── db/migration/     # Flyway SQL migrations
│   ├── test/                 # Unit + controller slice tests (H2)
│   └── integrationTest/      # Testcontainers integration tests (PostgreSQL)
├── frontend/                 # React 18 + Vite + Tailwind
│   └── src/
│       ├── api/              # Fetch wrappers per domain
│       ├── components/       # Reusable UI components
│       ├── hooks/            # TanStack Query hooks
│       ├── pages/            # Page-level components
│       └── types/            # TypeScript interfaces mirroring Java DTOs
├── observability/
│   ├── prometheus/           # prometheus.yml
│   ├── grafana/              # Datasource + dashboard provisioning
│   ├── otel/                 # OpenTelemetry collector config
│   ├── logstash/             # Logstash pipeline (JSON → Elasticsearch)
│   └── dashboards/           # Grafana dashboard JSON files
├── k8s/                      # Kubernetes manifests (Minikube)
├── docker-compose.yml        # Full local stack
├── Dockerfile                # Spring Boot image
└── .claude/                  # Claude Code agents, skills, commands, workflows
```

---

## Adding a new feature

### 1. Create the branch

```bash
git checkout -b feature/FEAT-123
```

### 2. Run the end-to-end workflow

This is the single command that does everything:

```bash
/feature-end-to-end "add due date reminders — a user can set a reminder date on a task and GET /tasks/reminders returns all tasks where reminder_date is today or past and status is not DONE"
```

The workflow runs 11 phases sequentially, each handled by a specialist agent:

| Phase | Agent | What happens |
|---|---|---|
| **Analyse** | — | Reads the codebase, maps existing entities, finds the highest migration version, identifies new fields/endpoints |
| **Architect** | `java-architect` | Reviews the design against architecture rules — approves or blocks with required changes |
| **Plan** | — | Produces a detailed plan: DTOs, service methods, repository queries, exception names, test scenarios, migration filenames |
| **Migrate** | `database-engineer` | Writes the Flyway SQL (`V2__...sql`), runs `./gradlew test` to confirm Flyway validates |
| **Implement** | `spring-boot-engineer` | Writes domain, DTOs, repository, exceptions, service, controller — in that exact order |
| **Test** | `testing-engineer` | Unit tests, `@WebMvcTest` slice tests, Testcontainers integration tests — runs and fixes until green |
| **Security** | `security-reviewer` | OWASP Top 10 check on the diff — auto-fixes critical/high findings |
| **Observability** | `observability-engineer` | Adds Micrometer counters/timers for new service methods, OTEL spans |
| **Review** | `security-reviewer` | Full diff review — correctness, Spring Boot anti-patterns, test gaps — auto-fixes blockers |
| **Ship** | — | Parallel `./gradlew build` + `./gradlew test`, then `./gradlew integrationTest` gate |
| **Frontend** | `react-engineer` | Adds TypeScript types, API wrappers, TanStack Query hooks, updates page components — `npm run build` gate |

The workflow self-heals: if security or review blockers are found, a `spring-boot-engineer` agent fixes them before moving on.

### 3. If you want more control — use commands instead

Skip the workflow and drive each layer yourself:

```bash
/create-endpoint      # Add a single REST endpoint slice
/create-entity        # Add a domain entity + migration
/create-test-suite    # Add tests to existing code
/review-security      # OWASP review the current diff
/review-observability # Check metrics/tracing coverage
```

### 4. Verify locally before committing

```bash
# Unit + slice tests (no Docker needed)
./gradlew test

# Integration tests (requires Docker)
./gradlew integrationTest

# Full stack smoke test
./gradlew clean build -x test
docker compose up --build -d
curl -s http://localhost:8080/actuator/health | jq .
```

### 5. Commit and push

```bash
git add .
git commit -m "feat(FEAT-123): add due date reminders"
git push origin feature/FEAT-123
```

### When to use the workflow vs. commands

| Situation | Use |
|---|---|
| New feature touching DB + service + controller + frontend | `/feature-end-to-end` |
| Adding one endpoint to an existing entity | `/create-endpoint` |
| Only adding tests to existing code | `/create-test-suite` |
| Security audit before a PR | `/review-security` |
| Something went wrong mid-workflow | Re-run with same `runId` — completed phases return cached results |

---

## API reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/tasks` | Create a task |
| `GET` | `/tasks` | List tasks (optional `?status=` `?priority=`) |
| `GET` | `/tasks/{id}` | Get task by ID |
| `PATCH` | `/tasks/{id}` | Partial update (title, description, status, priority, dueDate) |
| `DELETE` | `/tasks/{id}` | Delete task |
| `POST` | `/tasks/{id}/tags` | Add tag to task |
| `DELETE` | `/tasks/{id}/tags/{tag}` | Remove tag from task |
| `GET` | `/actuator/health` | Health check |
| `GET` | `/actuator/prometheus` | Prometheus metrics endpoint |
| `GET` | `/info` | App version info |
