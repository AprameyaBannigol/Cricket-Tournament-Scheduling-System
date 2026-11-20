package com.example.backend.e2.dto;

import java.time.LocalDateTime;

public record TournamentMatchResult(
        Long tournamentId, Long fixtureId, Long matchId, Long versionId, String versionName,
        int round, int matchNumber, String team1, String team2, Long stadiumId, String stadium,
        LocalDateTime startTime, LocalDateTime endTime, Result result) {
    public record Result(Long resultId, String resultType, int team1Score, int team1Wickets,
            String team1Overs, int team2Score, int team2Wickets, String team2Overs,
            Long winnerTeamId, String winner, Integer winningMargin, String remarks) {
    }
}
