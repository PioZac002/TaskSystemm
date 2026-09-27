package com.tasksystem.api.auth;

import com.tasksystem.api.auth.dto.DemoStatus;
import com.tasksystem.api.auth.dto.LoginRequest;
import com.tasksystem.api.auth.dto.RefreshRequest;
import com.tasksystem.api.auth.dto.RegisterRequest;
import com.tasksystem.api.auth.dto.TokenResponse;
import com.tasksystem.api.user.dto.UserDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Every endpoint here is public, so opt out of the global bearer-token requirement.
@SecurityRequirements
@Tag(name = "Auth", description = "Registration, sign-in and access-token refresh. These endpoints are public.")
@RestController
@RequestMapping("/api/v1")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Is one-click demo sign-in offered on this instance? */
    @GetMapping("/auth/demo")
    public DemoStatus demoStatus() {
        return authService.demoStatus();
    }

    /** Sign in as the seeded demo account (demo mode only). */
    @PostMapping("/auth/demo")
    public TokenResponse loginAsDemo() {
        return authService.loginAsDemo();
    }

    @PostMapping("/auth/regenerate-tokens")
    public TokenResponse regenerateTokens(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }
}
