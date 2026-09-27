package com.tasksystem.api.issue;

import com.tasksystem.api.common.error.ApiException;

import java.util.Locale;

public enum IssueStatus {
    NEW,
    TRIAGE,
    TODO,
    IN_PROGRESS,
    WAITING_FOR_TEAM,
    CODE_REVIEW,
    DONE,
    CANCELED;

    public static IssueStatus parse(String raw) {
        try {
            return IssueStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw ApiException.badRequest("Unknown issue status: " + raw);
        }
    }
}
