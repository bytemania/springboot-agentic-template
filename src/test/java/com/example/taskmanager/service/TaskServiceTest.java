package com.example.taskmanager.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.taskmanager.domain.Task;
import com.example.taskmanager.domain.TaskPriority;
import com.example.taskmanager.domain.TaskStatus;
import com.example.taskmanager.dto.CreateTaskRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.dto.UpdateTaskRequest;
import com.example.taskmanager.exception.TaskNotFoundException;
import com.example.taskmanager.repository.TaskRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    private MeterRegistry meterRegistry;
    private TaskService taskService;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        taskService = new TaskService(taskRepository, meterRegistry);
    }

    private Task buildTask(Long id, String title, TaskStatus status, TaskPriority priority) {
        Task task = new Task();
        task.setId(id);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(priority);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        return task;
    }

    @Test
    void createTask_persistsAndReturnsResponse() {
        CreateTaskRequest request = new CreateTaskRequest("Buy groceries", null, TaskPriority.HIGH, null);

        Task saved = buildTask(1L, "Buy groceries", TaskStatus.TODO, TaskPriority.HIGH);
        when(taskRepository.save(any(Task.class))).thenReturn(saved);

        TaskResponse response = taskService.createTask(request);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.title()).isEqualTo("Buy groceries");
        assertThat(response.status()).isEqualTo(TaskStatus.TODO);
        assertThat(response.priority()).isEqualTo(TaskPriority.HIGH);
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void createTask_defaultsPriorityToMediumWhenNull() {
        CreateTaskRequest request = new CreateTaskRequest("Task", null, null, null);
        Task saved = buildTask(2L, "Task", TaskStatus.TODO, TaskPriority.MEDIUM);
        when(taskRepository.save(any(Task.class))).thenReturn(saved);

        TaskResponse response = taskService.createTask(request);

        assertThat(response.priority()).isEqualTo(TaskPriority.MEDIUM);
    }

    @Test
    void createTask_incrementsCounter() {
        CreateTaskRequest request = new CreateTaskRequest("T", null, TaskPriority.LOW, null);
        Task saved = buildTask(3L, "T", TaskStatus.TODO, TaskPriority.LOW);
        when(taskRepository.save(any(Task.class))).thenReturn(saved);

        taskService.createTask(request);

        double count = meterRegistry.counter("tasks.created", "priority", "LOW").count();
        assertThat(count).isEqualTo(1.0);
    }

    @Test
    void getAllTasks_noFilters_returnsAll() {
        List<Task> tasks = List.of(
                buildTask(1L, "A", TaskStatus.TODO, TaskPriority.LOW),
                buildTask(2L, "B", TaskStatus.DONE, TaskPriority.HIGH));
        when(taskRepository.findAll()).thenReturn(tasks);

        List<TaskResponse> result = taskService.getAllTasks(null, null);

        assertThat(result).hasSize(2);
    }

    @Test
    void getAllTasks_filterByStatus_delegatesToRepository() {
        when(taskRepository.findByStatus(TaskStatus.TODO))
                .thenReturn(List.of(buildTask(1L, "A", TaskStatus.TODO, TaskPriority.LOW)));

        List<TaskResponse> result = taskService.getAllTasks(TaskStatus.TODO, null);

        assertThat(result).hasSize(1);
        verify(taskRepository).findByStatus(TaskStatus.TODO);
    }

    @Test
    void getAllTasks_filterByPriority_delegatesToRepository() {
        when(taskRepository.findByPriority(TaskPriority.HIGH))
                .thenReturn(List.of(buildTask(1L, "A", TaskStatus.TODO, TaskPriority.HIGH)));

        List<TaskResponse> result = taskService.getAllTasks(null, TaskPriority.HIGH);

        assertThat(result).hasSize(1);
        verify(taskRepository).findByPriority(TaskPriority.HIGH);
    }

    @Test
    void getAllTasks_filterByStatusAndPriority_delegatesToRepository() {
        when(taskRepository.findByStatusAndPriority(TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM))
                .thenReturn(List.of(buildTask(1L, "A", TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM)));

        List<TaskResponse> result = taskService.getAllTasks(TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM);

        assertThat(result).hasSize(1);
        verify(taskRepository).findByStatusAndPriority(TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM);
    }

    @Test
    void getTaskById_found_returnsResponse() {
        Task task = buildTask(5L, "My Task", TaskStatus.TODO, TaskPriority.MEDIUM);
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.getTaskById(5L);

        assertThat(response.id()).isEqualTo(5L);
        assertThat(response.title()).isEqualTo("My Task");
    }

    @Test
    void getTaskById_notFound_throwsTaskNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(99L))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateTask_partialUpdate_onlyUpdatesNonNullFields() {
        Task task = buildTask(1L, "Old Title", TaskStatus.TODO, TaskPriority.LOW);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        UpdateTaskRequest request = new UpdateTaskRequest(null, "New description", TaskStatus.IN_PROGRESS, null, null);

        TaskResponse response = taskService.updateTask(1L, request);

        assertThat(response.title()).isEqualTo("Old Title");
        assertThat(response.description()).isEqualTo("New description");
        assertThat(response.status()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(response.priority()).isEqualTo(TaskPriority.LOW);
    }

    @Test
    void updateTask_notFound_throwsTaskNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(99L, new UpdateTaskRequest("T", null, null, null, null)))
                .isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void deleteTask_exists_deletesAndIncrementsCounter() {
        when(taskRepository.existsById(1L)).thenReturn(true);

        taskService.deleteTask(1L);

        verify(taskRepository).deleteById(1L);
        assertThat(meterRegistry.counter("tasks.deleted").count()).isEqualTo(1.0);
    }

    @Test
    void deleteTask_notFound_throwsTaskNotFoundException() {
        when(taskRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.deleteTask(99L))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void addTag_addsTagToTask() {
        Task task = buildTask(1L, "Task", TaskStatus.TODO, TaskPriority.MEDIUM);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.addTag(1L, "urgent");

        assertThat(response.tags()).contains("urgent");
    }

    @Test
    void removeTag_removesTagFromTask() {
        Task task = buildTask(1L, "Task", TaskStatus.TODO, TaskPriority.MEDIUM);
        task.getTags().add("urgent");
        task.getTags().add("backend");
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.removeTag(1L, "urgent");

        assertThat(response.tags()).doesNotContain("urgent");
        assertThat(response.tags()).contains("backend");
    }

    @Test
    void addTag_taskNotFound_throwsTaskNotFoundException() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.addTag(99L, "tag")).isInstanceOf(TaskNotFoundException.class);
    }

    @Test
    void updateTask_updatesTitle_whenProvided() {
        Task task = buildTask(1L, "Old", TaskStatus.TODO, TaskPriority.LOW);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.updateTask(1L, new UpdateTaskRequest("New Title", null, null, null, null));

        assertThat(response.title()).isEqualTo("New Title");
    }

    @Test
    void updateTask_updatesDueDate_whenProvided() {
        Task task = buildTask(1L, "T", TaskStatus.TODO, TaskPriority.LOW);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));

        LocalDate due = LocalDate.of(2026, 12, 31);
        TaskResponse response = taskService.updateTask(1L, new UpdateTaskRequest(null, null, null, null, due));

        assertThat(response.dueDate()).isEqualTo(due);
    }
}
