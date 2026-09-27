package com.tasksystem.api.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCommentRequest(
        @NotNull Long issueId,
        @NotBlank String content,
        Long authorId
) {
}
