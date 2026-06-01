package com.example.taskmanager;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.taskmanager.domain.TaskPriority;
import com.example.taskmanager.domain.TaskStatus;
import com.example.taskmanager.dto.AddTagRequest;
import com.example.taskmanager.dto.CreateTaskRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.dto.UpdateTaskRequest;
import com.example.taskmanager.repository.TaskRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class TaskIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.PostgreSQLDialect");
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
    }

    @Test
    void create_task_returns_201_with_body() {
        CreateTaskRequest request = new CreateTaskRequest("Integration Task", "desc", TaskPriority.HIGH, null);

        ResponseEntity<TaskResponse> response = restTemplate.postForEntity("/tasks", request, TaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().title()).isEqualTo("Integration Task");
        assertThat(response.getBody().status()).isEqualTo(TaskStatus.TODO);
        assertThat(response.getBody().priority()).isEqualTo(TaskPriority.HIGH);
        assertThat(response.getBody().id()).isNotNull();
    }

    @Test
    void list_tasks_returns_all_created_tasks() {
        restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Task A", null, TaskPriority.LOW, null), TaskResponse.class);
        restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Task B", null, TaskPriority.MEDIUM, null), TaskResponse.class);

        ResponseEntity<List<TaskResponse>> response = restTemplate.exchange(
                "/tasks", HttpMethod.GET, null, new ParameterizedTypeReference<List<TaskResponse>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
    }

    @Test
    void get_task_by_id_returns_correct_fields() {
        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks",
                new CreateTaskRequest("Get By ID", "some desc", TaskPriority.MEDIUM, null),
                TaskResponse.class);
        Long id = created.getBody().id();

        ResponseEntity<TaskResponse> response = restTemplate.getForEntity("/tasks/" + id, TaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().title()).isEqualTo("Get By ID");
        assertThat(response.getBody().description()).isEqualTo("some desc");
    }

    @Test
    void update_task_changes_specified_fields() {
        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Original Title", null, TaskPriority.LOW, null), TaskResponse.class);
        Long id = created.getBody().id();

        UpdateTaskRequest update =
                new UpdateTaskRequest("Updated Title", "new desc", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, null);

        ResponseEntity<TaskResponse> response =
                restTemplate.exchange("/tasks/" + id, HttpMethod.PATCH, new HttpEntity<>(update), TaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().title()).isEqualTo("Updated Title");
        assertThat(response.getBody().description()).isEqualTo("new desc");
        assertThat(response.getBody().status()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(response.getBody().priority()).isEqualTo(TaskPriority.HIGH);
    }

    @Test
    void filter_by_status_returns_only_matching_tasks() {
        restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Todo Task", null, TaskPriority.LOW, null), TaskResponse.class);

        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Progress Task", null, TaskPriority.LOW, null), TaskResponse.class);
        Long id = created.getBody().id();
        restTemplate.exchange(
                "/tasks/" + id,
                HttpMethod.PATCH,
                new HttpEntity<>(new UpdateTaskRequest(null, null, TaskStatus.IN_PROGRESS, null, null)),
                TaskResponse.class);

        ResponseEntity<List<TaskResponse>> response = restTemplate.exchange(
                "/tasks?status=IN_PROGRESS",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<TaskResponse>>() {});

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).status()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    void add_tag_and_get_returns_tag_in_response() {
        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Tagged Task", null, TaskPriority.MEDIUM, null), TaskResponse.class);
        Long id = created.getBody().id();

        ResponseEntity<TaskResponse> tagResponse =
                restTemplate.postForEntity("/tasks/" + id + "/tags", new AddTagRequest("urgent"), TaskResponse.class);

        assertThat(tagResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(tagResponse.getBody().tags()).contains("urgent");

        ResponseEntity<TaskResponse> getResponse = restTemplate.getForEntity("/tasks/" + id, TaskResponse.class);
        assertThat(getResponse.getBody().tags()).contains("urgent");
    }

    @Test
    void delete_task_returns_204_then_404_on_get() {
        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("To Delete", null, TaskPriority.LOW, null), TaskResponse.class);
        Long id = created.getBody().id();

        ResponseEntity<Void> deleteResponse =
                restTemplate.exchange("/tasks/" + id, HttpMethod.DELETE, null, Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> getResponse = restTemplate.getForEntity("/tasks/" + id, String.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void get_unknown_task_id_returns_404() {
        ResponseEntity<String> response = restTemplate.getForEntity("/tasks/99999", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void replace_task_replaces_all_fields() {
        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Original", "old desc", TaskPriority.LOW, null), TaskResponse.class);
        Long id = created.getBody().id();

        CreateTaskRequest replacement = new CreateTaskRequest("Replaced", "new desc", TaskPriority.URGENT, null);
        ResponseEntity<TaskResponse> response = restTemplate.exchange(
                "/tasks/" + id, HttpMethod.PUT, new HttpEntity<>(replacement), TaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().title()).isEqualTo("Replaced");
        assertThat(response.getBody().description()).isEqualTo("new desc");
        assertThat(response.getBody().priority()).isEqualTo(TaskPriority.URGENT);
        assertThat(response.getBody().status()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    void update_task_status_changes_only_status() {
        ResponseEntity<TaskResponse> created = restTemplate.postForEntity(
                "/tasks", new CreateTaskRequest("Status Test", null, TaskPriority.MEDIUM, null), TaskResponse.class);
        Long id = created.getBody().id();

        ResponseEntity<TaskResponse> response = restTemplate.exchange(
                "/tasks/" + id + "/status",
                HttpMethod.PATCH,
                new HttpEntity<>(new com.example.taskmanager.dto.StatusUpdateRequest(TaskStatus.CANCELLED)),
                TaskResponse.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().status()).isEqualTo(TaskStatus.CANCELLED);
        assertThat(response.getBody().title()).isEqualTo("Status Test");
    }
}
