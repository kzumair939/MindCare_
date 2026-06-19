package com.example.mindcare.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs on startup to apply any DB schema fixups that Hibernate ddl-auto=update
 * cannot handle (e.g., converting a MySQL ENUM column to VARCHAR so that new
 * enum values like CONFIRMED can be persisted without "Data truncated" errors).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DbSchemaFixupRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Convert sessions.status from ENUM (if it is one) to VARCHAR(50)
            jdbc.execute(
                "ALTER TABLE sessions MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'BOOKED'"
            );
            log.info("[DB Fixup] sessions.status column updated to VARCHAR(50)");
        } catch (Exception e) {
            // Column may already be VARCHAR or table doesn't exist yet — safe to ignore
            log.debug("[DB Fixup] sessions.status ALTER skipped: {}", e.getMessage());
        }
    }
}
