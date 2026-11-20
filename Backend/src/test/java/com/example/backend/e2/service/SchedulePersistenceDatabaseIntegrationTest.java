package com.example.backend.e2.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult.Status;
import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.e2.dto.SavedSchedule.OfficialAssignment;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;

import jakarta.persistence.EntityManager;

@SpringBootTest
@Transactional
@EnabledIfEnvironmentVariable(named = "DB_USERNAME", matches = ".+")
@EnabledIfEnvironmentVariable(named = "DB_PASSWORD", matches = ".+")
class SchedulePersistenceDatabaseIntegrationTest {

    @Autowired private SchedulePersistenceService service;
    @Autowired private TournamentRepository tournaments;
    @Autowired private TeamRepository teams;
    @Autowired private StadiumRepository stadiums;
    @Autowired private OfficialRepository officials;
    @Autowired private FixtureRepository fixtures;
    @Autowired private ScheduleVersionRepository versions;
    @Autowired private EntityManager entityManager;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PlatformTransactionManager transactionManager;

    private Tournament tournament;
    private Team first;
    private Team second;
    private Stadium stadium;
    private List<Long> officialIds;
    private final LocalDateTime start = LocalDateTime.of(2026, 12, 1, 9, 0);

    @BeforeEach
    void createTournament() {
        tournament = new Tournament();
        tournament.setName("Persistence test " + UUID.randomUUID());
        tournament.setStartDate(LocalDate.of(2026, 12, 1));
        tournament.setEndDate(LocalDate.of(2026, 12, 10));
        tournament.setStatus("UPCOMING");
        tournaments.save(tournament);
        first = team("First team");
        second = team("Second team");
        stadium = new Stadium();
        stadium.setTournament(tournament);
        stadium.setName("Test ground");
        stadium.setFloodlights(Boolean.FALSE);
        stadium.setAvailabilityStatus("AVAILABLE");
        stadiums.save(stadium);
        officialIds = List.of(official("A", "UMPIRE").getOfficialId(), official("B", "SCORER").getOfficialId(),
            official("C", "UMPIRE").getOfficialId());
    }

    @Test
    void savesAndRetrievesTwoVersionsUsingTheSameUnorderedFixture() {
        Long tournamentId = tournament.getTournamentId();
        Long firstVersion = service.saveSchedule(tournamentId, "v1",
            result(match(first, second, officialIds)));
        Long secondVersion = service.saveSchedule(tournamentId, "v2",
            result(match(second, first, officialIds)));
        entityManager.clear();

        var saved = service.findSchedule(tournamentId, firstVersion).orElseThrow();
        var other = service.findSchedule(tournamentId, secondVersion).orElseThrow();
        assertEquals("v1", saved.versionName());
        assertEquals(firstVersion, saved.versionId());
        assertEquals(tournamentId, saved.tournamentId());
        assertNotNull(saved.createdAt());
        assertEquals(1, saved.matchCount());
        assertEquals(1, saved.matches().size());
        var match = saved.matches().getFirst();
        var secondMatch = other.matches().getFirst();
        assertEquals(match.fixtureId(), secondMatch.fixtureId());
        assertNotEquals(match.matchId(), secondMatch.matchId());
        assertEquals(1, fixtures.findAllByTournament_TournamentId(tournamentId).size());
        assertEquals(new MatchFixture(1, 1, first.getTeamId(), "First team", second.getTeamId(), "Second team"),
            match.fixture());
        assertEquals("PENDING", match.fixtureStatus());
        assertEquals("SCHEDULED", match.matchStatus());
        assertEquals(stadium.getStadiumId(), match.stadiumId());
        assertEquals("Test ground", match.stadiumName());
        assertEquals(start, match.startTime());
        assertEquals(start.plusHours(3), match.endTime());
        assertNull(match.pitchNumber());
        assertEquals(List.of(new OfficialAssignment(officialIds.get(0), "A", "UMPIRE"),
            new OfficialAssignment(officialIds.get(1), "B", "SCORER"),
            new OfficialAssignment(officialIds.get(2), "C", "UMPIRE")), match.officials());
        assertTrue(service.findSchedule(1L, firstVersion).isEmpty());
    }

    @Test
    void rejectsDuplicateVersionWithoutCreatingAnotherMatch() {
        Long tournamentId = tournament.getTournamentId();
        var schedule = result(match(first, second, officialIds));
        Long version = service.saveSchedule(tournamentId, "v1", schedule);

        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(tournamentId, "v1", schedule));
        assertEquals(1, versions.findAllByTournament_TournamentId(tournamentId).size());
        assertEquals(1, service.findSchedule(tournamentId, version).orElseThrow().matches().size());
    }

    @Test
    void rollsBackRowsWrittenBeforeAnInvalidOfficialIsDetected() {
        Long tournamentId = tournament.getTournamentId();
        var invalid = result(match(first, second, List.of(officialIds.getFirst(), -1L, officialIds.getLast())));

        new TransactionTemplate(transactionManager).executeWithoutResult(transaction -> {
            assertThrows(IllegalArgumentException.class,
                () -> service.saveSchedule(tournamentId, "failed", invalid));
            assertTrue(transaction.isRollbackOnly());
        });

        // Identity inserts for the version and match have already reached PostgreSQL.
        var rows = jdbc.queryForMap("""
            select v.version_id, m.match_id, m.fixture_id
            from schedule_version v join "match" m on m.version_id = v.version_id
            where v.tournament_id = ?
            """, tournamentId);
        TestTransaction.flagForRollback();
        TestTransaction.end();

        assertEquals(0L, jdbc.queryForObject(
            "select count(*) from schedule_version where version_id = ?", Long.class, rows.get("version_id")));
        assertEquals(0L, jdbc.queryForObject(
            "select count(*) from \"match\" where match_id = ?", Long.class, rows.get("match_id")));
        assertEquals(0L, jdbc.queryForObject(
            "select count(*) from fixture where fixture_id = ?", Long.class, rows.get("fixture_id")));
        assertEquals(0L, jdbc.queryForObject(
            "select count(*) from match_official where match_id = ?", Long.class, rows.get("match_id")));
    }

    private Team team(String name) {
        Team team = new Team();
        team.setTournament(tournament);
        team.setTeamName(name);
        team.setStatus("ACTIVE");
        return teams.save(team);
    }

    private Official official(String name, String role) {
        Official official = new Official();
        official.setTournament(tournament);
        official.setName(name);
        official.setRole(role);
        official.setStatus("ACTIVE");
        return officials.save(official);
    }

    private ScheduledMatchDTO match(Team firstTeam, Team secondTeam, List<Long> ids) {
        var fixture = new MatchFixture(1, 1, firstTeam.getTeamId(), firstTeam.getTeamName(),
            secondTeam.getTeamId(), secondTeam.getTeamName());
        return new ScheduledMatchDTO(fixture, start, start.plusHours(3),
            stadium.getStadiumId(), stadium.getName(), ids);
    }

    private CompleteSchedulingResult result(ScheduledMatchDTO match) {
        return new CompleteSchedulingResult(tournament.getTournamentId(), Status.SCHEDULE_GENERATED,
            1, 1, List.of(match), 0, 0, 0, 0, List.of(), List.of());
    }
}
