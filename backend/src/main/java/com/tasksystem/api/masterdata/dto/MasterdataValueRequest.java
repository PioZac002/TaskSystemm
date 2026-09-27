package com.tasksystem.api.masterdata.dto;

/**
 * Upsert request sent by the frontend:
 * {@code { order, value, code, type, isActive, delete }}.
 * {@code delete: true} deactivates the value.
 */
public record MasterdataValueRequest(
        Integer order,
        String value,
        String code,
        String type,
        Boolean isActive,
        Boolean delete
) {
}
