---
name: hexagonal-architecture
description: >
  Introduce or apply hexagonal (ports and adapters) architecture patterns to this Spring Boot project.
  Use when the current layered architecture needs clearer domain isolation, testability improvements,
  or when adding a new external adapter (REST, messaging, scheduled jobs).
---

# Skill: hexagonal-architecture

Guides the introduction of hexagonal architecture patterns to isolate domain logic from infrastructure.

## When to use this skill

Apply when:
- The service layer is becoming polluted with infrastructure concerns (JPA, HTTP clients, messaging).
- You need to swap an adapter (e.g. replace a REST call with a message queue) without touching domain logic.
- Unit testing the domain is difficult because it depends on Spring beans or JPA repositories.

Do NOT apply prematurely. If the project has fewer than 3 entities and 1 aggregate root, the layered architecture is sufficient.

## Core concepts

**Domain** — pure business logic. No Spring annotations. No JPA. No HTTP.
**Ports** — interfaces the domain defines. Two types:
  - Inbound ports: use cases the application exposes (CreateTaskUseCase, FindTaskUseCase)
  - Outbound ports: dependencies the domain requires (TaskRepository as an interface)
**Adapters** — implementations of ports. Two types:
  - Driving adapters: call inbound ports (REST controller, CLI, scheduled job)
  - Driven adapters: implement outbound ports (JPA repository, HTTP client, message producer)

## Package layout

```
src/main/java/com/example/taskmanager/
├── domain/
│   ├── model/          Task.java, TaskStatus.java
│   ├── port/
│   │   ├── in/         CreateTaskUseCase.java, FindTaskUseCase.java
│   │   └── out/        TaskRepositoryPort.java
│   └── service/        TaskDomainService.java
├── adapter/
│   ├── in/
│   │   └── web/        TaskController.java, TaskRequest.java, TaskResponse.java
│   └── out/
│       └── persistence/ TaskJpaRepository.java, TaskEntity.java, TaskPersistenceAdapter.java
```

## Migration strategy

1. Extract domain model to domain/model — remove JPA annotations, use plain Java.
2. Define outbound port interfaces in domain/port/out.
3. Create persistence adapter implementing the outbound port — JPA logic lives here.
4. Define inbound port (use case) interfaces in domain/port/in.
5. Rewrite service to implement inbound ports, inject outbound ports.
6. Update controller to call inbound ports only.
7. Update tests: domain service tests need no Spring context; adapter tests use @DataJpaTest.

## Rules

- Domain model must have zero Spring or JPA imports.
- Use case interfaces must have zero infrastructure imports.
- Adapters may import Spring and JPA — domain may not.
