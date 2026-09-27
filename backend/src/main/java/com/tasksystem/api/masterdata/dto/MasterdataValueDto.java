package com.tasksystem.api.masterdata.dto;

import com.tasksystem.api.masterdata.MasterdataValue;

/**
 * Exposes both {@code value} and {@code name} because the frontend
 * normalizer reads either one interchangeably.
 */
public record MasterdataValueDto(
        Long id,
        String type,
        String code,
        String value,
        String name,
        int order,
        String color,
        boolean isActive
) {

    public static MasterdataValueDto from(MasterdataValue entity) {
        return new MasterdataValueDto(
                entity.getId(),
                entity.getType(),
                entity.getCode(),
                entity.getValue(),
                entity.getValue(),
                entity.getSortOrder(),
                entity.getColor(),
                entity.isActive()
        );
    }
}
