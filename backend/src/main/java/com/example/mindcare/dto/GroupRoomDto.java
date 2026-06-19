package com.example.mindcare.dto;

import lombok.Data;

@Data
public class GroupRoomDto {
    private String name;
    private String topic;
    private Integer maxMembers;
}
