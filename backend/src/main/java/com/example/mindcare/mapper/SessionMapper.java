package com.example.mindcare.mapper;

import com.example.mindcare.dto.SessionResponseDTO;
import com.example.mindcare.entity.Session;

public class SessionMapper {
    public static SessionResponseDTO toDTO(Session session){
        String userName = null;
        if (session.getUser() != null) {
            userName = session.getUser().getDisplayName() != null
                ? session.getUser().getDisplayName()
                : session.getUser().getUsername();
        }
        String therapistPic = session.getTherapist() != null
            ? session.getTherapist().getProfilePicturePath()
            : null;

        return SessionResponseDTO.builder()
                .id(session.getId())
                .clientUsername(session.getUser() != null ? session.getUser().getUsername() : null)
                .userName(userName)
                .therapistName(session.getTherapist() != null ? session.getTherapist().getName() : "Therapist")
                .therapistPicturePath(therapistPic)
                .sessionDate(session.getSessionDate())
                .sessionTime(session.getSessionTime())
                .sessionType(session.getSessionType())
                .therapyType(session.getTherapyType())
                .feeAmount(session.getFeeAmount())
                .priority(session.isPriority())
                .status(session.getStatus().name())
                .completedAt(session.getCompletedAt())
                .build();
    }
}