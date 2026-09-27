package com.tasksystem.api.comment;

import com.tasksystem.api.comment.dto.CommentDto;
import com.tasksystem.api.comment.dto.CreateCommentRequest;
import com.tasksystem.api.comment.dto.EditCommentRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Comments", description = "Comments on issues.")
@RestController
@RequestMapping("/api/v1/comment")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/issue/{issueId}")
    public List<CommentDto> getByIssue(@PathVariable Long issueId) {
        return commentService.findByIssue(issueId);
    }

    @PostMapping("/create")
    public ResponseEntity<CommentDto> create(@Valid @RequestBody CreateCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(request));
    }

    @PutMapping("/edit")
    public CommentDto edit(@Valid @RequestBody EditCommentRequest request) {
        return commentService.edit(request);
    }

    @DeleteMapping("/issue/{issueId}")
    public ResponseEntity<Void> deleteAllByIssue(@PathVariable Long issueId) {
        commentService.deleteAllByIssue(issueId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        commentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
