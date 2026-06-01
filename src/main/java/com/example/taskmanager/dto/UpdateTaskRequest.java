package com.example.taskmanager.dto;

import com.example.taskmanager.domain.TaskPriority;
import com.example.taskmanager.domain.TaskStatus;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateTaskRequest(
        @Size(max = 255) String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate) {}
