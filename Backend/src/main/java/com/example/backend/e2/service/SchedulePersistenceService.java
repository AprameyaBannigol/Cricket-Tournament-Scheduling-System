package com.example.backend.e2.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.e2.dto.SavedSchedule;
import com.example.backend.e2.dto.ScheduleVersionSummary;
import com.example.backend.e2.dto.SavedSchedule.OfficialAssignment;
import com.example.backend.e2.dto.SavedSchedule.SavedMatch;
import com.example.backend.e2.entity.Fixture;
import com.example.backend.e2.entity.Match;
import com.example.backend.e2.entity.MatchOfficial;
import com.example.backend.e2.entity.MatchOfficialId;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.MatchOfficialRepository;
import com.example.backend.e2.repository.MatchRepository;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;

@Service
public class SchedulePersistenceService {

    private final TournamentRepository tournaments;
    private final TeamRepository teams;
    private final StadiumRepository stadiums;
    private final OfficialRepository officials;
    private final ScheduleVersionRepository versions;
    private final FixtureRepository fixtures;
    private final MatchRepository matches;
    private final MatchOfficialRepository assignments;

    public SchedulePersistenceService(TournamentRepository tournaments, TeamRepository teams,
            StadiumRepository stadiums, OfficialRepository officials, ScheduleVersionRepository versions,
            FixtureRepository fixtures, MatchRepository matches, MatchOfficialRepository assignments) {
        this.tournaments = tournaments;
        this.teams = teams;
        this.stadiums = stadiums;
        this.officials = officials;
        this.versions = versions;
        this.fixtures = fixtures;
        this.matches = matches;
        this.assignments = assignments;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Long saveSchedule(Long tournamentId, String versionName, CompleteSchedulingResult result) {
        validateResult(tournamentId, versionName, result);
        var tournament = tournaments.findById(tournamentId)
            .orElseThrow(() -> new IllegalArgumentException("Unknown tournament " + tournamentId));
        if (versions.existsByTournament_TournamentIdAndVersionName(tournamentId, versionName)) {
            throw new DuplicateScheduleVersionException(tournamentId, versionName);
        }

        Map<Long, Team> tournamentTeams = byId(teams.findAllByTournament_TournamentId(tournamentId),
            Team::getTeamId);
        Map<Long, Stadium> tournamentStadiums = byId(
            stadiums.findAllByTournament_TournamentId(tournamentId), Stadium::getStadiumId);
        Map<Long, Official> tournamentOfficials = byId(
            officials.findAllByTournament_TournamentId(tournamentId), Official::getOfficialId);

        ScheduleVersion version = new ScheduleVersion();
        version.setTournament(tournament);
        version.setVersionName(versionName);
        version.setCreatedAt(LocalDateTime.now());
        version.setMatchCount(result.matches().size());
        // The database uniqueness constraint also rejects concurrent saves of the same name.
        versions.saveAndFlush(version);

        // Acquire fixture index entries in the same order across concurrent saves.
        List<ScheduledMatchDTO> ordered = result.matches().stream()
            .sorted(Comparator.comparingInt((ScheduledMatchDTO match) -> match.fixture().round())
                .thenComparingLong(match -> Math.min(match.fixture().team1Id(), match.fixture().team2Id()))
                .thenComparingLong(match -> Math.max(match.fixture().team1Id(), match.fixture().team2Id())))
            .toList();
        for (ScheduledMatchDTO scheduled : ordered) {
            MatchFixture pairing = scheduled.fixture();
            if (!tournamentTeams.containsKey(pairing.team1Id())
                    || !tournamentTeams.containsKey(pairing.team2Id())) {
                throw new IllegalArgumentException("Fixture references a team outside the tournament");
            }
            Stadium stadium = tournamentStadiums.get(scheduled.stadiumId());
            if (stadium == null) {
                throw new IllegalArgumentException("Match references a stadium outside the tournament");
            }

            Match match = new Match();
            match.setFixture(resolveFixture(tournamentId, pairing));
            match.setScheduleVersion(version);
            match.setStadium(stadium);
            match.setStartTime(scheduled.startTime());
            match.setEndTime(scheduled.endTime());
            match.setMatchStatus("SCHEDULED");
            matches.save(match);

            for (Long officialId : scheduled.officialIds()) {
                Official official = tournamentOfficials.get(officialId);
                if (official == null) {
                    throw new IllegalArgumentException("Match references an official outside the tournament");
                }
                String role = official.getRole();
                if (role == null || role.isBlank()) {
                    throw new IllegalArgumentException("Official " + officialId + " has no role");
                }
                MatchOfficial assignment = new MatchOfficial();
                assignment.setId(new MatchOfficialId(match.getMatchId(), officialId));
                assignment.setMatch(match);
                assignment.setOfficial(official);
                assignment.setAssignedRole(role);
                assignments.save(assignment);
            }
        }
        assignments.flush();
        return version.getVersionId();
    }

    @Transactional(readOnly = true)
    public Optional<SavedSchedule> findSchedule(Long tournamentId, Long versionId) {
        return versions.findByTournament_TournamentIdAndVersionId(tournamentId, versionId)
            .map(version -> {
                Map<Long, List<MatchOfficial>> byMatch = assignments
                    .findAllByMatch_ScheduleVersion_VersionIdOrderById_OfficialId(versionId).stream()
                    .collect(Collectors.groupingBy(assignment -> assignment.getId().getMatchId()));
                List<SavedMatch> savedMatches = matches.findAllByScheduleVersion_VersionId(versionId)
                    .stream()
                    .sorted(Comparator.comparing((Match match) -> match.getFixture().getMatchNumber())
                        .thenComparing(Match::getMatchId))
                    .map(match -> toSavedMatch(match, byMatch.getOrDefault(match.getMatchId(), List.of())))
                    .toList();
                return new SavedSchedule(tournamentId, versionId, version.getVersionName(),
                    version.getCreatedAt(), version.getMatchCount(), savedMatches);
            });
    }

    private Fixture resolveFixture(Long tournamentId, MatchFixture pairing) {
        return fixtures.findByPair(tournamentId, pairing.round(), pairing.team1Id(), pairing.team2Id())
            .orElseGet(() -> {
                fixtures.insertPendingIfAbsent(tournamentId, pairing.round(), pairing.matchNumber(),
                    pairing.team1Id(), pairing.team2Id());
                // A fresh READ COMMITTED query sees the winning row after a concurrent insert.
                return fixtures.findByPair(tournamentId, pairing.round(), pairing.team1Id(), pairing.team2Id())
                    .orElseThrow(() -> new IllegalStateException("Fixture disappeared during schedule save"));
            });
    }

    private static SavedMatch toSavedMatch(Match match, List<MatchOfficial> assignments) {
        Fixture fixture = match.getFixture();
        Team first = fixture.getTeam1();
        Team second = fixture.getTeam2();
        MatchFixture pairing = new MatchFixture(fixture.getRoundNumber(), fixture.getMatchNumber(),
            first.getTeamId(), first.getTeamName(), second.getTeamId(), second.getTeamName());
        List<OfficialAssignment> officials = assignments.stream()
            .map(assignment -> new OfficialAssignment(assignment.getId().getOfficialId(),
                assignment.getOfficial().getName(), assignment.getAssignedRole()))
            .toList();
        return new SavedMatch(match.getMatchId(), fixture.getFixtureId(), pairing, fixture.getStatus(),
            match.getStadium().getStadiumId(), match.getStadium().getName(), match.getStartTime(),
            match.getEndTime(), match.getPitchNumber(), match.getMatchStatus(), officials);
    }

    private static void validateResult(Long tournamentId, String versionName, CompleteSchedulingResult result) {
        if (versionName == null || versionName.isBlank() || versionName.codePointCount(0, versionName.length()) > 100) {
            throw new IllegalArgumentException("Version name must contain 1 to 100 characters and cannot be blank");
        }
        if (tournamentId == null || result == null || !Objects.equals(tournamentId, result.tournamentId())
                || result.status() != CompleteSchedulingResult.Status.SCHEDULE_GENERATED
                || result.matches() == null || result.matches().isEmpty()
                || result.matches().size() != result.totalFixtures()
                || result.matches().size() != result.scheduledMatches()
                || result.conflicts() == null || !result.conflicts().isEmpty()) {
            throw new IllegalArgumentException("A complete, conflict-free schedule is required for this tournament");
        }

        var fixtureKeys = new HashSet<FixtureKey>();
        for (ScheduledMatchDTO match : result.matches()) {
            if (match == null || match.fixture() == null || match.stadiumId() == null
                    || match.startTime() == null || match.endTime() == null
                    || !match.endTime().isAfter(match.startTime())
                    || match.officialIds() == null
                    || match.officialIds().size() != TournamentSchedulingDataLoader.OFFICIALS_REQUIRED_PER_MATCH
                    || match.officialIds().stream().anyMatch(Objects::isNull)
                    || new HashSet<>(match.officialIds()).size() != match.officialIds().size()) {
                throw new IllegalArgumentException("A scheduled match has invalid times, resources or assignments");
            }
            MatchFixture fixture = match.fixture();
            if (fixture.round() <= 0 || fixture.matchNumber() <= 0
                    || fixture.team1Id() == null || fixture.team2Id() == null
                    || fixture.team1Id().equals(fixture.team2Id())) {
                throw new IllegalArgumentException("A scheduled match has an invalid fixture");
            }
            if (!fixtureKeys.add(new FixtureKey(fixture.round(),
                    Math.min(fixture.team1Id(), fixture.team2Id()),
                    Math.max(fixture.team1Id(), fixture.team2Id())))) {
                throw new IllegalArgumentException("A fixture is scheduled more than once");
            }
        }
    }

    private static <T> Map<Long, T> byId(List<T> entities, Function<T, Long> id) {
        return entities.stream().collect(Collectors.toMap(id, Function.identity()));
    }

    private record FixtureKey(int round, long firstTeam, long secondTeam) {
    }
}
