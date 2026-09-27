package com.tasksystem.api.auth.dto;

/**
 * Tells the frontend whether the "Try the demo" button should be shown,
 * and which account it signs in as.
 */
public record DemoStatus(boolean available, String email) {
}
