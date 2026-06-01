package com.example.taskmanager.dto;

import com.example.taskmanager.domain.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(@NotNull TaskStatus status) {}
