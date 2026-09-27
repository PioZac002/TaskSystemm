package com.tasksystem.api.issue;

import com.tasksystem.api.common.error.ApiException;

import java.util.Locale;

public enum IssuePriority {
    LOW,
    NORMAL,
    HIGH,
    CRITICAL;

    public static IssuePriority parse(String raw) {
        try {
            return IssuePriority.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException e) {
            throw ApiException.badRequest("Unknown issue priority: " + raw);
        }
    }
}
