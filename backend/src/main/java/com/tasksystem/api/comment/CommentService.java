package com.tasksystem.api.comment;

import com.tasksystem.api.comment.dto.CommentDto;
import com.tasksystem.api.comment.dto.CreateCommentRequest;
import com.tasksystem.api.comment.dto.EditCommentRequest;
import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.common.security.CurrentUserService;
import com.tasksystem.api.file.StoredFileRepository;
import com.tasksystem.api.issue.Issue;
import com.tasksystem.api.issue.IssueService;
import com.tasksystem.api.notification.NotificationService;
import com.tasksystem.api.user.User;
import com.tasksystem.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final StoredFileRepository storedFileRepository;
    private final IssueService issueService;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public CommentService(CommentRepository commentRepository,
                          UserRepository userRepository,
                          StoredFileRepository storedFileRepository,
                          IssueService issueService,
                          NotificationService notificationService,
                          CurrentUserService currentUserService) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.storedFileRepository = storedFileRepository;
        this.issueService = issueService;
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    public List<CommentDto> findByIssue(Long issueId) {
        issueService.requireIssue(issueId);
        List<Comment> comments = commentRepository.findAllByIssueIdOrderByCreatedAtAsc(issueId);

        Map<Long, User> authors = userRepository.findAllById(
                        comments.stream().map(Comment::getAuthorId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return comments.stream()
                .map(comment -> toDto(comment, authors.get(comment.getAuthorId())))
                .toList();
    }

    @Transactional
    public CommentDto create(CreateCommentRequest request) {
        Issue issue = issueService.requireIssue(request.issueId());
        Long actorId = currentUserService.requireUserId();
        Long authorId = request.authorId() != null ? request.authorId() : actorId;

        Comment comment = commentRepository.save(
                new Comment(issue.getId(), authorId, request.content().trim()));

        issueService.recordCommentActivity(issue.getId(), actorId);
        notificationService.notify(issue.getAuthorId(), actorId, issue.getId(), issue.getKey(),
                NotificationService.TYPE_NEW_COMMENT);
        notificationService.notify(issue.getAssigneeId(), actorId, issue.getId(), issue.getKey(),
                NotificationService.TYPE_NEW_COMMENT);

        return toDto(comment, userRepository.findById(authorId).orElse(null));
    }

    @Transactional
    public CommentDto edit(EditCommentRequest request) {
        Comment comment = requireComment(request.id());
        requireAuthorOrAdmin(comment);
        comment.setContent(request.content().trim());
        return toDto(comment, userRepository.findById(comment.getAuthorId()).orElse(null));
    }

    @Transactional
    public void delete(Long id) {
        Comment comment = requireComment(id);
        requireAuthorOrAdmin(comment);
        storedFileRepository.deleteAllByCommentId(comment.getId());
        commentRepository.delete(comment);
    }

    @Transactional
    public void deleteAllByIssue(Long issueId) {
        issueService.requireIssue(issueId);
        for (Comment comment : commentRepository.findAllByIssueIdOrderByCreatedAtAsc(issueId)) {
            storedFileRepository.deleteAllByCommentId(comment.getId());
            commentRepository.delete(comment);
        }
    }

    private CommentDto toDto(Comment comment, User author) {
        String authorName = author != null ? author.getFullName() : "Unknown user";
        return CommentDto.from(comment, authorName, storedFileRepository.findIdsByCommentId(comment.getId()));
    }

    private Comment requireComment(Long id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Comment not found: " + id));
    }

    private void requireAuthorOrAdmin(Comment comment) {
        if (!comment.getAuthorId().equals(currentUserService.requireUserId()) && !currentUserService.isAdmin()) {
            throw ApiException.forbidden("Only the author or an admin can modify this comment");
        }
    }
}
