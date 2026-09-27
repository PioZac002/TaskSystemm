package com.tasksystem.api.comment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findAllByIssueIdOrderByCreatedAtAsc(Long issueId);
}
