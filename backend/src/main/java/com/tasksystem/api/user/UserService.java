package com.tasksystem.api.user;

import com.tasksystem.api.auth.RefreshTokenRepository;
import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.common.security.CurrentUserService;
import com.tasksystem.api.issue.IssueRepository;
import com.tasksystem.api.notification.NotificationRepository;
import com.tasksystem.api.team.Team;
import com.tasksystem.api.team.TeamRepository;
import com.tasksystem.api.user.dto.AdminResetPasswordRequest;
import com.tasksystem.api.user.dto.ChangeMyPasswordRequest;
import com.tasksystem.api.user.dto.ChangeRoleRequest;
import com.tasksystem.api.user.dto.UserDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final IssueRepository issueRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;

    public UserService(UserRepository userRepository,
                       TeamRepository teamRepository,
                       IssueRepository issueRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       NotificationRepository notificationRepository,
                       PasswordEncoder passwordEncoder,
                       CurrentUserService currentUserService) {
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.issueRepository = issueRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.notificationRepository = notificationRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
    }

    public List<UserDto> findAll() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    public UserDto findById(Long id) {
        return UserDto.from(requireUser(id));
    }

    public UserDto findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(UserDto::from)
                .orElseThrow(() -> ApiException.notFound("User not found: " + email));
    }

    @Transactional
    public void changeMyPassword(ChangeMyPasswordRequest request) {
        User user = requireUser(currentUserService.requireUserId());
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw ApiException.badRequest("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void adminResetPassword(AdminResetPasswordRequest request) {
        User user = requireUser(request.userId());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public UserDto changeRole(ChangeRoleRequest request) {
        User user = requireUser(request.userId());
        try {
            user.setRole(Role.parse(request.role()));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Unknown role: " + request.role());
        }
        return UserDto.from(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = requireUser(id);
        if (user.getId().equals(currentUserService.requireUserId())) {
            throw ApiException.badRequest("You cannot delete your own account");
        }
        detachAndDelete(user);
    }

    @Transactional
    public void deleteAllUsers() {
        Long callerId = currentUserService.requireUserId();
        userRepository.findAll().stream()
                .filter(user -> !user.getId().equals(callerId))
                .forEach(this::detachAndDelete);
    }

    private void detachAndDelete(User user) {
        for (Team team : teamRepository.findAllByMembersId(user.getId())) {
            team.getMembers().removeIf(member -> member.getId().equals(user.getId()));
        }
        issueRepository.clearAssignee(user.getId());
        refreshTokenRepository.deleteAllByUserId(user.getId());
        notificationRepository.deleteAllByUserId(user.getId());
        userRepository.delete(user);
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("User not found: " + id));
    }
}
