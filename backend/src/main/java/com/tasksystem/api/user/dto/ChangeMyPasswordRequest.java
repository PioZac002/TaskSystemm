package com.tasksystem.api.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangeMyPasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
) {
}
