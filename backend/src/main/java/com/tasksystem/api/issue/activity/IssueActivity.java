package com.tasksystem.api.issue.activity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Audit trail entry for a single issue. Only the columns relevant to the
 * activity type are populated; the rest stay null, mirroring what the
 * frontend activity log expects.
 */
@Entity
@Table(name = "issue_activities", indexes = @Index(name = "idx_activity_issue", columnList = "issueId"))
public class IssueActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long issueId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActivityType activityType;

    @Column(nullable = false)
    private Long eventAuthorUserId;

    @Column(name = "event_timestamp", nullable = false)
    private Instant timestamp = Instant.now();

    @Column(length = 1000)
    private String oldValue;

    @Column(length = 1000)
    private String newValue;

    private String oldStatus;
    private String newStatus;

    private String oldPriority;
    private String newPriority;

    private Long oldTeamId;
    private Long newTeamId;

    private LocalDate oldDateTime;
    private LocalDate newDateTime;

    protected IssueActivity() {
    }

    public IssueActivity(Long issueId, ActivityType activityType, Long eventAuthorUserId) {
        this.issueId = issueId;
        this.activityType = activityType;
        this.eventAuthorUserId = eventAuthorUserId;
    }

    public Long getId() {
        return id;
    }

    public Long getIssueId() {
        return issueId;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public Long getEventAuthorUserId() {
        return eventAuthorUserId;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public String getOldStatus() {
        return oldStatus;
    }

    public void setOldStatus(String oldStatus) {
        this.oldStatus = oldStatus;
    }

    public String getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(String newStatus) {
        this.newStatus = newStatus;
    }

    public String getOldPriority() {
        return oldPriority;
    }

    public void setOldPriority(String oldPriority) {
        this.oldPriority = oldPriority;
    }

    public String getNewPriority() {
        return newPriority;
    }

    public void setNewPriority(String newPriority) {
        this.newPriority = newPriority;
    }

    public Long getOldTeamId() {
        return oldTeamId;
    }

    public void setOldTeamId(Long oldTeamId) {
        this.oldTeamId = oldTeamId;
    }

    public Long getNewTeamId() {
        return newTeamId;
    }

    public void setNewTeamId(Long newTeamId) {
        this.newTeamId = newTeamId;
    }

    public LocalDate getOldDateTime() {
        return oldDateTime;
    }

    public void setOldDateTime(LocalDate oldDateTime) {
        this.oldDateTime = oldDateTime;
    }

    public LocalDate getNewDateTime() {
        return newDateTime;
    }

    public void setNewDateTime(LocalDate newDateTime) {
        this.newDateTime = newDateTime;
    }
}
