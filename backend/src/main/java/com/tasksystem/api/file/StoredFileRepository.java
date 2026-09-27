package com.tasksystem.api.file;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StoredFileRepository extends JpaRepository<StoredFile, Long> {

    @Query("select f.id from StoredFile f where f.commentId = :commentId order by f.id")
    List<Long> findIdsByCommentId(@Param("commentId") Long commentId);

    @Query("select f.id from StoredFile f where f.issueId = :issueId order by f.id")
    List<Long> findIdsByIssueId(@Param("issueId") Long issueId);

    @Modifying
    @Query("delete from StoredFile f where f.commentId = :commentId")
    void deleteAllByCommentId(@Param("commentId") Long commentId);

    @Modifying
    @Query("delete from StoredFile f where f.issueId = :issueId")
    void deleteAllByIssueId(@Param("issueId") Long issueId);
}
