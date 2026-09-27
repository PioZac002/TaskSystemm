package com.tasksystem.api.auth;

import com.tasksystem.api.auth.dto.TokenResponse;
import com.tasksystem.api.common.config.JwtProperties;
import com.tasksystem.api.user.User;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
public class TokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final JwtEncoder jwtEncoder;
    private final JwtProperties properties;
    private final RefreshTokenRepository refreshTokenRepository;

    public TokenService(JwtEncoder jwtEncoder,
                        JwtProperties properties,
                        RefreshTokenRepository refreshTokenRepository) {
        this.jwtEncoder = jwtEncoder;
        this.properties = properties;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Transactional
    public TokenResponse issueTokens(User user) {
        return new TokenResponse(createAccessToken(user), createRefreshToken(user));
    }

    private TokenResponse.TokenDto createAccessToken(User user) {
        Instant now = Instant.now();
        Instant expires = now.plus(properties.accessTokenTtl());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(String.valueOf(user.getId()))
                .issuedAt(now)
                .expiresAt(expires)
                .claim("email", user.getEmail())
                .claim("roles", List.of(user.getRole().name()))
                .build();

        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        return new TokenResponse.TokenDto(token, expires);
    }

    private TokenResponse.TokenDto createRefreshToken(User user) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        Instant expires = Instant.now().plus(properties.refreshTokenTtl());
        refreshTokenRepository.save(new RefreshToken(token, user.getId(), expires));
        refreshTokenRepository.deleteAllExpired(Instant.now());

        return new TokenResponse.TokenDto(token, expires);
    }
}
