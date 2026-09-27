package com.tasksystem.api.team;

import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.issue.IssueRepository;
import com.tasksystem.api.issue.IssueService;
import com.tasksystem.api.issue.dto.IssueDto;
import com.tasksystem.api.team.dto.CreateTeamRequest;
import com.tasksystem.api.team.dto.TeamDto;
import com.tasksystem.api.user.User;
import com.tasksystem.api.user.UserRepository;
import com.tasksystem.api.user.dto.UserDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final IssueService issueService;

    public TeamService(TeamRepository teamRepository,
                       UserRepository userRepository,
                       IssueRepository issueRepository,
                       IssueService issueService) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
        this.issueRepository = issueRepository;
        this.issueService = issueService;
    }

    public List<TeamDto> findAll() {
        return teamRepository.findAll().stream().map(this::toDto).toList();
    }

    public TeamDto findById(Long id) {
        return toDto(requireTeam(id));
    }

    public List<IssueDto> findIssues(Long teamId) {
        requireTeam(teamId);
        return issueService.findByTeam(teamId);
    }

    public List<UserDto> findMembers(Long teamId) {
        return requireTeam(teamId).getMembers().stream().map(UserDto::from).toList();
    }

    @Transactional
    public TeamDto create(CreateTeamRequest request) {
        String name = request.name().trim();
        if (teamRepository.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("Team name is already in use: " + name);
        }
        return toDto(teamRepository.save(new Team(name)));
    }

    @Transactional
    public TeamDto addMember(Long teamId, Long userId) {
        Team team = requireTeam(teamId);
        User user = requireUser(userId);
        team.getMembers().add(user);
        return toDto(team);
    }

    @Transactional
    public TeamDto removeMember(Long teamId, Long userId) {
        Team team = requireTeam(teamId);
        team.getMembers().removeIf(member -> member.getId().equals(userId));
        return toDto(team);
    }

    private TeamDto toDto(Team team) {
        return TeamDto.from(team, issueRepository.findIdsByTeamId(team.getId()));
    }

    private Team requireTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Team not found: " + id));
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found: " + id));
    }
}
