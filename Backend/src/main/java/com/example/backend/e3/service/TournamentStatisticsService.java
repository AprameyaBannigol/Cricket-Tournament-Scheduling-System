package com.example.backend.e3.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.e2.entity.Fixture;
import com.example.backend.e2.entity.Match;
import com.example.backend.e2.entity.MatchConfiguration;
import com.example.backend.e2.entity.MatchResult;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.MatchConfigurationRepository;
import com.example.backend.e2.repository.MatchRepository;
import com.example.backend.e2.repository.MatchResultRepository;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e3.dto.StandingsRow;
import com.example.backend.e3.dto.TournamentAnalytics;

import jakarta.persistence.EntityNotFoundException;

@Service
public class TournamentStatisticsService {
    private static final BigDecimal SIX = BigDecimal.valueOf(6);
    private final TournamentRepository tournaments;
    private final FixtureRepository fixtures;
    private final TeamRepository teams;
    private final MatchResultRepository results;
    private final MatchConfigurationRepository configurations;
    private final ScheduleVersionRepository versions;
    private final MatchRepository matches;

    public TournamentStatisticsService(TournamentRepository tournaments, FixtureRepository fixtures,
            TeamRepository teams, MatchResultRepository results, MatchConfigurationRepository configurations,
            ScheduleVersionRepository versions, MatchRepository matches) {
        this.tournaments = tournaments;
        this.fixtures = fixtures;
        this.teams = teams;
        this.results = results;
        this.configurations = configurations;
        this.versions = versions;
        this.matches = matches;
    }

