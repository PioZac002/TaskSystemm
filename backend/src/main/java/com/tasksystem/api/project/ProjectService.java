package com.tasksystem.api.project;

import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.common.security.CurrentUserService;
import com.tasksystem.api.issue.IssuePriority;
import com.tasksystem.api.issue.IssueRepository;
import com.tasksystem.api.issue.IssueService;
import com.tasksystem.api.issue.IssueStatus;
import com.tasksystem.api.project.dto.CreateProjectRequest;
import com.tasksystem.api.project.dto.ProjectDetailDto;
import com.tasksystem.api.project.dto.ProjectDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final IssueService issueService;
    private final CurrentUserService currentUserService;

    public ProjectService(ProjectRepository projectRepository,
                          IssueRepository issueRepository,
                          IssueService issueService,
                          CurrentUserService currentUserService) {
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
        this.issueService = issueService;
        this.currentUserService = currentUserService;
    }

    public List<ProjectDto> findAll() {
        Map<Long, ProjectStats> statsByProject = loadStats();
        return projectRepository.findAll().stream()
                .map(project -> toDto(project, statsByProject.getOrDefault(project.getId(), ProjectStats.EMPTY)))
                .toList();
    }

    /** Detail view: the same statistics plus the project's issues. */
    public ProjectDetailDto findById(Long id) {
        Project project = requireProject(id);
        ProjectDto summary = toDto(project, loadStats().getOrDefault(project.getId(), ProjectStats.EMPTY));
        return ProjectDetailDto.of(summary, issueService.findByProject(project.getId()));
    }

    @Transactional
    public ProjectDto create(CreateProjectRequest request) {
        String shortName = request.shortName().trim().toUpperCase(Locale.ROOT);
        if (projectRepository.existsByShortNameIgnoreCase(shortName)) {
            throw ApiException.conflict("Project short name is already in use: " + shortName);
        }
        Project project = projectRepository.save(new Project(
                shortName,
                request.name() != null && !request.name().isBlank() ? request.name().trim() : shortName,
                request.description(),
                currentUserService.requireUserId()
        ));
        return toDto(project, ProjectStats.EMPTY);
    }

    @Transactional
    public void delete(Long id) {
        Project project = requireProject(id);
        issueService.deleteAllByProject(project.getId());
        projectRepository.delete(project);
    }

    private Project requireProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Project not found: " + id));
    }

    private Map<Long, ProjectStats> loadStats() {
        Map<Long, ProjectStats> stats = new HashMap<>();
        for (Object[] row : issueRepository.countGroupedByProjectStatusPriority()) {
            Long projectId = (Long) row[0];
            IssueStatus status = (IssueStatus) row[1];
            IssuePriority priority = (IssuePriority) row[2];
            long count = (Long) row[3];
            stats.computeIfAbsent(projectId, ignored -> new ProjectStats()).add(status, priority, count);
        }
        return stats;
    }

    private ProjectDto toDto(Project project, ProjectStats stats) {
        long total = stats.total();
        long done = stats.byStatus(IssueStatus.DONE);
        long todo = stats.byStatus(IssueStatus.NEW) + stats.byStatus(IssueStatus.TRIAGE) + stats.byStatus(IssueStatus.TODO);
        long inProgress = stats.byStatus(IssueStatus.IN_PROGRESS)
                + stats.byStatus(IssueStatus.WAITING_FOR_TEAM)
                + stats.byStatus(IssueStatus.CODE_REVIEW);
        int progress = total > 0 ? Math.round(done * 100f / total) : 0;

        return new ProjectDto(
                project.getId(),
                project.getShortName(),
                project.getName(),
                project.getDescription(),
                project.getOwnerId(),
                project.getCreatedAt(),
                total,
                total,
                done,
                todo,
                inProgress,
                progress,
                stats.byPriority(IssuePriority.LOW),
                stats.byPriority(IssuePriority.NORMAL),
                stats.byPriority(IssuePriority.HIGH),
                stats.byPriority(IssuePriority.CRITICAL)
        );
    }

    private static final class ProjectStats {

        static final ProjectStats EMPTY = new ProjectStats();

        private final Map<IssueStatus, Long> byStatus = new EnumMap<>(IssueStatus.class);
        private final Map<IssuePriority, Long> byPriority = new EnumMap<>(IssuePriority.class);

        void add(IssueStatus status, IssuePriority priority, long count) {
            byStatus.merge(status, count, Long::sum);
            byPriority.merge(priority, count, Long::sum);
        }

        long byStatus(IssueStatus status) {
            return byStatus.getOrDefault(status, 0L);
        }

        long byPriority(IssuePriority priority) {
            return byPriority.getOrDefault(priority, 0L);
        }

        long total() {
            return byStatus.values().stream().mapToLong(Long::longValue).sum();
        }
    }
}
