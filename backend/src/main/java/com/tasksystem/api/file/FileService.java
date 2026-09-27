package com.tasksystem.api.file;

import com.tasksystem.api.comment.CommentRepository;
import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.common.security.CurrentUserService;
import com.tasksystem.api.file.dto.FileDto;
import com.tasksystem.api.issue.IssueRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@Transactional(readOnly = true)
public class FileService {

    private final StoredFileRepository storedFileRepository;
    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final CurrentUserService currentUserService;

    public FileService(StoredFileRepository storedFileRepository,
                       CommentRepository commentRepository,
                       IssueRepository issueRepository,
                       CurrentUserService currentUserService) {
        this.storedFileRepository = storedFileRepository;
        this.commentRepository = commentRepository;
        this.issueRepository = issueRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional
    public FileDto storeForComment(MultipartFile file, Long commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw ApiException.notFound("Comment not found: " + commentId);
        }
        return FileDto.from(save(file, commentId, null));
    }

    @Transactional
    public FileDto storeForIssue(MultipartFile file, Long issueId) {
        if (!issueRepository.existsById(issueId)) {
            throw ApiException.notFound("Issue not found: " + issueId);
        }
        return FileDto.from(save(file, null, issueId));
    }

    public StoredFile getFile(Long id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("File not found: " + id));
    }

    @Transactional
    public void delete(Long id) {
        StoredFile file = getFile(id);
        if (!file.getUploadedById().equals(currentUserService.requireUserId()) && !currentUserService.isAdmin()) {
            throw ApiException.forbidden("Only the uploader or an admin can delete this file");
        }
        storedFileRepository.delete(file);
    }

    private StoredFile save(MultipartFile file, Long commentId, Long issueId) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("File is required");
        }
        try {
            String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
            return storedFileRepository.save(new StoredFile(
                    fileName,
                    contentType,
                    file.getSize(),
                    file.getBytes(),
                    commentId,
                    issueId,
                    currentUserService.requireUserId()
            ));
        } catch (IOException e) {
            throw ApiException.badRequest("Could not read uploaded file");
        }
    }
}
