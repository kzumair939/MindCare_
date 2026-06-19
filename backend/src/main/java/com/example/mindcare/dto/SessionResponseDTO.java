package com.example.mindcare.dto;

import com.example.mindcare.Enum.TherapyType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class SessionResponseDTO {

    private Long id;
    private String clientUsername;
    private String userName;
    private String therapistName;
    private String therapistPicturePath;
    private LocalDate sessionDate;
    private LocalTime sessionTime;
    private String sessionType;
    private TherapyType therapyType;
    private Integer feeAmount;
    private boolean priority;
    private String status;

    private LocalDateTime completedAt;
}
