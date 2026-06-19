package com.example.mindcare.repository;

import com.example.mindcare.Enum.AppointmentStatus;
import com.example.mindcare.entity.Session;
import com.example.mindcare.entity.Therapist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface SessionRepository extends JpaRepository<Session,Long> {

    //check for double booking
    boolean existsByTherapistAndSessionDateAndSessionTimeAndStatus(
            Therapist therapist,
            LocalDate date,
            LocalTime time,
            AppointmentStatus status
    );

    // Get all booked/confirmed sessions for a therapist on a given date
    List<Session> findAllByTherapist_IdAndSessionDateAndStatusIn(
            Long therapistId,
            LocalDate sessionDate,
            List<AppointmentStatus> statuses
    );

    List<Session> findAllByUser_Email(String email);

    long countByUser_EmailAndStatus(String email, AppointmentStatus status);

    List<Session> findAllByTherapist_UserAccount_Email(String email);

    List<Session> findAllByStatus(AppointmentStatus status);

    //get all session for a user
    List<Session> findByUserId(Long userId);


    List<Session> findAllByUser_Username(String username);

    List<Session> findAllByTherapist_UserAccount_Username(String username);

    long countByUser_UsernameAndStatus(String username, AppointmentStatus status);

    @Query("select s from Session s where s.status = :status " +
            "and ( (s.sessionDate > :fromDate) or (s.sessionDate = :fromDate and s.sessionTime >= :fromTime) ) " +
            "and ( (s.sessionDate < :toDate) or (s.sessionDate = :toDate and s.sessionTime <= :toTime) )")
    List<Session> findBetween(
            @Param("status") AppointmentStatus status,
            @Param("fromDate") LocalDate fromDate,
            @Param("fromTime") LocalTime fromTime,
            @Param("toDate") LocalDate toDate,
            @Param("toTime") LocalTime toTime);



}
