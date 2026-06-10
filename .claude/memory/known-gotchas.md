---
name: known-gotchas
description: Traps already hit in this project — read before touching these areas
metadata:
  type: project
---

## Flyway 10 requires `flyway-database-postgresql` as a separate dependency

Flyway 10 split PostgreSQL support into its own module. Without it, all integration tests fail
with `FlywayException` at `DatabaseTypeRegister.java:105`.
**Fix:** Both `implementation` and `integrationTestImplementation` blocks in `build.gradle`
must include `org.flywaydb:flyway-database-postgresql`.
**Files:** `build.gradle`

## macOS AirPlay Receiver occupies port 5000

Logstash syslog input defaulted to host port 5000. macOS Ventura+ has AirPlay Receiver on 5000.
**Fix:** Remapped in `docker-compose.yml` to `5001:5000`. Do not change back to 5000.
**Files:** `docker-compose.yml` lines 115-116

## Docker COPY glob fails when it matches both fat jar and plain jar

`build/libs/` contains `*-SNAPSHOT.jar` (fat bootJar) and `*-plain.jar` (thin jar).
`COPY build/libs/*.jar app.jar` fails because the glob matches two files.
**Fix:** Use `COPY build/libs/*-SNAPSHOT.jar app.jar` in the Dockerfile.
**Files:** `Dockerfile`

## `build/` in `.dockerignore` blocks the jar from Docker build context

`.dockerignore` excluded the entire `build/` directory. Docker COPY couldn't find the jar.
**Fix:** Added `!build/libs/*.jar` negation after the `build/` exclusion.
**Files:** `.dockerignore`

## Elasticsearch OOM-kills with exit code 137 if Docker memory < 6 GB

Elasticsearch needs at least 2 GB heap. The full stack (9 services) needs 6+ GB allocated
to Docker Desktop.
**Fix:** Docker Desktop → Settings → Resources → Memory → 6 GB minimum.
**Workaround:** Use `docker compose -f docker-compose.yml -f docker-compose.no-elk.yml up` to skip ELK.

## Spotless formatting gate blocks builds

`./gradlew build` runs `spotlessJavaCheck`. Any formatting violation (import order, line wrapping)
causes `BUILD FAILED`.
**Fix:** Run `./gradlew spotlessApply` before committing or building.
**When it bites:** After adding new Java files or adding imports in the wrong order.

## `replaceTask` silently leaves tags untouched

`PUT /tasks/{id}` (replaceTask) resets status to TODO but does NOT clear tags.
This is a known inconsistency — tags should be cleared on a full replace.
**Status:** Identified in code review, not yet fixed. See `TaskService.java:replaceTask`.

## `deleteTask` has a TOCTOU race — no `@Transactional`

`deleteTask` calls `existsById` then `deleteById` as two separate DB operations with no transaction.
Under concurrent load the 404 guard is unreliable.
**Status:** Known issue from code review, not yet fixed. See `TaskService.java:deleteTask`.
