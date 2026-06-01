package com.example.taskmanager.controller;

import com.example.taskmanager.domain.TaskPriority;
import com.example.taskmanager.domain.TaskStatus;
import com.example.taskmanager.dto.AddTagRequest;
import com.example.taskmanager.dto.CreateTaskRequest;
import com.example.taskmanager.dto.StatusUpdateRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.dto.UpdateTaskRequest;
import com.example.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/tasks")
@Validated
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody CreateTaskRequest request) {
        TaskResponse response = taskService.createTask(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(
            @RequestParam(required = false) TaskStatus status, @RequestParam(required = false) TaskPriority priority) {
        return ResponseEntity.ok(taskService.getAllTasks(status, priority));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id, @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> replaceTask(
            @PathVariable Long id, @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.replaceTask(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/tags")
    public ResponseEntity<TaskResponse> addTag(@PathVariable Long id, @Valid @RequestBody AddTagRequest request) {
        return ResponseEntity.ok(taskService.addTag(id, request.tag()));
    }

    @DeleteMapping("/{id}/tags/{tag}")
    public ResponseEntity<TaskResponse> removeTag(@PathVariable Long id, @PathVariable String tag) {
        return ResponseEntity.ok(taskService.removeTag(id, tag));
    }
}
