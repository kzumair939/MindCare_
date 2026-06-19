package com.example.mindcare.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GroupMessageDto {
    private Long id;
    private Long roomId;
    private String content;
    private String senderName;
    private boolean anonymous;
    private LocalDateTime sentAt;
    private boolean reported;
}
