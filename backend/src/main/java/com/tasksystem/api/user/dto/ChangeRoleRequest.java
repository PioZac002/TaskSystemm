package com.tasksystem.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ChangeRoleRequest(
        @NotNull Long userId,
        @NotBlank String role
) {
}
