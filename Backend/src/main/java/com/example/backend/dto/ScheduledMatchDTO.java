package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ScheduledMatchDTO(
    MatchFixture fixture,
    LocalDateTime startTime,
    LocalDateTime endTime,
    Long stadiumId,
    String stadiumName,
    List<Long> officialIds
) {
}
