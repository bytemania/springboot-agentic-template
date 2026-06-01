package com.example.taskmanager.service;

import com.example.taskmanager.domain.Task;
import com.example.taskmanager.domain.TaskPriority;
import com.example.taskmanager.domain.TaskStatus;
import com.example.taskmanager.dto.CreateTaskRequest;
import com.example.taskmanager.dto.StatusUpdateRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.dto.UpdateTaskRequest;
import com.example.taskmanager.exception.TaskNotFoundException;
import com.example.taskmanager.repository.TaskRepository;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final MeterRegistry meterRegistry;
    private final Timer getByIdTimer;
    private final Counter tagsAddedCounter;
    private final Counter tagsRemovedCounter;

    public TaskService(TaskRepository taskRepository, MeterRegistry meterRegistry) {
        this.taskRepository = taskRepository;
        this.meterRegistry = meterRegistry;
        this.getByIdTimer = Timer.builder("tasks.getById.duration")
                .description("Time to fetch a single task by ID")
                .register(meterRegistry);
        this.tagsAddedCounter = Counter.builder("tasks.tags.added")
                .description("Number of tags added to tasks")
                .register(meterRegistry);
        this.tagsRemovedCounter = Counter.builder("tasks.tags.removed")
                .description("Number of tags removed from tasks")
                .register(meterRegistry);
    }

    public TaskResponse createTask(CreateTaskRequest request) {
        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM);
        task.setDueDate(request.dueDate());
        task.setStatus(TaskStatus.TODO);

        Task saved = taskRepository.save(task);

        meterRegistry
                .counter("tasks.created", "priority", saved.getPriority().name())
                .increment();

        return toResponse(saved);
    }

    public List<TaskResponse> getAllTasks(TaskStatus status, TaskPriority priority) {
        Timer.Sample sample = Timer.start(meterRegistry);

        List<Task> tasks;
        if (status != null && priority != null) {
            tasks = taskRepository.findByStatusAndPriority(status, priority);
        } else if (status != null) {
            tasks = taskRepository.findByStatus(status);
        } else if (priority != null) {
            tasks = taskRepository.findByPriority(priority);
        } else {
            tasks = taskRepository.findAll();
        }

        sample.stop(meterRegistry.timer("tasks.list.duration"));

        return tasks.stream().map(this::toResponse).toList();
    }

    public TaskResponse getTaskById(Long id) {
        return getByIdTimer.record(() -> {
            Task task = taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
            return toResponse(task);
        });
    }

    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));

        if (request.title() != null) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }

        return toResponse(task);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException(id);
        }
        taskRepository.deleteById(id);
        meterRegistry.counter("tasks.deleted").increment();
    }

    @Transactional
    public TaskResponse addTag(Long id, String tag) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
        task.getTags().add(tag);
        tagsAddedCounter.increment();
        return toResponse(task);
    }

    @Transactional
    public TaskResponse removeTag(Long id, String tag) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
        task.getTags().remove(tag);
        tagsRemovedCounter.increment();
        return toResponse(task);
    }

    @Transactional
    public TaskResponse replaceTask(Long id, CreateTaskRequest request) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setPriority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM);
        task.setDueDate(request.dueDate());
        task.setStatus(TaskStatus.TODO);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, StatusUpdateRequest request) {
        Task task = taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
        task.setStatus(request.status());
        return toResponse(task);
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                Set.copyOf(task.getTags()));
    }
}
