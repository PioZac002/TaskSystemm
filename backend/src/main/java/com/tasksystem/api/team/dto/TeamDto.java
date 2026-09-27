package com.tasksystem.api.team.dto;

import com.tasksystem.api.team.Team;
import com.tasksystem.api.user.User;

import java.util.List;

/**
 * Shape expected by the frontend: {@code { id, name, issues: [issueId], users: [userId] }}.
 */
public record TeamDto(
        Long id,
        String name,
        List<Long> issues,
        List<Long> users
) {

    public static TeamDto from(Team team, List<Long> issueIds) {
        List<Long> memberIds = team.getMembers().stream().map(User::getId).toList();
        return new TeamDto(team.getId(), team.getName(), issueIds, memberIds);
    }
}
