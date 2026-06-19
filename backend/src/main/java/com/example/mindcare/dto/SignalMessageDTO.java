package com.example.mindcare.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalMessageDTO {
    private String from;
    private String type; // offer | answer | ice | join
    private String data; // JSON string payload
}
