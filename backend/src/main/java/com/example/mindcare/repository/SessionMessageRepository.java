package com.example.mindcare.repository;

import com.example.mindcare.entity.SessionMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionMessageRepository extends JpaRepository<SessionMessage, Long> {
    List<SessionMessage> findAllBySessionIdOrderBySentAtAsc(Long sessionId);
}
