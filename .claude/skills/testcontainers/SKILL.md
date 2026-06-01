---
name: testcontainers
description: >
  Set up or extend Testcontainers-based integration tests for the Spring Boot project.
  Use when writing a test that requires a real PostgreSQL database, validating Flyway migrations,
  or testing a full HTTP → DB → HTTP cycle.
---

# Skill: testcontainers

## Setup

Integration tests live in src/integrationTest/java/.
Run with: ./gradlew integrationTest (requires Docker).

## Base test class pattern

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@AutoConfigureMockMvc
abstract class AbstractIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("taskdb")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

Extend this class in all integration tests to share the container across the test suite.

## Integration test pattern

```java
class TaskIntegrationTest extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired TaskRepository repository;

    @BeforeEach
    void setUp() { repository.deleteAll(); }

    @Test
    void create_and_retrieve_task() throws Exception {
        var createResponse = mockMvc.perform(post("/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new CreateTaskRequest("Test", Priority.HIGH))))
            .andExpect(status().isCreated())
            .andReturn();

        var location = createResponse.getResponse().getHeader("Location");

        mockMvc.perform(get(location))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Test"));
    }
}
```

## Flyway validation

Testcontainers tests validate Flyway migrations automatically on context startup.
If a migration has a syntax error incompatible with PostgreSQL, the test will fail here.

## Rules

- Always use a static container — do not start a new container per test.
- Clean the database in @BeforeEach, not @AfterEach (leave state for debugging).
- Never connect to the H2 database in integration tests — always use the container.
