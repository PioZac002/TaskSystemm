package com.tasksystem.api.issue.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * Small single-field mutation payloads used by the dedicated PUT endpoints.
 */
public final class IssueFieldRequests {

    private IssueFieldRequests() {
    }

    public record Assign(@NotNull Long issueId, Long assigneeId, Long userId) {

        public Long effectiveAssigneeId() {
            return assigneeId != null ? assigneeId : userId;
        }
    }

    public record Rename(@NotNull Long issueId, @NotBlank String title) {
    }

    public record AssignTeam(@NotNull Long issueId, Long teamId) {
    }

    public record UpdateStatus(@NotNull Long issueId, @NotBlank String status) {
    }

    public record UpdatePriority(@NotNull Long issueId, @NotBlank String priority) {
    }

    public record UpdateDueDate(@NotNull Long issueId, LocalDate dueDate) {
    }
}
