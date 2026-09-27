package com.tasksystem.api.issue.dto;

import com.tasksystem.api.issue.Issue;
import com.tasksystem.api.masterdata.dto.MasterdataValueDto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

public record IssueDto(
        Long id,
        String key,
        String title,
        String description,
        String status,
        String priority,
        Long authorId,
        Long assigneeId,
        Long projectId,
        Long teamId,
        TeamRef team,
        LocalDate dueDate,
        Instant createdAt,
        Instant updatedAt,
        List<MasterdataValueDto> labels,
        List<Long> attachmentIds
) {

    /** The frontend reads both {@code issue.teamId} and {@code issue.team.id}. */
    public record TeamRef(Long id, String name) {
    }

    public static IssueDto from(Issue issue, List<Long> attachmentIds) {
        TeamRef teamRef = issue.getTeam() != null
                ? new TeamRef(issue.getTeam().getId(), issue.getTeam().getName())
                : null;

        List<MasterdataValueDto> labels = issue.getLabels().stream()
                .sorted(Comparator.comparingInt(com.tasksystem.api.masterdata.MasterdataValue::getSortOrder))
                .map(MasterdataValueDto::from)
                .toList();

        return new IssueDto(
                issue.getId(),
                issue.getKey(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getStatus().name(),
                issue.getPriority().name(),
                issue.getAuthorId(),
                issue.getAssigneeId(),
                issue.getProject().getId(),
                teamRef != null ? teamRef.id() : null,
                teamRef,
                issue.getDueDate(),
                issue.getCreatedAt(),
                issue.getUpdatedAt(),
                labels,
                attachmentIds
        );
    }
}
