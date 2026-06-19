package com.example.mindcare.service.impl;

import com.example.mindcare.dto.GroupRoomDto;
import com.example.mindcare.entity.*;
import com.example.mindcare.exception.BadRequestException;
import com.example.mindcare.exception.NotFoundException;
import com.example.mindcare.repository.*;
import com.example.mindcare.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupRoomRepository roomRepository;
    private final GroupMessageRepository messageRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    // ─── helpers ────────────────────────────────────────────────
    private User findUser(String identifier) {
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new NotFoundException("User not found: " + identifier));
    }

    private String generateJoinCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        Random r = new Random();
        for (int i = 0; i < 6; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
        return sb.toString();
    }

    // ─── room creation (therapist only) ────────────────────────
    @Override
    public GroupRoom createRoom(String therapistIdentifier, GroupRoomDto dto) {
        User user = findUser(therapistIdentifier);
        // Only ROLE_THERAPIST may create rooms
        if (user.getRole() == null || !user.getRole().name().equals("ROLE_THERAPIST")) {
            throw new BadRequestException("Only therapists can create group rooms");
        }

        // Unique join code — temp variable needed because lambdas require effectively final
        String code = generateJoinCode();
        while (roomRepository.findByJoinCode(code).isPresent()) {
            code = generateJoinCode();
        }

        GroupRoom room = GroupRoom.builder()
                .name(dto.getName())
                .topic(dto.getTopic())
                .maxMembers(dto.getMaxMembers() != null ? dto.getMaxMembers() : 10)
                .active(true)
                .createdBy(user)
                .joinCode(code)
                .build();
        GroupRoom saved = roomRepository.save(room);

        // Therapist is auto-member
        addMember(saved.getId(), user);
        return saved;
    }

    // ─── membership ─────────────────────────────────────────────
    @Override
    public boolean isMember(Long roomId, String userIdentifier) {
        try {
            GroupRoom room = getRoom(roomId);
            User user = userRepository.findByEmail(userIdentifier)
                    .or(() -> userRepository.findByUsername(userIdentifier))
                    .orElse(null);
            if (user == null) return false;
            return memberRepository.existsByRoomAndUser(room, user);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public void addMember(Long roomId, User user) {
        GroupRoom room = getRoom(roomId);
        if (!memberRepository.existsByRoomAndUser(room, user)) {
            memberRepository.save(GroupMember.builder().room(room).user(user).build());
        }
    }

    @Override
    @Transactional
    public void joinByCode(String code, String userIdentifier) {
        joinByCodeAndReturn(code, userIdentifier);
    }

    @Override
    @Transactional
    public GroupRoom joinByCodeAndReturn(String code, String userIdentifier) {
        GroupRoom room = roomRepository.findByJoinCode(code.toUpperCase())
                .filter(GroupRoom::isActive)
                .orElseThrow(() -> new BadRequestException("Invalid or expired join code"));

        User user = findUser(userIdentifier);
        long memberCount = memberRepository.findByRoom(room).size();
        if (memberCount >= room.getMaxMembers()) {
            throw new BadRequestException("This group is full");
        }
        addMember(room.getId(), user);
        return room;
    }

    // ─── email invite ────────────────────────────────────────────
    @Override
    @Transactional
    public GroupInvite inviteByEmail(Long roomId, String therapistIdentifier, String invitedEmail) {
        GroupRoom room = getRoom(roomId);
        User therapist = findUser(therapistIdentifier);
        if (therapist.getRole() == null || !therapist.getRole().name().equals("ROLE_THERAPIST")) {
            throw new BadRequestException("Only therapists can send invites");
        }

        String token = UUID.randomUUID().toString();
        GroupInvite invite = GroupInvite.builder()
                .room(room)
                .invitedEmail(invitedEmail)
                .token(token)
                .used(false)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        GroupInvite saved = inviteRepository.save(invite);

        String link = baseUrl + "/group/join/invite?token=" + token;
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(invitedEmail);
            msg.setSubject("You've been invited to a MindCare support group: " + room.getName());
            msg.setText("Hello,\n\nYou have been invited to join the support group \"" + room.getName()
                    + "\" on MindCare.\n\nClick the link below to join:\n" + link
                    + "\n\nThis link expires in 7 days.\n\nTake care,\nThe MindCare Team");
            mailSender.send(msg);
        } catch (Exception e) {
            throw new BadRequestException("Could not send invite email: " + e.getMessage());
        }
        return saved;
    }

    @Override
    @Transactional
    public GroupRoom acceptInvite(String token, String userIdentifier) {
        GroupInvite invite = inviteRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid invite link"));
        if (invite.isUsed()) throw new BadRequestException("This invite has already been used");
        if (LocalDateTime.now().isAfter(invite.getExpiresAt()))
            throw new BadRequestException("This invite link has expired");

        User user = findUser(userIdentifier);

        // Optionally enforce email match
        if (!user.getEmail().equalsIgnoreCase(invite.getInvitedEmail())) {
            throw new BadRequestException("This invite was sent to a different email address");
        }

        addMember(invite.getRoom().getId(), user);
        invite.setUsed(true);
        inviteRepository.save(invite);
        return invite.getRoom();
    }

    // ─── room queries ─────────────────────────────────────────────
    @Override
    public List<GroupRoom> getActiveRooms() {
        return roomRepository.findByActiveTrue();
    }

    @Override
    public GroupRoom getRoom(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Room not found"));
    }

    @Override
    public List<User> getRoomMembers(Long roomId) {
        GroupRoom room = getRoom(roomId);
        return memberRepository.findByRoom(room).stream()
                .map(GroupMember::getUser)
                .collect(Collectors.toList());
    }

    // ─── messaging ───────────────────────────────────────────────
    @Override
    public GroupMessage sendMessage(Long roomId, String identifier, String content, boolean anonymous) {
        GroupRoom room = getRoom(roomId);
        User user = findUser(identifier);

        if (!memberRepository.existsByRoomAndUser(room, user)) {
            throw new BadRequestException("You are not a member of this group");
        }

        String alias = anonymous
                ? (user.getAnonymousAlias() != null ? user.getAnonymousAlias() : "Anonymous")
                : null;

        GroupMessage msg = GroupMessage.builder()
                .room(room)
                .sender(user)
                .content(content)
                .anonymous(anonymous)
                .anonymousAlias(alias)
                .build();
        return messageRepository.save(msg);
    }

    @Override
    public List<GroupMessage> getRoomMessages(Long roomId) {
        return messageRepository.findByRoomIdOrderBySentAtAsc(roomId);
    }

    @Override
    @Transactional
    public GroupMessage editMessage(Long messageId, String content, String userIdentifier) {
        GroupMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found: " + messageId));
        User user = findUser(userIdentifier);
        if (msg.getSender() == null || !msg.getSender().getId().equals(user.getId())) {
            throw new BadRequestException("You can only edit your own messages");
        }
        if (msg.isDeleted()) {
            throw new BadRequestException("Cannot edit a deleted message");
        }
        msg.setContent(content);
        msg.setEdited(true);
        return messageRepository.save(msg);
    }

    @Override
    @Transactional
    public GroupMessage deleteMessage(Long messageId, String userIdentifier) {
        GroupMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found: " + messageId));
        User user = findUser(userIdentifier);
        if (msg.getSender() == null || !msg.getSender().getId().equals(user.getId())) {
            throw new BadRequestException("You can only delete your own messages");
        }
        msg.setDeleted(true);
        msg.setContent("This message was deleted");
        return messageRepository.save(msg);
    }

    @Override
    public void reportMessage(Long messageId, String reason) {
        GroupMessage msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found"));
        msg.setReported(true);
        msg.setReportReason(reason);
        messageRepository.save(msg);
    }

    @Override
    @Transactional
    public void deleteRoom(Long roomId, String therapistIdentifier) {
        GroupRoom room = getRoom(roomId);
        User user = findUser(therapistIdentifier);

        if (user.getRole() == null || !user.getRole().name().equals("ROLE_THERAPIST")) {
            throw new BadRequestException("Only therapists can delete group rooms");
        }
        if (room.getCreatedBy() != null && !room.getCreatedBy().getId().equals(user.getId())) {
            throw new BadRequestException("Only the creator therapist of this group can delete it");
        }

        messageRepository.deleteByRoom(room);
        memberRepository.deleteByRoom(room);
        inviteRepository.deleteByRoom(room);
        roomRepository.delete(room);
    }

    @Override
    @Transactional
    public void leaveRoom(Long roomId, String userIdentifier) {
        GroupRoom room = getRoom(roomId);
        User user = findUser(userIdentifier);

        GroupMember member = memberRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this support group"));

        memberRepository.delete(member);
    }
}
