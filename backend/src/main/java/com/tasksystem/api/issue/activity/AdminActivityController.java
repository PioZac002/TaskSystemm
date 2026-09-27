package com.tasksystem.api.issue.activity;

import com.tasksystem.api.common.error.ApiException;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only activity operations; access is restricted to ROLE_ADMIN in SecurityConfig.
 */
@Tag(name = "Admin · Activity", description = "Issue activity audit log. Requires ROLE_ADMIN.")
@RestController
@RequestMapping("/api/v1/admin/activity")
public class AdminActivityController {

    private final IssueActivityRepository activityRepository;

    public AdminActivityController(IssueActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @DeleteMapping("/issue/{activityId}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long activityId) {
        if (!activityRepository.existsById(activityId)) {
            throw ApiException.notFound("Activity not found: " + activityId);
        }
        activityRepository.deleteById(activityId);
        return ResponseEntity.noContent().build();
    }
}
