package com.tasksystem.api.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateProjectRequest(
        @NotBlank @Pattern(regexp = "[A-Z]{6}", message = "Short name must be exactly 6 uppercase letters") String shortName,
        String name,
        String description
) {
}
