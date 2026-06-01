---
description: "Create a new JPA entity with Flyway migration, repository, and basic CRUD service methods"
---

Create a new JPA entity and all associated infrastructure for this Spring Boot project.

Steps:
1. Ask for the entity name, fields (name + Java type + nullable?), and any relationships if not provided.
2. Read CLAUDE.md and existing migrations to find the current highest migration version.
3. Implement in order:
   a. Flyway migration V{next}__create_{table_name}_table.sql — BIGSERIAL PRIMARY KEY, snake_case columns, appropriate constraints.
   b. JPA @Entity class — Long id with @GeneratedValue(IDENTITY), camelCase fields, @Column constraints matching SQL.
   c. Spring Data JpaRepository interface.
   d. Response DTO record.
   e. Service class with findAll, findById, create, update, delete methods.
4. Write unit tests for the service layer.
5. Run ./gradlew test. Fix all failures before finishing.

Rules:
- Entity IDs are Long with @GeneratedValue(strategy = GenerationType.IDENTITY) — never UUID.
- No Lombok.
- No ddl-auto=create — Flyway owns the schema.
