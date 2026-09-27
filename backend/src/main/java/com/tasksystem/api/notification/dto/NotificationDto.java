package com.tasksystem.api.notification.dto;

import com.tasksystem.api.notification.Notification;

import java.time.Instant;
import java.util.Map;

public record NotificationDto(
        Long id,
        Long userId,
        Long eventAuthorId,
        Long issueId,
        String key,
        String type,
        boolean isRead,
        Instant createdAt,
        Map<String, Object> properties
) {

    public static NotificationDto from(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getUserId(),
                notification.getEventAuthorId(),
                notification.getIssueId(),
                notification.getIssueKey(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt(),
                Map.of()
        );
    }
}
