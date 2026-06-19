package com.example.mindcare.service;

import com.example.mindcare.dto.GroupRoomDto;
import com.example.mindcare.entity.GroupInvite;
import com.example.mindcare.entity.GroupMessage;
import com.example.mindcare.entity.GroupRoom;
import com.example.mindcare.entity.User;

import java.util.List;

public interface GroupService {
    // Room management (therapist only)
    GroupRoom createRoom(String therapistIdentifier, GroupRoomDto dto);

    List<GroupRoom> getActiveRooms();

    GroupRoom getRoom(Long id);

    // Membership
    boolean isMember(Long roomId, String userIdentifier);
    void addMember(Long roomId, User user);
    void joinByCode(String code, String userIdentifier);  // kept for backward compat
    GroupRoom joinByCodeAndReturn(String code, String userIdentifier);

    // Invite by email
    GroupInvite inviteByEmail(Long roomId, String therapistIdentifier, String invitedEmail);
    GroupRoom acceptInvite(String token, String userIdentifier);

    // Messaging
    GroupMessage sendMessage(Long roomId, String identifier, String content, boolean anonymous);
    List<GroupMessage> getRoomMessages(Long roomId);
    GroupMessage editMessage(Long messageId, String content, String userIdentifier);
    GroupMessage deleteMessage(Long messageId, String userIdentifier);

    void reportMessage(Long messageId, String reason);

    // Members list
    List<User> getRoomMembers(Long roomId);

    void deleteRoom(Long roomId, String therapistIdentifier);
    void leaveRoom(Long roomId, String userIdentifier);
}
