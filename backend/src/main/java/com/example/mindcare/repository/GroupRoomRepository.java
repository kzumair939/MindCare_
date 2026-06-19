package com.example.mindcare.repository;

import com.example.mindcare.entity.GroupRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GroupRoomRepository extends JpaRepository<GroupRoom, Long> {
    List<GroupRoom> findByActiveTrue();
    Optional<GroupRoom> findByJoinCode(String joinCode);
}
