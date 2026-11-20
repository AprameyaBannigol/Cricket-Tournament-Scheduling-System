package com.example.backend.e2.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult.Status;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "DB_USERNAME", matches = ".+")
class TournamentScheduleDatabaseIntegrationTest {

    @Autowired
    private TournamentScheduleOrchestrationService orchestrationService;

    @Test
    void tournamentOneProducesAValidatedSixMatchRoundRobinSchedule() {
        CompleteSchedulingResult result = orchestrationService.generateSchedule(1L);

        assertEquals(Status.SCHEDULE_GENERATED, result.status(), result.conflicts().toString());
        assertEquals(6, result.totalFixtures());
        assertEquals(6, result.scheduledMatches());
        assertTrue(result.conflicts().isEmpty());
        assertEquals(6, result.matches().stream()
            .map(match -> {
                long first = match.fixture().team1Id();
                long second = match.fixture().team2Id();
                return Math.min(first, second) + ":" + Math.max(first, second);
            })
            .collect(Collectors.toSet()).size());
        assertTrue(result.matches().stream().allMatch(match ->
            match.officialIds().size() == 3
                && new HashSet<>(match.officialIds()).size() == 3
                && Duration.between(match.startTime(), match.endTime())
                    .equals(Duration.ofMinutes(210))
                && !match.startTime().toLocalDate().isBefore(LocalDate.of(2026, 12, 1))
                && !match.endTime().toLocalDate().isAfter(LocalDate.of(2026, 12, 10))));
    }
}
