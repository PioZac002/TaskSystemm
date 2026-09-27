package com.tasksystem.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminResetPasswordRequest(
        @NotNull Long userId,
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
) {
}
