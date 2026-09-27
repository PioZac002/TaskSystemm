package com.tasksystem.api.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    /** Name of the security scheme referenced by the "Authorize" button in Swagger UI. */
    private static final String BEARER_SCHEME = "bearerAuth";

    private final String version;
    private final int port;

    public OpenApiConfig(@Value("${app.version}") String version, @Value("${server.port}") int port) {
        this.version = version;
        this.port = port;
    }

    @Bean
    OpenAPI taskSystemOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("TaskSystem API")
                        .version(version)
                        .description("""
                                REST API for TaskSystem: users, teams, projects, issues, comments, \
                                attachments, notifications and masterdata.

                                **How to authenticate**
                                1. Call `POST /api/v1/login` (or `POST /api/v1/auth/demo` in demo mode) \
                                to obtain an access token.
                                2. Click **Authorize** and paste the `accessToken` value — the `Bearer` \
                                prefix is added automatically.

                                Access tokens are short-lived; refresh them with \
                                `POST /api/v1/auth/regenerate-tokens`. Endpoints under \
                                `/api/v1/admin/**` require the `ROLE_ADMIN` authority.""")
                        .contact(new Contact().name("TaskSystem")))
                .servers(List.of(new Server()
                        .url("http://localhost:" + port)
                        .description("Local development")))
                .components(new Components().addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Access token returned by /api/v1/login")))
                // Applied to every operation; the public auth endpoints opt out with
                // @SecurityRequirements on the controller methods.
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME));
    }
}
