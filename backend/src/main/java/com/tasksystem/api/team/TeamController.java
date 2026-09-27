package com.tasksystem.api.team;

import com.tasksystem.api.issue.dto.IssueDto;
import com.tasksystem.api.team.dto.CreateTeamRequest;
import com.tasksystem.api.team.dto.TeamDto;
import com.tasksystem.api.user.dto.UserDto;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Teams", description = "Teams and their members.")
@RestController
@RequestMapping("/api/v1/team")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping("/all")
    public List<TeamDto> getAll() {
        return teamService.findAll();
    }

    @GetMapping("/id/{id}")
    public TeamDto getById(@PathVariable Long id) {
        return teamService.findById(id);
    }

    @GetMapping("/issues/{teamId}")
    public List<IssueDto> getIssues(@PathVariable Long teamId) {
        return teamService.findIssues(teamId);
    }

    @GetMapping("/users/{teamId}")
    public List<UserDto> getMembers(@PathVariable Long teamId) {
        return teamService.findMembers(teamId);
    }

    @PostMapping("/create")
    public ResponseEntity<TeamDto> create(@Valid @RequestBody CreateTeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.create(request));
    }

    @PutMapping("/{teamId}/add-user/{userId}")
    public TeamDto addUser(@PathVariable Long teamId, @PathVariable Long userId) {
        return teamService.addMember(teamId, userId);
    }

    @PutMapping("/{teamId}/remove-user/{userId}")
    public TeamDto removeUser(@PathVariable Long teamId, @PathVariable Long userId) {
        return teamService.removeMember(teamId, userId);
    }
}
