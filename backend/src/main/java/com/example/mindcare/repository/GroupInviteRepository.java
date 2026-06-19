package com.example.mindcare.repository;

import com.example.mindcare.entity.GroupInvite;
import com.example.mindcare.entity.GroupRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupInviteRepository extends JpaRepository<GroupInvite, Long> {
    Optional<GroupInvite> findByToken(String token);
    List<GroupInvite> findByRoom(GroupRoom room);
    boolean existsByRoomAndInvitedEmail(GroupRoom room, String email);
    void deleteByRoom(GroupRoom room);
}
