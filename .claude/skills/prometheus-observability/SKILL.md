---
name: prometheus-observability
description: >
  Add or improve Prometheus/Micrometer observability to the Spring Boot project.
  Use when adding custom business metrics, reviewing the Prometheus scrape output,
  configuring Grafana dashboards, or verifying that actuator endpoints are correctly exposed.
---

# Skill: prometheus-observability

## Actuator and Prometheus setup

Verify these properties are set in application.properties:
```properties
management.endpoints.web.exposure.include=health,metrics,prometheus
management.endpoint.health.show-details=always
management.metrics.export.prometheus.enabled=true
```

Verify the scrape endpoint:
```bash
curl -s http://localhost:8080/actuator/prometheus | head -40
```

## Custom business counter

```java
Counter.builder("tasks.created.total")
    .description("Total number of tasks created")
    .tag("priority", request.priority().name())
    .register(meterRegistry)
    .increment();
```

## Custom business timer

```java
Timer.builder("tasks.list.duration")
    .description("Time to list all tasks")
    .publishPercentiles(0.5, 0.95, 0.99)
    .register(meterRegistry)
    .record(() -> taskRepository.findAll());
```

## Grafana dashboard conventions

- Dashboard JSON files live in observability/dashboards/.
- Use variables for datasource and environment.
- Panels: request rate (rate[5m]), error rate, p50/p95/p99 latency, JVM memory, DB pool.

## Docker Compose (local observability stack)

```bash
docker compose up -d          # starts Prometheus + Grafana
open http://localhost:3000    # Grafana (admin/admin)
open http://localhost:9090    # Prometheus
```

## Rules

- Always check if a metric already exists before creating a new one.
- Use tags to add dimensions — avoid creating separate metrics for small variations.
- Never use high-cardinality values (user IDs, UUIDs) as tag values.
