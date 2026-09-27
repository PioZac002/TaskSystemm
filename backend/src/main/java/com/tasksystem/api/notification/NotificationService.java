package com.tasksystem.api.notification;

import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.common.security.CurrentUserService;
import com.tasksystem.api.notification.dto.NotificationDto;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class NotificationService {

    public static final String TYPE_ISSUE_ASSIGNED = "ISSUE_ASSIGNED";
    public static final String TYPE_NEW_COMMENT = "NEW_COMMENT";

    private final NotificationRepository notificationRepository;
    private final CurrentUserService currentUserService;

    public NotificationService(NotificationRepository notificationRepository,
                               CurrentUserService currentUserService) {
        this.notificationRepository = notificationRepository;
        this.currentUserService = currentUserService;
    }

    public List<NotificationDto> findMine(int qty, boolean unreadOnly) {
        Long userId = currentUserService.requireUserId();
        Pageable page = Pageable.ofSize(Math.clamp(qty, 1, 100));
        List<Notification> notifications = unreadOnly
                ? notificationRepository.findAllByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, page)
                : notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId, page);
        return notifications.stream().map(NotificationDto::from).toList();
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Long userId = currentUserService.requireUserId();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found: " + notificationId));
        if (!notification.getUserId().equals(userId)) {
            throw ApiException.forbidden("Notification does not belong to the current user");
        }
        notification.setRead(true);
    }

    /**
     * Creates a notification unless the recipient is the author of the event.
     */
    @Transactional
    public void notify(Long recipientId, Long eventAuthorId, Long issueId, String issueKey, String type) {
        if (recipientId == null || Objects.equals(recipientId, eventAuthorId)) {
            return;
        }
        notificationRepository.save(new Notification(recipientId, eventAuthorId, issueId, issueKey, type));
    }
}
