package com.example.backend.e3.dto;

import java.math.BigDecimal;
import java.util.List;

public record TournamentAnalytics(
        Long tournamentId, int totalTeams, int totalFixtures, int completedMatches,
        int pendingMatches, int noResultMatches, BigDecimal completionPercentage,
        long totalRuns, long totalWickets, List<TeamPerformance> teamPerformance,
        ResultDistribution resultDistribution, List<StadiumUsage> stadiumUsage) {

    public record TeamPerformance(Long teamId, String team, int wins, int losses) { }
    public record ResultDistribution(int completed, int tied, int abandoned, int noResult) { }
    public record StadiumUsage(Long stadiumId, String stadium, int fixtures) { }
}
