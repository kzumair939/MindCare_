package com.example.mindcare.service.impl;

import com.example.mindcare.entity.Notification;
import com.example.mindcare.entity.User;
import com.example.mindcare.repository.NotificationRepository;
import com.example.mindcare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    public Notification create(User user, String message, String type, Long referenceId) {
        Notification n = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .read(false)
                .build();
        return notificationRepository.save(n);
    }

    @Override
    public List<Notification> getUnread(User user) {
        return notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(user);
    }

    @Override
    public List<Notification> getAll(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public void markRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    public long countUnread(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }
}
