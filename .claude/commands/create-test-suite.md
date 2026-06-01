---
description: "Create a complete test suite for an existing feature: unit tests, controller slice tests, and integration tests"
---

Create a complete test suite for an existing feature in this Spring Boot project.

Steps:
1. Ask which feature or class to test if not specified.
2. Read the target service, controller, and domain classes fully before writing any test.
3. Use Glob to find any existing tests — do not duplicate them.
4. Write in this order:

   **Unit tests** (src/test/java/):
   - @ExtendWith(MockitoExtension.class) for service tests
   - Cover: happy path, all error cases, all business rule branches
   - Use AssertJ for assertions — no JUnit assertEquals

   **Controller slice tests** (src/test/java/):
   - @WebMvcTest for each controller
   - Cover: correct status codes, response JSON shape, validation rejection (400), not found (404)

   **Integration test** (src/integrationTest/java/):
   - @SpringBootTest + Testcontainers PostgreSQL
   - Cover: full HTTP → DB → HTTP cycle for the main flows

5. Run ./gradlew test and ./gradlew integrationTest. Fix all failures.

Test naming: method names describe observable behaviour, e.g.:
  create_task_returns_201_with_location_header
  create_task_with_blank_title_returns_400
  find_task_by_unknown_id_returns_404
