---
name: integration-patterns
description: >
  Add integration capabilities to the Spring Boot project: REST client calls, event publishing,
  scheduled jobs, or async processing. Use when a feature requires calling an external API,
  publishing a domain event, or running a background task.
---

# Skill: integration-patterns

Guides adding integration patterns to the project without polluting the domain layer.

## REST client (WebClient / RestClient)

Use Spring's RestClient (Spring Boot 3.2+) for synchronous outbound calls:

```java
@Component
public class NotificationClient {
    private final RestClient restClient;

    public NotificationClient(RestClient.Builder builder,
                              @Value("${notification.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public void notify(String message) {
        restClient.post().uri("/notify")
            .body(new NotifyRequest(message))
            .retrieve()
            .toBodilessEntity();
    }
}
```

## Scheduled jobs

```java
@Component
public class TaskCleanupJob {
    private final TaskService taskService;

    @Scheduled(cron = "0 0 2 * * *")
    public void archiveOldTasks() {
        taskService.archiveCompleted();
    }
}
```

Enable scheduling: @EnableScheduling on your @SpringBootApplication class.

## Async processing

```java
@Async
public CompletableFuture<Void> sendNotification(Long taskId) {
    // runs on a separate thread pool
    return CompletableFuture.completedFuture(null);
}
```

Enable async: @EnableAsync on your @SpringBootApplication class.

## Rules

- External calls always live in adapter classes — never in domain or service layer.
- Always set connect and read timeouts on any HTTP client.
- Log outbound call failures at WARN level with the URL and response status.
- Test HTTP clients with @MockBean or WireMock — never make real network calls in tests.
- Scheduled jobs must be idempotent — assume they can run twice.
