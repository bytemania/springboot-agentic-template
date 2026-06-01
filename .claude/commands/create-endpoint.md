---
description: "Create a complete REST endpoint slice: domain → migration → repository → service → controller → tests"
---

Create a full REST endpoint slice following the Spring Boot layered architecture in this project.

Steps:
1. Ask for the HTTP method, path, request fields, response fields, and error cases if not provided.
2. Read CLAUDE.md to confirm architecture rules before writing any code.
3. Inspect existing code: Glob src/main/java/**/*.java, check existing controllers, services, domain, DTOs.
4. Implement in order:
   a. Domain entity (if new)
   b. Flyway migration (if schema changes)
   c. JPA repository interface
   d. Request DTO record with @Valid constraints
   e. Response DTO record
   f. Custom exception class
   g. @ControllerAdvice handler (if not present)
   h. Service method
   i. Controller method
5. Write unit tests (service layer) and controller slice tests (@WebMvcTest).
6. Write an integration test in src/integrationTest/java/ using Testcontainers.
7. Run ./gradlew test. Fix all failures before finishing.
8. Output a curl example for the new endpoint.
