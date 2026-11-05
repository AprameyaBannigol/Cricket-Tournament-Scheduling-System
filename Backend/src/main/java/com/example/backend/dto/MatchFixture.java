package com.example.backend.dto;

public record MatchFixture(
    int round,
    int matchNumber,
    Long team1Id,
    String team1,
    Long team2Id,
    String team2
) {
}
