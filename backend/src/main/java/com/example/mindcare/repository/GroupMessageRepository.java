package com.example.mindcare.repository;

import com.example.mindcare.entity.GroupMessage;
import com.example.mindcare.entity.GroupRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GroupMessageRepository extends JpaRepository<GroupMessage, Long> {
    List<GroupMessage> findByRoomIdOrderBySentAtAsc(Long roomId);
    List<GroupMessage> findByRoomIdAndReportedTrue(Long roomId);
    void deleteByRoom(GroupRoom room);
}
