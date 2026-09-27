package com.tasksystem.api.file;

import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.file.dto.FileDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

@Tag(name = "Files", description = "Upload, download and delete issue attachments.")
@RestController
@RequestMapping("/api/v1/file")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    /**
     * The frontend sends multipart parts named {@code File} and {@code CommentId};
     * part names are matched case-insensitively for robustness.
     */
    @PostMapping
    public FileDto upload(MultipartHttpServletRequest request) {
        MultipartFile file = firstNonNull(request.getFile("File"), request.getFile("file"));
        if (file == null) {
            throw ApiException.badRequest("Multipart part 'File' is required");
        }
        String commentIdRaw = firstNonNull(request.getParameter("CommentId"), request.getParameter("commentId"));
        if (commentIdRaw == null || commentIdRaw.isBlank()) {
            throw ApiException.badRequest("Multipart part 'CommentId' is required");
        }
        try {
            return fileService.storeForComment(file, Long.valueOf(commentIdRaw.trim()));
        } catch (NumberFormatException e) {
            throw ApiException.badRequest("CommentId must be a number");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        StoredFile file = fileService.getFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.getFileName()).build().toString())
                .body(file.getData());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        fileService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private static <T> T firstNonNull(T first, T second) {
        return first != null ? first : second;
    }
}
