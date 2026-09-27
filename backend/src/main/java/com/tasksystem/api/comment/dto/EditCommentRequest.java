package com.tasksystem.api.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EditCommentRequest(
        @NotNull Long id,
        @NotBlank String content
) {
}
