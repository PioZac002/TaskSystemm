package com.tasksystem.api.issue.activity;

import java.time.Instant;
import java.time.LocalDate;

public record ActivityDto(
        Long id,
        Long issueId,
        String activityType,
        Long eventAuthorUserId,
        Instant timestamp,
        String oldValue,
        String newValue,
        String oldStatus,
        String newStatus,
        String oldPriority,
        String newPriority,
        Long oldTeamId,
        Long newTeamId,
        LocalDate oldDateTime,
        LocalDate newDateTime
) {

    public static ActivityDto from(IssueActivity activity) {
        return new ActivityDto(
                activity.getId(),
                activity.getIssueId(),
                activity.getActivityType().name(),
                activity.getEventAuthorUserId(),
                activity.getTimestamp(),
                activity.getOldValue(),
                activity.getNewValue(),
                activity.getOldStatus(),
                activity.getNewStatus(),
                activity.getOldPriority(),
                activity.getNewPriority(),
                activity.getOldTeamId(),
                activity.getNewTeamId(),
                activity.getOldDateTime(),
                activity.getNewDateTime()
        );
    }
}
