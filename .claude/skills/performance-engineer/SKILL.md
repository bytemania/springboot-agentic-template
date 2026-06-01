---
name: performance-engineer
description: >
  Use this skill to profile endpoints, detect N+1 queries, add caching, instrument with
  OpenTelemetry/Micrometer, or interpret Grafana metrics. Invoke when an endpoint is slow,
  a query is unoptimized, or observability coverage needs to improve.
---

# Skill: performance-engineer

Diagnoses and fixes performance issues in the Spring Boot API. Measures before optimizing —
never guess. Every change must be verified with a before/after metric or test.

---

## Step 1 — Identify the problem

Before touching code, gather data:

```bash
# Check actuator metrics
curl -s http://localhost:8080/actuator/metrics/http.server.requests | jq .

# Check slow queries (if datasource metrics enabled)
curl -s http://localhost:8080/actuator/metrics/jdbc.connections.active | jq .

# Check Prometheus endpoint
curl -s http://localhost:8080/actuator/prometheus | grep http_server
```

Also look at the code:

```
Grep → @Transactional                   (find transaction boundaries)
Grep → findAll\|findBy                  (find potentially expensive queries)
Grep → @OneToMany\|@ManyToMany          (find lazy-loading candidates for N+1)
```

---

## Step 2 — Diagnose

### N+1 query detection

Enable SQL logging in `application.properties` for a test run:

```properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

Run the endpoint, count the SQL statements. More than 1 query for a list = N+1.

Fix with `@EntityGraph` or a `JOIN FETCH` query:

```java
@Query("SELECT t FROM Task t JOIN FETCH t.assignee WHERE t.status = :status")
List<Task> findByStatusWithAssignee(@Param("status") TaskStatus status);
```

### Slow endpoint

Add a `@Timed` span or use Micrometer directly:

```java
private final MeterRegistry meterRegistry;

public List<TaskResponse> findAll() {
    Timer.Sample sample = Timer.start(meterRegistry);
    List<TaskResponse> result = // ...
    sample.stop(meterRegistry.timer("tasks.findAll.duration"));
    return result;
}
```

---

## Step 3 — Add caching (only when appropriate)

Use Spring Cache with Caffeine for read-heavy, low-write data:

```java
@Cacheable(value = "tasks", key = "#status")
public List<TaskResponse> findByStatus(TaskStatus status) { ... }

@CacheEvict(value = "tasks", allEntries = true)
public TaskResponse create(CreateTaskRequest request) { ... }
```

Add to `build.gradle`:
```groovy
implementation 'com.github.ben-manes.caffeine:caffeine'
```

Add to `application.properties`:
```properties
spring.cache.type=caffeine
spring.cache.caffeine.spec=maximumSize=500,expireAfterWrite=60s
```

---

## Step 4 — OpenTelemetry instrumentation

Custom span for a critical operation:

```java
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.Span;

private final Tracer tracer;

public TaskResponse create(CreateTaskRequest request) {
    Span span = tracer.spanBuilder("task.create").startSpan();
    try (var scope = span.makeCurrent()) {
        span.setAttribute("task.title", request.title());
        return doCreate(request);
    } finally {
        span.end();
    }
}
```

---

## Step 5 — Verify the fix

Run tests and confirm no regressions:

```bash
./gradlew test
```

Compare metrics before and after using the actuator or Grafana dashboard.

---

## Output summary

```
## Problem identified
[what was slow and why]

## Fix applied
[what changed and why it helps]

## Metrics / evidence
[before/after query count or response time]

## Files modified
- [file path] — what changed

## Verify
./gradlew test — PASSED
```
