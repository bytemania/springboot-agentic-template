package com.example.taskmanager.dto;

import com.example.taskmanager.domain.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateTaskRequest(
        @NotBlank @Size(max = 255) String title, String description, TaskPriority priority, LocalDate dueDate) {

    public CreateTaskRequest {
        if (priority == null) {
            priority = TaskPriority.MEDIUM;
        }
    }
}
