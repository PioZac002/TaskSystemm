package com.tasksystem.api.notification;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findAllByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Modifying
    @Query("delete from Notification n where n.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from Notification n where n.issueId = :issueId")
    void deleteAllByIssueId(@Param("issueId") Long issueId);
}
