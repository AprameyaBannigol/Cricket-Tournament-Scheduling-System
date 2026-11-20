package com.example.backend.e2.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult.Status;
import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.e2.entity.Fixture;
import com.example.backend.e2.entity.Match;
import com.example.backend.e2.entity.MatchOfficial;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.MatchOfficialRepository;
import com.example.backend.e2.repository.MatchRepository;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;

@ExtendWith(MockitoExtension.class)
class SchedulePersistenceServiceTest {

    @Mock private TournamentRepository tournaments;
    @Mock private TeamRepository teams;
    @Mock private StadiumRepository stadiums;
    @Mock private OfficialRepository officials;
    @Mock private ScheduleVersionRepository versions;
    @Mock private FixtureRepository fixtures;
    @Mock private MatchRepository matches;
    @Mock private MatchOfficialRepository assignments;

    @InjectMocks private SchedulePersistenceService service;

    private ScheduledMatchDTO match;

    @BeforeEach
    void setUp() {
        var start = LocalDateTime.of(2026, 12, 1, 9, 0);
        match = new ScheduledMatchDTO(new MatchFixture(1, 1, 10L, "A", 20L, "B"),
            start, start.plusHours(3), 30L, "Ground", List.of(40L, 41L, 42L));
    }

    @Test
    void rejectsInvalidVersionNamesAndUnclassifiedConflictsBeforeAccessingDatabase() {
        var valid = result(List.of(match), List.of());
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(2L, " ", valid));
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(2L, "x".repeat(101), valid));
        var conflicted = result(List.of(match),
            List.of(new SchedulingConflictDTO("FINAL_VALIDATION_FAILED", "Conflict", 1, 1)));
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(2L, "v1", conflicted));
        verifyNoInteractions(tournaments, versions);
    }

    @Test
    void rejectsDuplicateUnorderedFixtureBeforeAccessingDatabase() {
        var reversed = new ScheduledMatchDTO(new MatchFixture(1, 2, 20L, "B", 10L, "A"),
            match.startTime(), match.endTime(), match.stadiumId(), match.stadiumName(), match.officialIds());
        var duplicate = result(List.of(match, reversed), List.of());
        assertThrows(IllegalArgumentException.class, () -> service.saveSchedule(2L, "v1", duplicate));
        verifyNoInteractions(tournaments, versions);
    }

    @Test
    void rejectsExistingVersionWithoutWriting() {
        when(tournaments.findById(2L)).thenReturn(Optional.of(new Tournament()));
        when(versions.existsByTournament_TournamentIdAndVersionName(2L, "v1")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
            () -> service.saveSchedule(2L, "v1", result(List.of(match), List.of())));
        verifyNoInteractions(fixtures, matches, assignments);
    }

    @Test
    void rejectsBlankOfficialRole() {
        stubTournamentResources(List.of(official(40L, "  ")));
        when(fixtures.findByPair(2L, 1, 10L, 20L)).thenReturn(Optional.of(new Fixture()));

        assertThrows(IllegalArgumentException.class,
            () -> service.saveSchedule(2L, "v1", result(List.of(match), List.of())));
        verify(matches).save(any());
        verifyNoInteractions(assignments);
    }

    @Test
    void reusesWinningFixtureWhenConcurrentInsertDidNothing() {
        stubTournamentResources(List.of(official(40L, "UMPIRE"), official(41L, "SCORER"),
            official(42L, "UMPIRE")));
        Fixture winningFixture = new Fixture();
        when(fixtures.findByPair(2L, 1, 10L, 20L))
            .thenReturn(Optional.empty(), Optional.of(winningFixture));
        when(fixtures.insertPendingIfAbsent(2L, 1, 1, 10L, 20L)).thenReturn(0);
        when(versions.saveAndFlush(any())).thenAnswer(invocation -> {
            ScheduleVersion version = invocation.getArgument(0);
            version.setVersionId(50L);
            return version;
        });
        when(matches.save(any())).thenAnswer(invocation -> {
            Match entity = invocation.getArgument(0);
            assertSame(winningFixture, entity.getFixture());
            entity.setMatchId(60L);
            return entity;
        });

        assertEquals(50L, service.saveSchedule(2L, "v1", result(List.of(match), List.of())));

        var captor = ArgumentCaptor.forClass(MatchOfficial.class);
        verify(assignments, times(3)).save(captor.capture());
        assertEquals(List.of("UMPIRE", "SCORER", "UMPIRE"),
            captor.getAllValues().stream().map(MatchOfficial::getAssignedRole).toList());
    }

    private void stubTournamentResources(List<Official> assignedOfficials) {
        when(tournaments.findById(2L)).thenReturn(Optional.of(new Tournament()));
        Team first = new Team();
        first.setTeamId(10L);
        Team second = new Team();
        second.setTeamId(20L);
        when(teams.findAllByTournament_TournamentId(2L)).thenReturn(List.of(first, second));
        Stadium stadium = new Stadium();
        stadium.setStadiumId(30L);
        when(stadiums.findAllByTournament_TournamentId(2L)).thenReturn(List.of(stadium));
        when(officials.findAllByTournament_TournamentId(2L)).thenReturn(assignedOfficials);
    }

    private Official official(Long id, String role) {
        Official official = new Official();
        official.setOfficialId(id);
        official.setRole(role);
        return official;
    }

    private CompleteSchedulingResult result(List<ScheduledMatchDTO> matches,
            List<SchedulingConflictDTO> conflicts) {
        return new CompleteSchedulingResult(2L, Status.SCHEDULE_GENERATED, matches.size(), matches.size(),
            matches, 0, 0, 0, 0, List.of(), conflicts);
    }
}
