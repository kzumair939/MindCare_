package com.example.mindcare.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Caffeine-backed Spring Cache configuration.
 *
 * Each named cache is tuned to its specific read/write ratio:
 *  - therapists / activeTherapists / therapistById : 10 min TTL, changes only when admin edits
 *  - userDetails / userByIdentifier               :  5 min TTL, called on every authenticated request
 *  - surveyResult                                 : 30 min TTL, rarely changes after submission
 *  - activeGroups                                 :  2 min TTL, changes on join/create/delete
 *  - analyticsData                                :  3 min TTL, expensive aggregate, low staleness tolerance
 */
@Configuration
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        List<CaffeineCache> caches = List.of(
            build("therapists",        10, TimeUnit.MINUTES, 200),
            build("activeTherapists",  10, TimeUnit.MINUTES, 200),
            build("therapistById",     10, TimeUnit.MINUTES, 200),
            build("userDetails",        5, TimeUnit.MINUTES, 500),
            build("userByIdentifier",   5, TimeUnit.MINUTES, 500),
            build("surveyResult",      30, TimeUnit.MINUTES, 500),
            build("activeGroups",       2, TimeUnit.MINUTES,  50),
            build("analyticsData",      3, TimeUnit.MINUTES,  10)
        );

        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(caches);
        return manager;
    }

    private CaffeineCache build(String name, long ttl, TimeUnit unit, long maxSize) {
        return new CaffeineCache(name,
            Caffeine.newBuilder()
                .expireAfterWrite(ttl, unit)
                .maximumSize(maxSize)
                .recordStats()          // enables hit/miss metrics (viewable via actuator or logs)
                .build());
    }
}