    @Transactional(readOnly = true)
    public List<StandingsRow> standings(Long tournamentId) {
        requireTournament(tournamentId);
        List<Fixture> tournamentFixtures = fixtures.findAllByTournament_TournamentId(tournamentId);
        Map<Long, MatchResult> resultByFixture = resultsByFixture(tournamentFixtures);
        MatchConfiguration config = configurations.findByTournament_TournamentId(tournamentId).orElse(null);
        Map<Long, TeamRecord> records = new HashMap<>();
        for (Team team : teams.findAllByTournament_TournamentId(tournamentId)) {
            records.put(team.getTeamId(), new TeamRecord(team));
        }

        for (Fixture fixture : tournamentFixtures) {
            TeamRecord first = records.get(fixture.getTeam1().getTeamId());
            TeamRecord second = records.get(fixture.getTeam2().getTeamId());
            MatchResult result = resultByFixture.get(fixture.getFixtureId());
            if (result == null) continue;
            String type = normalized(result.getResultType());
            if (type.equals("COMPLETED") || type.equals("TIED")) {
                first.played++;
                second.played++;
                applyInnings(first, result.getTeam1Score(), result.getTeam1Wickets(), result.getTeam1Overs(), config);
                applyInnings(second, result.getTeam2Score(), result.getTeam2Wickets(), result.getTeam2Overs(), config);
                applyRateInnings(first, result.getTeam2Score(), result.getTeam2Wickets(), result.getTeam2Overs(), config);
                applyRateInnings(second, result.getTeam1Score(), result.getTeam1Wickets(), result.getTeam1Overs(), config);
                if (type.equals("TIED")) {
                    first.tied++; second.tied++;
                    first.points = first.points.add(pointsTie(config));
                    second.points = second.points.add(pointsTie(config));
                } else {
                    Long winner = result.getWinnerTeam() == null ? null : result.getWinnerTeam().getTeamId();
                    if (winner != null && winner.equals(first.team.getTeamId())) {
                        first.won++; second.lost++;
                        first.points = first.points.add(pointsWin(config));
                        second.points = second.points.add(pointsLoss(config));
                    } else if (winner != null && winner.equals(second.team.getTeamId())) {
                        second.won++; first.lost++;
                        second.points = second.points.add(pointsWin(config));
                        first.points = first.points.add(pointsLoss(config));
                    }
                }
            } else if (type.equals("ABANDONED") || type.equals("NO_RESULT")) {
                first.played++; second.played++;
                first.noResult++; second.noResult++;
                first.points = first.points.add(pointsTie(config));
                second.points = second.points.add(pointsTie(config));
            }
        }

        List<TeamRecord> ordered = records.values().stream().sorted(Comparator
                .comparing((TeamRecord r) -> r.points).reversed()
                .thenComparing(TeamRecord::netRunRate, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(r -> r.team.getTeamName(), String.CASE_INSENSITIVE_ORDER)
                .thenComparing(r -> r.team.getTeamId())).toList();
        List<StandingsRow> rows = new ArrayList<>();
        for (int index = 0; index < ordered.size(); index++) {
            TeamRecord row = ordered.get(index);
            rows.add(new StandingsRow(index + 1, row.team.getTeamId(), row.team.getTeamName(), row.played,
                    row.won, row.lost, row.tied, row.noResult, row.points,
                    row.netRunRate() == null ? null : row.netRunRate().setScale(3, RoundingMode.HALF_UP)));
        }
        return rows;
    }

    @Transactional(readOnly = true)
    public TournamentAnalytics analytics(Long tournamentId) {
        requireTournament(tournamentId);
        List<Fixture> tournamentFixtures = fixtures.findAllByTournament_TournamentId(tournamentId);
        Map<Long, MatchResult> resultByFixture = resultsByFixture(tournamentFixtures);
        List<Team> tournamentTeams = teams.findAllByTournament_TournamentId(tournamentId);
        int completed = 0, tied = 0, abandoned = 0, noResult = 0;
        long totalRuns = 0, totalWickets = 0;
        Map<Long, int[]> teamWinsLosses = new HashMap<>();
        for (Team team : tournamentTeams) teamWinsLosses.put(team.getTeamId(), new int[2]);
        for (MatchResult result : resultByFixture.values()) {
            String type = normalized(result.getResultType());
            if (type.equals("COMPLETED")) completed++;
            else if (type.equals("TIED")) { completed++; tied++; }
            else if (type.equals("ABANDONED")) abandoned++;
            else if (type.equals("NO_RESULT")) noResult++;
            totalRuns += result.getTeam1Score() + result.getTeam2Score();
            totalWickets += result.getTeam1Wickets() + result.getTeam2Wickets();
            if (type.equals("COMPLETED") && result.getWinnerTeam() != null) {
                Long winnerId = result.getWinnerTeam().getTeamId();
                Long loserId = result.getFixture().getTeam1().getTeamId().equals(winnerId)
                        ? result.getFixture().getTeam2().getTeamId() : result.getFixture().getTeam1().getTeamId();
                teamWinsLosses.computeIfAbsent(winnerId, ignored -> new int[2])[0]++;
                teamWinsLosses.computeIfAbsent(loserId, ignored -> new int[2])[1]++;
            }
        }
        int noResultMatches = abandoned + noResult;
        int pending = Math.max(0, tournamentFixtures.size() - completed - noResultMatches);
        BigDecimal completion = tournamentFixtures.isEmpty() ? BigDecimal.ZERO
                : BigDecimal.valueOf(completed + noResultMatches).multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(tournamentFixtures.size()), 2, RoundingMode.HALF_UP);
        List<TournamentAnalytics.TeamPerformance> performance = tournamentTeams.stream()
                .map(team -> {
                    int[] record = teamWinsLosses.get(team.getTeamId());
                    return new TournamentAnalytics.TeamPerformance(team.getTeamId(), team.getTeamName(), record[0], record[1]);
                }).sorted(Comparator.comparingInt(TournamentAnalytics.TeamPerformance::wins).reversed()
                    .thenComparingInt(TournamentAnalytics.TeamPerformance::losses)
                    .thenComparing(TournamentAnalytics.TeamPerformance::team, String.CASE_INSENSITIVE_ORDER)).toList();
        Map<Long, StadiumCount> stadiumCounts = latestMatches(tournamentId).values().stream()
                .collect(Collectors.toMap(match -> match.getStadium().getStadiumId(),
                        match -> new StadiumCount(match.getStadium().getStadiumId(), match.getStadium().getName(), 1),
                        (a, b) -> new StadiumCount(a.id, a.name, a.fixtures + b.fixtures)));
        List<TournamentAnalytics.StadiumUsage> stadiumUsage = stadiumCounts.values().stream()
                .sorted(Comparator.comparingInt((StadiumCount item) -> item.fixtures).reversed()
                        .thenComparing(item -> item.name, String.CASE_INSENSITIVE_ORDER))
                .map(item -> new TournamentAnalytics.StadiumUsage(item.id, item.name, item.fixtures)).toList();
        return new TournamentAnalytics(tournamentId, tournamentTeams.size(), tournamentFixtures.size(), completed,
                pending, noResultMatches, completion, totalRuns, totalWickets, performance,
                new TournamentAnalytics.ResultDistribution(completed - tied, tied, abandoned, noResult), stadiumUsage);
    }

