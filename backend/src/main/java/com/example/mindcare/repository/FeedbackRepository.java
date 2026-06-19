package com.example.mindcare.repository;

import com.example.mindcare.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findBySession_Id(Long sessionId);
    boolean existsBySession_Id(Long sessionId);

    @Query("select avg(f.rating) from Feedback f")
    Double avgRating();

    @Query("select f.therapist.id, avg(f.rating) from Feedback f group by f.therapist.id")
    List<Object[]> avgRatingByTherapist();

    @Query("select count(f) from Feedback f")
    Long totalCount();

    @Query("select date(f.createdAt), avg(f.rating) from Feedback f where f.createdAt >= :from group by date(f.createdAt) order by date(f.createdAt)")
    List<Object[]> dailyAvgRating(@Param("from") LocalDateTime from);
}
