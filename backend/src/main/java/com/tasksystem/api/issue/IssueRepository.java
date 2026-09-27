package com.tasksystem.api.issue;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    Optional<Issue> findByKeyIgnoreCase(String key);

    List<Issue> findAllByProjectId(Long projectId);

    List<Issue> findAllByTeamId(Long teamId);

    List<Issue> findAllByAssigneeId(Long assigneeId);

    @Query("select i.id from Issue i where i.team.id = :teamId")
    List<Long> findIdsByTeamId(@Param("teamId") Long teamId);

    @Query("select i.id from Issue i where i.project.id = :projectId")
    List<Long> findIdsByProjectId(@Param("projectId") Long projectId);

    @Modifying
    @Query("update Issue i set i.assigneeId = null where i.assigneeId = :userId")
    void clearAssignee(@Param("userId") Long userId);

    @Query("""
            select i.project.id, i.status, i.priority, count(i)
            from Issue i
            group by i.project.id, i.status, i.priority
            """)
    List<Object[]> countGroupedByProjectStatusPriority();
}
