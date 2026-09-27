package com.tasksystem.api.comment.dto;

import com.tasksystem.api.comment.Comment;

import java.time.Instant;
import java.util.List;

public record CommentDto(
        Long id,
        Long issueId,
        Long authorId,
        String authorName,
        String content,
        Instant createdAt,
        Instant updatedAt,
        List<Long> attachmentIds
) {

    public static CommentDto from(Comment comment, String authorName, List<Long> attachmentIds) {
        return new CommentDto(
                comment.getId(),
                comment.getIssueId(),
                comment.getAuthorId(),
                authorName,
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                attachmentIds
        );
    }
}
