package com.example.mindcare.repository;

import com.example.mindcare.entity.GroupMember;
import com.example.mindcare.entity.GroupRoom;
import com.example.mindcare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByRoom(GroupRoom room);
    boolean existsByRoomAndUser(GroupRoom room, User user);
    Optional<GroupMember> findByRoomAndUser(GroupRoom room, User user);
    List<GroupMember> findByUser(User user);
    void deleteByRoom(GroupRoom room);
}
