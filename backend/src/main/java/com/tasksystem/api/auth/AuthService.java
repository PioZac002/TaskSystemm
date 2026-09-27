package com.tasksystem.api.auth;

import com.tasksystem.api.auth.dto.DemoStatus;
import com.tasksystem.api.auth.dto.LoginRequest;
import com.tasksystem.api.auth.dto.RefreshRequest;
import com.tasksystem.api.auth.dto.RegisterRequest;
import com.tasksystem.api.auth.dto.TokenResponse;
import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.user.User;
import com.tasksystem.api.user.UserRepository;
import com.tasksystem.api.user.dto.UserDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final boolean demoEnabled;
    private final String demoEmail;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       TokenService tokenService,
                       RefreshTokenRepository refreshTokenRepository,
                       @Value("${app.demo.seed:false}") boolean demoEnabled,
                       @Value("${app.demo.account-email:demo@tasksystem.local}") String demoEmail) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.demoEnabled = demoEnabled;
        this.demoEmail = demoEmail;
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw ApiException.conflict("Email is already registered");
        }
        User user = new User(
                request.firstName().trim(),
                request.lastName().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()),
                request.slackUserId()
        );
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        if (user.isDisabled()) {
            throw ApiException.forbidden("Account is disabled");
        }
        return tokenService.issueTokens(user);
    }

    /** Whether the frontend should offer one-click sign-in to the demo account. */
    public DemoStatus demoStatus() {
        boolean available = demoEnabled && userRepository.findByEmailIgnoreCase(demoEmail)
                .filter(user -> !user.isDisabled())
                .isPresent();
        return new DemoStatus(available, available ? demoEmail : null);
    }

    /**
     * Signs in as the seeded demo account without a password, so visitors can look around.
     * Only available while demo mode is on (app.demo.seed), never on the prod profile.
     */
    @Transactional
    public TokenResponse loginAsDemo() {
        if (!demoEnabled) {
            throw ApiException.forbidden("Demo mode is disabled on this instance");
        }
        User user = userRepository.findByEmailIgnoreCase(demoEmail)
                .orElseThrow(() -> ApiException.notFound("Demo account is not available"));
        if (user.isDisabled()) {
            throw ApiException.forbidden("Demo account is disabled");
        }
        return tokenService.issueTokens(user);
    }

    @Transactional
    public TokenResponse refresh(RefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        // Rotate: a refresh token is single-use.
        refreshTokenRepository.delete(stored);

        if (stored.isExpired()) {
            throw ApiException.unauthorized("Refresh token has expired");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
        if (user.isDisabled()) {
            throw ApiException.forbidden("Account is disabled");
        }
        return tokenService.issueTokens(user);
    }
}
