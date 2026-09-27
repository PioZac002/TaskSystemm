package com.tasksystem.api.user.dto;

import com.tasksystem.api.user.User;

import java.time.Instant;

public record UserDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String slackUserId,
        String role,
        boolean disabled,
        Instant createdAt
) {

    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getSlackUserId(),
                user.getRole().name(),
                user.isDisabled(),
                user.getCreatedAt()
        );
    }
}
