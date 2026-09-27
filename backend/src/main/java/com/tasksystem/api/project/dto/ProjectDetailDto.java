package com.tasksystem.api.project.dto;

import com.tasksystem.api.issue.dto.IssueDto;

import java.time.Instant;
import java.util.List;

/**
 * Single-project response. Carries the same statistics as {@link ProjectDto}
 * plus the project's issues, which the detail view renders inline.
 */
public record ProjectDetailDto(
        Long id,
        String shortName,
        String name,
        String description,
        Long ownerId,
        Instant createdAt,
        long totalIssues,
        long issueCount,
        long doneIssues,
        long todoIssues,
        long inProgressIssues,
        int progress,
        long lowPriority,
        long normalPriority,
        long highPriority,
        long criticalPriority,
        List<IssueDto> issues
) {

    public static ProjectDetailDto of(ProjectDto project, List<IssueDto> issues) {
        return new ProjectDetailDto(
                project.id(),
                project.shortName(),
                project.name(),
                project.description(),
                project.ownerId(),
                project.createdAt(),
                project.totalIssues(),
                project.issueCount(),
                project.doneIssues(),
                project.todoIssues(),
                project.inProgressIssues(),
                project.progress(),
                project.lowPriority(),
                project.normalPriority(),
                project.highPriority(),
                project.criticalPriority(),
                issues
        );
    }
}
