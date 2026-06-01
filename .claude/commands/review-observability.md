---
description: "Review and improve observability: Micrometer metrics, OTEL spans, logging, and Prometheus output"
---

Review and improve observability for this Spring Boot project.

Steps:
1. Read CLAUDE.md for observability conventions.
2. Check what is already instrumented: Grep for MeterRegistry, Counter, Timer, @Timed, Tracer.
3. Curl the actuator endpoints to see what is currently exposed:
   - http://localhost:8080/actuator/health
   - http://localhost:8080/actuator/prometheus
4. For each service method that represents a key business event, verify:
   - A Micrometer counter or timer exists
   - An OTEL span is created for slow or critical paths
   - Log messages are present at key decision points
5. Identify gaps and implement missing instrumentation following the patterns in CLAUDE.md.
6. Verify the new metrics appear in the Prometheus scrape output.
7. Run ./gradlew test to confirm no regressions.

Output:
- Current observability gaps identified
- Instrumentation added (counter/timer/span for each)
- Prometheus metric names added
- How to verify in Grafana
