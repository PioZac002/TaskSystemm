package com.tasksystem.api.issue.activity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IssueActivityRepository extends JpaRepository<IssueActivity, Long> {

    List<IssueActivity> findAllByIssueIdOrderByTimestampAsc(Long issueId);

    @Modifying
    @Query("delete from IssueActivity a where a.issueId = :issueId")
    void deleteAllByIssueId(@Param("issueId") Long issueId);
}
