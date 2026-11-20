package com.example.backend.e2.service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.e2.dto.MatchResultRequest;
import com.example.backend.e2.dto.TournamentMatchResult;
import com.example.backend.e2.dto.TournamentMatchResult.Result;
import com.example.backend.e2.entity.Fixture;
import com.example.backend.e2.entity.Match;
import com.example.backend.e2.entity.MatchResult;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.MatchRepository;
import com.example.backend.e2.repository.MatchResultRepository;
import com.example.backend.e2.repository.MatchConfigurationRepository;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.TournamentRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class MatchResultService {
    private static final Set<String> TYPES = Set.of("COMPLETED", "TIED", "ABANDONED", "NO_RESULT");
    private final TournamentRepository tournaments;
    private final FixtureRepository fixtures;
    private final MatchRepository matches;
    private final MatchResultRepository results;
    private final ScheduleVersionRepository versions;
    private final MatchConfigurationRepository configurations;

    public MatchResultService(TournamentRepository tournaments, FixtureRepository fixtures,
            MatchRepository matches, MatchResultRepository results, ScheduleVersionRepository versions,
            MatchConfigurationRepository configurations) {
        this.tournaments = tournaments;
        this.fixtures = fixtures;
        this.matches = matches;
        this.results = results;
        this.versions = versions;
        this.configurations = configurations;
    }

    @Transactional(readOnly = true)
    public List<TournamentMatchResult> list(Long tournamentId) {
        requireTournament(tournamentId);
        return fixtures.findAllByTournament_TournamentId(tournamentId).stream()
            .map(fixture -> findLatestMatch(tournamentId, fixture))
            .filter(java.util.Optional::isPresent).map(java.util.Optional::get)
            .map(this::map).sorted(Comparator.comparing(TournamentMatchResult::startTime)
                .thenComparing(TournamentMatchResult::matchNumber)).toList();
    }

    @Transactional(readOnly = true)
    public TournamentMatchResult get(Long tournamentId, Long fixtureId) {
        requireTournament(tournamentId);
        Fixture fixture = fixture(tournamentId, fixtureId);
        Match match = findLatestMatch(tournamentId, fixture)
            .orElseThrow(() -> new EntityNotFoundException("Scheduled match not found"));
        return map(match);
    }

    @Transactional
    public TournamentMatchResult save(Long tournamentId, Long fixtureId, MatchResultRequest request) {
        requireTournament(tournamentId);
        Fixture fixture = fixture(tournamentId, fixtureId);
        Match match = findLatestMatch(tournamentId, fixture)
            .orElseThrow(() -> new EntityNotFoundException("Scheduled match not found"));
        String type = request.resultType().trim().toUpperCase(Locale.ROOT);
        if (!TYPES.contains(type)) throw new IllegalArgumentException("Unsupported result type");
        int oversLimit = configurations.findByTournament_TournamentId(tournamentId)
            .map(configuration -> configuration.getOversPerInnings())
            .orElseThrow(() -> new IllegalArgumentException(
                "Save the tournament match configuration before entering results"));
        validateOvers(request.team1Overs(), oversLimit);
        validateOvers(request.team2Overs(), oversLimit);
        if (request.team1Wickets() > 10 || request.team2Wickets() > 10)
            throw new IllegalArgumentException("Wickets must be from 0 to 10");
        Team winner = null;
        Integer margin = null;
        if (type.equals("COMPLETED")) {
            if (request.team1Score().equals(request.team2Score()))
                throw new IllegalArgumentException("A completed match cannot have tied scores. Use TIED.");
            winner = request.team1Score() > request.team2Score() ? fixture.getTeam1() : fixture.getTeam2();
            margin = Math.abs(request.team1Score() - request.team2Score());
        } else if (type.equals("TIED") && !request.team1Score().equals(request.team2Score())) {
            throw new IllegalArgumentException("A tied result requires equal scores");
        }
        if ((type.equals("COMPLETED") || type.equals("TIED"))
                && (oversToBalls(request.team1Overs()) == 0 || oversToBalls(request.team2Overs()) == 0)) {
            throw new IllegalArgumentException("Completed and tied innings must include at least one legal ball");
        }
        MatchResult result = results.findByFixture_FixtureId(fixtureId).orElseGet(MatchResult::new);
        result.setFixture(fixture);
        result.setMatch(match);
        result.setTeam1Score(request.team1Score());
        result.setTeam1Wickets(request.team1Wickets());
        result.setTeam1Overs(overs(request.team1Overs()));
        result.setTeam2Score(request.team2Score());
        result.setTeam2Wickets(request.team2Wickets());
        result.setTeam2Overs(overs(request.team2Overs()));
        result.setWinnerTeam(winner);
        result.setWinningMargin(margin);
        result.setResultType(type);
        result.setRemarks(request.remarks());
        results.saveAndFlush(result);
        return map(match);
    }

    private java.util.Optional<Match> findLatestMatch(Long tournamentId, Fixture fixture) {
        return versions.findAllByTournament_TournamentId(tournamentId).stream()
            .flatMap(version -> matches.findAllByScheduleVersion_VersionId(version.getVersionId()).stream())
            .filter(match -> match.getFixture().getFixtureId().equals(fixture.getFixtureId()))
            .max(Comparator.comparing(match -> match.getScheduleVersion().getCreatedAt()));
    }
    private Fixture fixture(Long tournamentId, Long fixtureId) {
        Fixture fixture = fixtures.findById(fixtureId).orElseThrow(() -> new EntityNotFoundException("Fixture not found"));
        if (!fixture.getTournament().getTournamentId().equals(tournamentId))
            throw new EntityNotFoundException("Fixture not found in tournament");
        return fixture;
    }
    private void requireTournament(Long id) {
        if (id == null || id < 1) throw new IllegalArgumentException("Tournament ID must be positive");
        tournaments.findById(id).orElseThrow(() -> new EntityNotFoundException("Tournament not found: " + id));
    }
    private static void validateOvers(String value, int limit) {
        if (value == null || !value.matches("\\d{1,3}(\\.[0-5])?"))
            throw new IllegalArgumentException("Overs must use cricket notation such as 17.3");
        String[] parts = value.split("\\.");
        int overs = Integer.parseInt(parts[0]);
        int balls = parts.length == 1 ? 0 : Integer.parseInt(parts[1]);
        if (overs > limit || (overs == limit && balls > 0))
            throw new IllegalArgumentException("Overs must be greater than zero and no more than " + limit);
    }
    private static int oversToBalls(String value) {
        String[] parts = value.split("\\.");
        return Integer.parseInt(parts[0]) * 6 + (parts.length == 1 ? 0 : Integer.parseInt(parts[1]));
    }
    private static BigDecimal overs(String value) {
        String[] parts = value.split("\\.");
        return new BigDecimal(parts[0]).add(new BigDecimal(parts.length == 1 ? "0" : parts[1])
            .divide(new BigDecimal("10")));
    }
    private TournamentMatchResult map(Match match) {
        Fixture fixture = match.getFixture();
        MatchResult row = results.findByFixture_FixtureId(fixture.getFixtureId()).orElse(null);
        Result result = row == null ? null : new Result(row.getResultId(), row.getResultType(),
            row.getTeam1Score(), row.getTeam1Wickets(), row.getTeam1Overs().toPlainString(),
            row.getTeam2Score(), row.getTeam2Wickets(), row.getTeam2Overs().toPlainString(),
            row.getWinnerTeam() == null ? null : row.getWinnerTeam().getTeamId(),
            row.getWinnerTeam() == null ? null : row.getWinnerTeam().getTeamName(),
            row.getWinningMargin(), row.getRemarks());
        ScheduleVersion version = match.getScheduleVersion();
        return new TournamentMatchResult(fixture.getTournament().getTournamentId(), fixture.getFixtureId(),
            match.getMatchId(), version.getVersionId(), version.getVersionName(), fixture.getRoundNumber(),
            fixture.getMatchNumber(), fixture.getTeam1().getTeamName(), fixture.getTeam2().getTeamName(),
            match.getStadium().getStadiumId(), match.getStadium().getName(), match.getStartTime(),
            match.getEndTime(), result);
    }
}
