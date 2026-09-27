package com.tasksystem.api.user;

import com.tasksystem.api.user.dto.AdminResetPasswordRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only user operations; access is restricted to ROLE_ADMIN in SecurityConfig.
 */
@Tag(name = "Admin · Users", description = "User administration. Requires ROLE_ADMIN.")
@RestController
@RequestMapping("/api/v1/admin")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody AdminResetPasswordRequest request) {
        userService.adminResetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