    private Map<Long, MatchResult> resultsByFixture(List<Fixture> tournamentFixtures) {
        if (tournamentFixtures.isEmpty()) return Map.of();
        List<Long> ids = tournamentFixtures.stream().map(Fixture::getFixtureId).toList();
        return results.findAllByFixture_FixtureIdIn(ids).stream()
                .collect(Collectors.toMap(result -> result.getFixture().getFixtureId(), result -> result));
    }

    private Map<Long, Match> latestMatches(Long tournamentId) {
        Map<Long, Match> latest = new HashMap<>();
        for (ScheduleVersion version : versions.findAllByTournament_TournamentId(tournamentId)) {
            for (Match match : matches.findAllByScheduleVersion_VersionId(version.getVersionId())) {
                Long fixtureId = match.getFixture().getFixtureId();
                Match previous = latest.get(fixtureId);
                if (previous == null || match.getScheduleVersion().getCreatedAt()
                        .isAfter(previous.getScheduleVersion().getCreatedAt())) latest.put(fixtureId, match);
            }
        }
        return latest;
    }

    private void requireTournament(Long id) {
        if (id == null || id < 1) throw new IllegalArgumentException("Tournament ID must be positive");
        tournaments.findById(id).orElseThrow(() -> new EntityNotFoundException("Tournament not found: " + id));
    }
    private static String normalized(String value) { return value == null ? "" : value.trim().toUpperCase(); }
    private static BigDecimal pointsWin(MatchConfiguration c) { return c == null ? BigDecimal.valueOf(2) : c.getPointsForWin(); }
    private static BigDecimal pointsTie(MatchConfiguration c) { return c == null ? BigDecimal.ONE : c.getPointsForTie(); }
    private static BigDecimal pointsLoss(MatchConfiguration c) { return c == null ? BigDecimal.ZERO : c.getPointsForLoss(); }
    private static void applyInnings(TeamRecord record, int runs, int wickets, java.math.BigDecimal overs,
            MatchConfiguration config) {
        if (wickets >= 10 && config == null) record.nrrAvailable = false;
        record.runsFor += runs;
        record.ballsFaced += inningsBalls(overs, wickets, config);
    }
    private static void applyRateInnings(TeamRecord record, int runs, int wickets, java.math.BigDecimal overs,
            MatchConfiguration config) {
        if (wickets >= 10 && config == null) record.nrrAvailable = false;
        record.runsAgainst += runs;
        record.ballsBowled += inningsBalls(overs, wickets, config);
    }
    private static long inningsBalls(java.math.BigDecimal overs, int wickets, MatchConfiguration config) {
        if (wickets >= 10 && config != null) return config.getOversPerInnings() * 6L;
        return cricketBalls(overs);
    }
    static long cricketBalls(java.math.BigDecimal overs) {
        BigDecimal value = overs.stripTrailingZeros();
        int completeOvers = value.intValue();
        BigDecimal fractional = value.subtract(BigDecimal.valueOf(completeOvers));
        int balls = fractional.movePointRight(1).intValueExact();
        if (balls < 0 || balls > 5) throw new IllegalArgumentException("Invalid persisted cricket overs: " + overs);
        return completeOvers * 6L + balls;
    }
    private static final class TeamRecord {
        final Team team;
        int played, won, lost, tied, noResult;
        boolean nrrAvailable = true;
        BigDecimal points = BigDecimal.ZERO;
        long runsFor, runsAgainst, ballsFaced, ballsBowled;
        TeamRecord(Team team) { this.team = team; }
        BigDecimal netRunRate() {
            if (!nrrAvailable) return null;
            if (ballsFaced == 0 || ballsBowled == 0) return BigDecimal.ZERO;
            BigDecimal scored = BigDecimal.valueOf(runsFor).multiply(SIX).divide(BigDecimal.valueOf(ballsFaced), 8, RoundingMode.HALF_UP);
            BigDecimal conceded = BigDecimal.valueOf(runsAgainst).multiply(SIX).divide(BigDecimal.valueOf(ballsBowled), 8, RoundingMode.HALF_UP);
            return scored.subtract(conceded);
        }
    }
    private record StadiumCount(Long id, String name, int fixtures) { }
}
