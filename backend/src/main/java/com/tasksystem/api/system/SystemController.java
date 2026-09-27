package com.tasksystem.api.system;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Public probe endpoint: opt out of the global bearer-token requirement.
@SecurityRequirements
@Tag(name = "System", description = "Build metadata and health probes.")
@RestController
@RequestMapping("/api/v1/test")
public class SystemController {

    private final String version;

    public SystemController(@Value("${app.version}") String version) {
        this.version = version;
    }

    @GetMapping("/version")
    public Map<String, String> version() {
        return Map.of("version", version);
    }
}
