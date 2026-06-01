---
name: spring-boot-api
description: >
  Create a complete REST endpoint slice in a Spring Boot 3 + Java 21 project:
  controller, request DTO, response DTO, service method, domain model (if needed),
  exception handling, and tests. Invoke when creating or extending a REST endpoint.
---

# Skill: spring-boot-api

Creates a full, tested REST endpoint slice following the project layered architecture.

## Step 1 — Gather requirements

Before writing any code, confirm:
- HTTP method and path (e.g. POST /tasks, GET /tasks/{id})
- Request body fields, types, and validation rules
- Response body fields and types
- Expected HTTP status codes for success and each failure case
- Error cases: not found, conflict, invalid input, business rule violations

## Step 2 — Inspect what exists

Use Glob and Grep to find existing controllers, services, domain classes, and DTOs.
Never create a class that already exists — extend it if close enough.

## Step 3 — Implement in this exact order

1. Domain entity (if new) — @Entity, Long id, no Lombok
2. Flyway migration (if schema changes) — V{n}__description.sql
3. JPA repository interface
4. Request DTO record with @Valid annotations
5. Response DTO record
6. Custom exception class + @ResponseStatus or @ControllerAdvice entry
7. Service method — business logic only, no HTTP knowledge
8. Controller method — HTTP mapping only, delegates to service

## Step 4 — Write tests

Unit tests (src/test/java):
- Service layer with JUnit 5 + AssertJ + Mockito
- Happy path, all error cases, all business rule branches

Controller slice tests (src/test/java):
- @WebMvcTest + MockMvc
- Status codes, response JSON shape, validation rejection

Integration test (src/integrationTest/java):
- @SpringBootTest + Testcontainers PostgreSQL
- Full HTTP → DB → HTTP cycle

## Step 5 — Verify

Run ./gradlew test. Fix all failures before declaring done.

## Rules

- Constructor injection only — no @Autowired on fields.
- No Lombok unless explicitly requested.
- No business logic in controllers.
- No raw domain objects in responses — always map to DTO.
- No new dependencies without justification.
