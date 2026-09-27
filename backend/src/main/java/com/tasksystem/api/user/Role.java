package com.tasksystem.api.user;

public enum Role {
    ROLE_USER,
    ROLE_ADMIN;

    /**
     * Accepts both "ADMIN" (sent by the role-change dialog) and "ROLE_ADMIN".
     */
    public static Role parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Role must not be blank");
        }
        String normalized = raw.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        return Role.valueOf(normalized);
    }
}
