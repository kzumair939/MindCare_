package com.example.mindcare.dto;

import com.example.mindcare.Enum.TherapyType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionRequestDTO {

    private Long therapistId;
    private LocalDate date;
    private LocalTime time;
    /** Online / In-person */
    private String sessionType;

    private TherapyType therapyType;
}
