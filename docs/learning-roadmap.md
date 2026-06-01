# SPRINGBOOT AGENTIC PLATFORM - LEARNING ROADMAP

## PHASE 1 - UNDERSTAND THE TEMPLATE

### Prompt 1

Read CLAUDE.md and analyze this repository.

Explain:

1. How to run the backend locally
2. How to run the frontend locally
3. How to run the full Docker stack
4. How to run tests
5. How the .claude agents and commands should be used
6. What is wrong or risky in this template
7. What should be the next feature to build

### Prompt 2

Run a repository health check.

Check:

- Gradle build
- tests
- Docker files
- docker-compose
- frontend package
- README correctness
- .claude configuration

Do not modify anything. Give me a report first.

---

## PHASE 2 - CLEANUP

### Prompt

Clean this repository for GitHub.

Remove generated/local files from version control:

- build/
- .gradle/
- frontend/node_modules/
- frontend/dist/
- .idea/
- __MACOSX/
- compiled jars

Update .gitignore correctly.

Show me the plan before changing anything.

---

## PHASE 3 - LEARN THE PROJECT

### Prompt

Act as a senior engineer.

Give me a complete walkthrough of this project.

For each folder explain:

- why it exists
- who uses it
- when it is executed
- examples

Assume I am learning Claude Code.

---

# FEATURE ROADMAP

# A - INITIAL IMPLEMENTATION

## Task Manager Application

Build a production-style full-stack Task Manager application using:

- Spring Boot 3
- Java 21
- Gradle
- React
- Vite
- PostgreSQL
- Flyway
- Docker
- Prometheus
- Grafana
- CLAUDE.md conventions

### Backend

Create:

- Task Entity
- TaskStatus Enum
- TaskPriority Enum
- TaskRepository
- TaskService
- TaskController
- DTOs
- Validation
- Error Handling
- Flyway Migration
- Unit Tests
- Integration Tests

Task fields:

- id
- title
- description
- status
- priority
- dueDate
- createdAt
- updatedAt

Statuses:

- TODO
- IN_PROGRESS
- DONE
- CANCELLED

Priorities:

- LOW
- MEDIUM
- HIGH
- URGENT

API:

- GET /api/tasks
- GET /api/tasks/{id}
- POST /api/tasks
- PUT /api/tasks/{id}
- PATCH /api/tasks/{id}/status
- DELETE /api/tasks/{id}

### Frontend

Create:

- Task List
- Task Details
- Create Task
- Edit Task
- Filters
- API Client
- Loading States
- Error Handling

### Documentation

Update:

- README.md
- docs/task-manager.md
- API documentation
- Run instructions
- Test instructions

### Implementation Rule

IMPORTANT:

First generate a plan only.

Do not modify files until approval is given.

---

# B - ADVANCED FEATURES

## Authentication

Implement:

- JWT
- Login
- Logout
- Registration
- Password Reset
- Role Based Access

Roles:

- USER
- ADMIN

## User Management

Create:

- User Profile
- User Settings
- User Preferences

## Categories

Create:

- Categories
- Tags
- Labels

## Notifications

Implement:

- Email Notifications
- In-App Notifications
- Scheduled Reminders

## Audit Trail

Track:

- Task Creation
- Task Updates
- Task Deletion
- Login Activity

---

# C - EVENT DRIVEN ARCHITECTURE

Implement:

- Domain Events
- Event Publisher
- Event Consumers
- Async Processing

Use:

- Spring Events initially
- Kafka later

Events:

- TaskCreated
- TaskUpdated
- TaskCompleted
- UserRegistered

---

# D - AGENTIC PLATFORM

Create Claude-compatible agents.

## Documentation Agent

Responsibilities:

- Generate documentation
- Update architecture docs

## Code Review Agent

Responsibilities:

- Review code
- Suggest improvements

## Architecture Agent

Responsibilities:

- Validate architecture decisions

## Testing Agent

Responsibilities:

- Suggest missing tests
- Generate test plans

---

# E - MEMORY SYSTEM

Implement:

## Project Memory

Stores:

- Architecture Decisions
- ADRs
- Technical Decisions

## Session Memory

Stores:

- Current Work
- Active Tasks

## User Memory

Stores:

- User Preferences
- Coding Preferences

---

# F - MCP PLATFORM

Implement:

## MCP Server

Support:

- Tools
- Resources
- Prompts

## MCP Client

Support:

- Tool Discovery
- Remote Tool Execution

---

# G - TOOL FRAMEWORK

Create:

- FileSystem Tool
- Git Tool
- Database Tool
- Web Search Tool
- Docker Tool
- Kubernetes Tool

---

# H - WORKFLOW ENGINE

Create:

- Workflow Definitions
- Agent Orchestration
- Long Running Tasks
- Retry Policies

---

# I - RAG PLATFORM

Implement:

- Embeddings
- Vector Database
- Retrieval Layer
- Knowledge Base

Possible Technologies:

- pgvector
- Qdrant
- Chroma

---

# J - OBSERVABILITY

Implement:

- Metrics
- Tracing
- Logging
- Dashboards
- Alerts

Use:

- Prometheus
- Grafana
- OpenTelemetry

---

# K - DEPLOYMENT

Implement:

- Docker
- Docker Compose
- Kubernetes
- Helm

---

# FINAL TARGET ARCHITECTURE

springboot-agentic-platform/

agents/
skills/
commands/
memory/
tools/
mcp/
workflows/
rag/
observability/
api/
frontend/
