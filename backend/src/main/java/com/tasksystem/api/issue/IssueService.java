package com.tasksystem.api.issue;

import com.tasksystem.api.comment.Comment;
import com.tasksystem.api.comment.CommentRepository;
import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.common.security.CurrentUserService;
import com.tasksystem.api.file.StoredFileRepository;
import com.tasksystem.api.issue.activity.ActivityDto;
import com.tasksystem.api.issue.activity.ActivityType;
import com.tasksystem.api.issue.activity.IssueActivity;
import com.tasksystem.api.issue.activity.IssueActivityRepository;
import com.tasksystem.api.issue.dto.CreateIssueRequest;
import com.tasksystem.api.issue.dto.IssueDto;
import com.tasksystem.api.issue.dto.UpdateIssueRequest;
import com.tasksystem.api.masterdata.MasterdataService;
import com.tasksystem.api.masterdata.MasterdataValue;
import com.tasksystem.api.masterdata.dto.MasterdataValueRequest;
import com.tasksystem.api.notification.NotificationRepository;
import com.tasksystem.api.notification.NotificationService;
import com.tasksystem.api.project.Project;
import com.tasksystem.api.project.ProjectRepository;
import com.tasksystem.api.team.Team;
import com.tasksystem.api.team.TeamRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class IssueService {

    /** Convention shared with the frontend: "no team" is encoded as -1 in activities. */
    private static final long NO_TEAM = -1L;

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final IssueActivityRepository activityRepository;
    private final CommentRepository commentRepository;
    private final StoredFileRepository storedFileRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final MasterdataService masterdataService;
    private final CurrentUserService currentUserService;

    public IssueService(IssueRepository issueRepository,
                        ProjectRepository projectRepository,
                        TeamRepository teamRepository,
                        IssueActivityRepository activityRepository,
                        CommentRepository commentRepository,
                        StoredFileRepository storedFileRepository,
                        NotificationRepository notificationRepository,
                        NotificationService notificationService,
                        MasterdataService masterdataService,
                        CurrentUserService currentUserService) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.teamRepository = teamRepository;
        this.activityRepository = activityRepository;
        this.commentRepository = commentRepository;
        this.storedFileRepository = storedFileRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.masterdataService = masterdataService;
        this.currentUserService = currentUserService;
    }

    public List<IssueDto> findAll() {
        return issueRepository.findAll().stream().map(this::toDto).toList();
    }

    public IssueDto findById(Long id) {
        return toDto(requireIssue(id));
    }

    public IssueDto findByKey(String key) {
        return issueRepository.findByKeyIgnoreCase(key)
                .map(this::toDto)
                .orElseThrow(() -> ApiException.notFound("Issue not found: " + key));
    }

    public List<IssueDto> findByProject(Long projectId) {
        return issueRepository.findAllByProjectId(projectId).stream().map(this::toDto).toList();
    }

    public List<IssueDto> findByAssignee(Long userId) {
        return issueRepository.findAllByAssigneeId(userId).stream().map(this::toDto).toList();
    }

    public List<IssueDto> findByTeam(Long teamId) {
        return issueRepository.findAllByTeamId(teamId).stream().map(this::toDto).toList();
    }

    public List<ActivityDto> findActivities(Long issueId) {
        requireIssue(issueId);
        return activityRepository.findAllByIssueIdOrderByTimestampAsc(issueId).stream()
                .map(ActivityDto::from)
                .toList();
    }

    @Transactional
    public IssueDto create(CreateIssueRequest request) {
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> ApiException.notFound("Project not found: " + request.projectId()));

        Long actorId = currentUserService.requireUserId();
        Long authorId = request.authorId() != null ? request.authorId() : actorId;
        IssuePriority priority = request.priority() != null && !request.priority().isBlank()
                ? IssuePriority.parse(request.priority())
                : IssuePriority.NORMAL;

        String key = project.getShortName().toUpperCase(Locale.ROOT) + "-" + project.nextIssueNumber();

        Issue issue = issueRepository.save(new Issue(
                key,
                request.title().trim(),
                request.description(),
                priority,
                authorId,
                request.assigneeId(),
                project,
                request.dueDate()
        ));

        activityRepository.save(new IssueActivity(issue.getId(), ActivityType.CREATED_ISSUE, actorId));

        notificationService.notify(issue.getAssigneeId(), actorId, issue.getId(), issue.getKey(),
                NotificationService.TYPE_ISSUE_ASSIGNED);

        return toDto(issue);
    }

    @Transactional
    public IssueDto update(UpdateIssueRequest request) {
        Issue issue = requireIssue(request.issueId());
        Long actorId = currentUserService.requireUserId();

        if (request.title() != null && !request.title().isBlank()
                && !request.title().equals(issue.getTitle())) {
            recordValueChange(issue, actorId, ActivityType.UPDATED_TITLE, issue.getTitle(), request.title());
            issue.setTitle(request.title().trim());
        }

        if (request.description() != null && !Objects.equals(request.description(), issue.getDescription())) {
            recordValueChange(issue, actorId, ActivityType.UPDATED_DESCRIPTION, null, null);
            issue.setDescription(request.description());
        }

        if (request.status() != null && !request.status().isBlank()) {
            applyStatus(issue, actorId, IssueStatus.parse(request.status()));
        }

        if (request.priority() != null && !request.priority().isBlank()) {
            applyPriority(issue, actorId, IssuePriority.parse(request.priority()));
        }

        // teamId is always present in the frontend's update payload (null = no team),
        // so treat it as authoritative.
        applyTeam(issue, actorId, request.teamId());

        applyDueDate(issue, actorId, request.dueDate());

        applyAssignee(issue, actorId, request.assigneeId());

        if (request.masterDataValues() != null) {
            applyLabels(issue, request.masterDataValues());
        }

        return toDto(issue);
    }

    @Transactional
    public IssueDto assign(Long issueId, Long assigneeId) {
        Issue issue = requireIssue(issueId);
        applyAssignee(issue, currentUserService.requireUserId(), assigneeId);
        return toDto(issue);
    }

    @Transactional
    public IssueDto rename(Long issueId, String title) {
        Issue issue = requireIssue(issueId);
        Long actorId = currentUserService.requireUserId();
        if (!title.equals(issue.getTitle())) {
            recordValueChange(issue, actorId, ActivityType.UPDATED_TITLE, issue.getTitle(), title);
            issue.setTitle(title.trim());
        }
        return toDto(issue);
    }

    @Transactional
    public IssueDto assignTeam(Long issueId, Long teamId) {
        Issue issue = requireIssue(issueId);
        applyTeam(issue, currentUserService.requireUserId(), teamId);
        return toDto(issue);
    }

    @Transactional
    public IssueDto updateStatus(Long issueId, String status) {
        Issue issue = requireIssue(issueId);
        applyStatus(issue, currentUserService.requireUserId(), IssueStatus.parse(status));
        return toDto(issue);
    }

    @Transactional
    public IssueDto updatePriority(Long issueId, String priority) {
        Issue issue = requireIssue(issueId);
        applyPriority(issue, currentUserService.requireUserId(), IssuePriority.parse(priority));
        return toDto(issue);
    }

    @Transactional
    public IssueDto updateDueDate(Long issueId, LocalDate dueDate) {
        Issue issue = requireIssue(issueId);
        applyDueDate(issue, currentUserService.requireUserId(), dueDate);
        return toDto(issue);
    }

    @Transactional
    public void delete(Long issueId) {
        Issue issue = requireIssue(issueId);
        deleteWithDependencies(issue);
    }

    @Transactional
    public void deleteAll() {
        issueRepository.findAll().forEach(this::deleteWithDependencies);
    }

    @Transactional
    public void deleteAllByProject(Long projectId) {
        issueRepository.findAllByProjectId(projectId).forEach(this::deleteWithDependencies);
    }

    @Transactional
    public void recordCommentActivity(Long issueId, Long actorId) {
        activityRepository.save(new IssueActivity(issueId, ActivityType.CREATED_COMMENT, actorId));
    }

    public Issue requireIssue(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Issue not found: " + id));
    }

    public IssueDto toDto(Issue issue) {
        return IssueDto.from(issue, storedFileRepository.findIdsByIssueId(issue.getId()));
    }

    private void deleteWithDependencies(Issue issue) {
        Long issueId = issue.getId();
        for (Comment comment : commentRepository.findAllByIssueIdOrderByCreatedAtAsc(issueId)) {
            storedFileRepository.deleteAllByCommentId(comment.getId());
            commentRepository.delete(comment);
        }
        storedFileRepository.deleteAllByIssueId(issueId);
        activityRepository.deleteAllByIssueId(issueId);
        notificationRepository.deleteAllByIssueId(issueId);
        issue.getLabels().clear();
        issueRepository.delete(issue);
    }

    private void applyStatus(Issue issue, Long actorId, IssueStatus newStatus) {
        if (issue.getStatus() == newStatus) {
            return;
        }
        IssueActivity activity = new IssueActivity(issue.getId(), ActivityType.UPDATED_STATUS, actorId);
        activity.setOldStatus(issue.getStatus().name());
        activity.setNewStatus(newStatus.name());
        activityRepository.save(activity);
        issue.setStatus(newStatus);
    }

    private void applyPriority(Issue issue, Long actorId, IssuePriority newPriority) {
        if (issue.getPriority() == newPriority) {
            return;
        }
        IssueActivity activity = new IssueActivity(issue.getId(), ActivityType.UPDATED_PRIORITY, actorId);
        activity.setOldPriority(issue.getPriority().name());
        activity.setNewPriority(newPriority.name());
        activityRepository.save(activity);
        issue.setPriority(newPriority);
    }

    private void applyTeam(Issue issue, Long actorId, Long teamId) {
        Long currentTeamId = issue.getTeam() != null ? issue.getTeam().getId() : null;
        Long targetTeamId = teamId != null && teamId > 0 ? teamId : null;
        if (Objects.equals(currentTeamId, targetTeamId)) {
            return;
        }
        Team newTeam = null;
        if (targetTeamId != null) {
            newTeam = teamRepository.findById(targetTeamId)
                    .orElseThrow(() -> ApiException.notFound("Team not found: " + teamId));
        }
        IssueActivity activity = new IssueActivity(issue.getId(), ActivityType.UPDATED_TEAM, actorId);
        activity.setOldTeamId(currentTeamId != null ? currentTeamId : NO_TEAM);
        activity.setNewTeamId(targetTeamId != null ? targetTeamId : NO_TEAM);
        activityRepository.save(activity);
        issue.setTeam(newTeam);
    }

    private void applyDueDate(Issue issue, Long actorId, LocalDate dueDate) {
        if (Objects.equals(issue.getDueDate(), dueDate)) {
            return;
        }
        IssueActivity activity = new IssueActivity(issue.getId(), ActivityType.UPDATED_DUEDATE, actorId);
        activity.setOldDateTime(issue.getDueDate());
        activity.setNewDateTime(dueDate);
        activityRepository.save(activity);
        issue.setDueDate(dueDate);
    }

    private void applyAssignee(Issue issue, Long actorId, Long assigneeId) {
        Long targetAssigneeId = assigneeId != null && assigneeId > 0 ? assigneeId : null;
        if (Objects.equals(issue.getAssigneeId(), targetAssigneeId)) {
            return;
        }
        IssueActivity activity = new IssueActivity(issue.getId(), ActivityType.UPDATED_ASSIGNEE, actorId);
        activity.setOldValue(issue.getAssigneeId() != null ? String.valueOf(issue.getAssigneeId()) : null);
        activity.setNewValue(targetAssigneeId != null ? String.valueOf(targetAssigneeId) : null);
        activityRepository.save(activity);

        issue.setAssigneeId(targetAssigneeId);

        notificationService.notify(targetAssigneeId, actorId, issue.getId(), issue.getKey(),
                NotificationService.TYPE_ISSUE_ASSIGNED);
    }

    private void applyLabels(Issue issue, List<MasterdataValueRequest> labelRequests) {
        issue.getLabels().clear();
        for (MasterdataValueRequest labelRequest : labelRequests) {
            if (Boolean.TRUE.equals(labelRequest.delete())) {
                continue;
            }
            String type = labelRequest.type() != null && !labelRequest.type().isBlank()
                    ? labelRequest.type().trim()
                    : "ISSUE_LABEL";
            String value = labelRequest.value() != null && !labelRequest.value().isBlank()
                    ? labelRequest.value().trim()
                    : labelRequest.code();
            String code = labelRequest.code() != null && !labelRequest.code().isBlank()
                    ? labelRequest.code().trim()
                    : (value != null ? value.toUpperCase(Locale.ROOT).replaceAll("\\s+", "_") : null);
            if (code == null) {
                continue;
            }
            MasterdataValue label = masterdataService.resolveOrCreate(
                    type, code, value != null ? value : code,
                    labelRequest.order() != null ? labelRequest.order() : 0);
            issue.getLabels().add(label);
        }
    }

    private void recordValueChange(Issue issue, Long actorId, ActivityType type, String oldValue, String newValue) {
        IssueActivity activity = new IssueActivity(issue.getId(), type, actorId);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);
        activityRepository.save(activity);
    }
}
