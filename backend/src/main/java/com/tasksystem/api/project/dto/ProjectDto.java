package com.tasksystem.api.project.dto;

import java.time.Instant;

/**
 * Project enriched with issue statistics consumed by the dashboard and project cards.
 */
public record ProjectDto(
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
        long criticalPriority
) {
}
