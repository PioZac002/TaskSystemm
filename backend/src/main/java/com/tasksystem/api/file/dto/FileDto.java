package com.tasksystem.api.file.dto;

import com.tasksystem.api.file.StoredFile;

import java.time.Instant;

public record FileDto(
        Long id,
        String fileName,
        String contentType,
        long size,
        Long commentId,
        Long issueId,
        Instant createdAt
) {

    public static FileDto from(StoredFile file) {
        return new FileDto(
                file.getId(),
                file.getFileName(),
                file.getContentType(),
                file.getSizeBytes(),
                file.getCommentId(),
                file.getIssueId(),
                file.getCreatedAt()
        );
    }
}
