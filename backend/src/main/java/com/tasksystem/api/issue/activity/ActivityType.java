package com.tasksystem.api.issue.activity;

/**
 * Values consumed directly by the frontend activity log.
 */
public enum ActivityType {
    CREATED_ISSUE,
    CREATED_COMMENT,
    UPDATED_ASSIGNEE,
    UPDATED_PRIORITY,
    UPDATED_STATUS,
    UPDATED_TEAM,
    UPDATED_DUEDATE,
    UPDATED_TITLE,
    UPDATED_DESCRIPTION
}
