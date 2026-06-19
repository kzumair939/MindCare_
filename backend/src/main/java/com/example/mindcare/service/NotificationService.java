package com.example.mindcare.service;

import com.example.mindcare.entity.Notification;
import com.example.mindcare.entity.User;
import java.util.List;

public interface NotificationService {
    Notification create(User user, String message, String type, Long referenceId);
    List<Notification> getUnread(User user);
    List<Notification> getAll(User user);
    void markRead(Long notificationId);
    long countUnread(User user);
}
