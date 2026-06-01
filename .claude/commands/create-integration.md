---
description: "Add an integration: outbound REST client, scheduled job, or async processor"
---

Add an integration capability to this Spring Boot project.

Steps:
1. Clarify the integration type: outbound REST client, scheduled job, or async processing.
2. Read CLAUDE.md and existing adapters/clients to avoid duplication.
3. Implement following the project conventions:
   - Outbound REST client: use Spring RestClient with configurable base URL and timeouts.
   - Scheduled job: use @Scheduled with cron expression, idempotent execution.
   - Async processing: use @Async with CompletableFuture, separate thread pool.
4. Place integration code in an adapter package — never in domain or service layer.
5. Write unit tests using Mockito or WireMock — never make real network calls in tests.
6. Add configuration properties to application.properties with sensible defaults.
7. Run ./gradlew test. Fix all failures before finishing.

Rules:
- Always set connect and read timeouts on HTTP clients.
- Log outbound failures at WARN level with the URL and status.
- Scheduled jobs must be idempotent.
