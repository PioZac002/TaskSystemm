package com.tasksystem.api.file;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/**
 * File content stored in the database. Attached either to a comment
 * ({@code commentId}) or directly to an issue ({@code issueId}).
 */
@Entity
@Table(name = "stored_files")
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private long sizeBytes;

    // Plain binary column (bytea on PostgreSQL, VARBINARY on H2). @Lob would map to a
    // PostgreSQL large object (oid), which cannot be read outside a transaction.
    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false, length = 26_214_400)
    private byte[] data;

    private Long commentId;

    private Long issueId;

    @Column(nullable = false)
    private Long uploadedById;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected StoredFile() {
    }

    public StoredFile(String fileName, String contentType, long sizeBytes, byte[] data,
                      Long commentId, Long issueId, Long uploadedById) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.data = data;
        this.commentId = commentId;
        this.issueId = issueId;
        this.uploadedById = uploadedById;
    }

    public Long getId() {
        return id;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public byte[] getData() {
        return data;
    }

    public Long getCommentId() {
        return commentId;
    }

    public Long getIssueId() {
        return issueId;
    }

    public Long getUploadedById() {
        return uploadedById;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
