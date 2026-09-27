package com.tasksystem.api.auth.dto;

import java.time.Instant;

/**
 * Shape expected by the frontend:
 * {@code { accessToken: { token, expires }, refreshToken: { token, expires } }}.
 */
public record TokenResponse(TokenDto accessToken, TokenDto refreshToken) {

    public record TokenDto(String token, Instant expires) {
    }
}
