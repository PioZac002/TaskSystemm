package com.tasksystem.api.issue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateIssueRequest(
        @NotBlank String title,
        String description,
        String priority,
        Long authorId,
        Long assigneeId,
        LocalDate dueDate,
        @NotNull Long projectId
) {
}
