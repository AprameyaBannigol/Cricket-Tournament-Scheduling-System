package com.example.backend.dto;

import java.util.List;

public record SchedulingResult(
    Long tournamentId,
    Status status,
    List<MatchFixture> fixtures
) {
    public enum Status {
        FIXTURES_GENERATED
    }
}
