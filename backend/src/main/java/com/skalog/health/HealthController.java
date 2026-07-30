package com.skalog.health;

import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public Map<String, String> health() {
        String db;
        try {
            jdbcTemplate.queryForObject("select 1", Integer.class);
            db = "up";
        } catch (Exception e) {
            db = "down";
        }
        return Map.of(
                "status", "ok",
                "db", db,
                "time", OffsetDateTime.now().toString());
    }
}
