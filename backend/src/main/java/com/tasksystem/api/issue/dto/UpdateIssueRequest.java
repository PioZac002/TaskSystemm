package com.tasksystem.api.issue.dto;

import com.tasksystem.api.masterdata.dto.MasterdataValueRequest;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Full update sent by the frontend (both camelCase and PascalCase keys are
 * accepted thanks to case-insensitive property mapping). Null fields are
 * treated as "no change", except labels: a non-null {@code masterDataValues}
 * replaces the issue's label set.
 */
public record UpdateIssueRequest(
        @NotNull Long issueId,
        String title,
        String description,
        String status,
        String priority,
        Long teamId,
        Long projectId,
        LocalDate dueDate,
        Long assigneeId,
        java.util.List<MasterdataValueRequest> masterDataValues
) {
}
