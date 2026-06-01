---
name: junit-testing
description: >
  Write or improve JUnit 5 tests for the Spring Boot project.
  Use when adding test coverage, fixing flaky tests, or establishing testing patterns
  for a new layer or component.
---

# Skill: junit-testing

## Test structure

Every test class follows Arrange → Act → Assert:
```java
@Test
void create_task_returns_response_with_correct_title() {
    // Arrange
    var request = new CreateTaskRequest("Buy groceries", Priority.HIGH);
    when(repository.save(any())).thenReturn(savedTask());

    // Act
    var response = service.create(request);

    // Assert
    assertThat(response.title()).isEqualTo("Buy groceries");
    assertThat(response.priority()).isEqualTo(Priority.HIGH);
}
```

## Service unit tests

```java
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock TaskRepository repository;
    @InjectMocks TaskService service;
}
```

Cover: happy path, each error case, each business rule branch.

## Controller slice tests

```java
@WebMvcTest(TaskController.class)
class TaskControllerTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean TaskService service;

    @Test
    void create_task_returns_201() throws Exception {
        mockMvc.perform(post("/tasks")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Buy groceries"));
    }
}
```

## Test naming

Method names describe observable behaviour:
- create_task_returns_201_with_location_header
- create_task_with_blank_title_returns_400
- find_task_by_unknown_id_returns_404

## AssertJ patterns

```java
assertThat(response).isNotNull();
assertThat(response.title()).isEqualTo("Buy groceries");
assertThat(list).hasSize(2).extracting(TaskResponse::status).containsOnly(OPEN);
assertThatThrownBy(() -> service.find(99L)).isInstanceOf(TaskNotFoundException.class);
```

## Rules

- Test behaviour, not implementation details.
- Never modify an existing test to make it pass — fix the implementation.
- No Thread.sleep — use Awaitility for async.
- No System.out.println in tests.
- Run ./gradlew test before finishing.
