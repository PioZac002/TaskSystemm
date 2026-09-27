package com.tasksystem.api.common.error;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {

    /**
     * The frontend reads {@code error.response.data.Message} (contract inherited
     * from the previous backend), so the message is exposed under both keys.
     */
    @JsonProperty("Message")
    public String legacyMessage() {
        return message;
    }
}
