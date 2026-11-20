package com.example.backend.e2.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.e2.dto.SavedSchedule;
import com.example.backend.e2.dto.ScheduleVersionSummary;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.TournamentRepository;

import jakarta.persistence.EntityNotFoundException;

class TournamentScheduleApiServiceTest {

    private final TournamentRepository tournaments = mock(TournamentRepository.class);
    private final ScheduleVersionRepository versions = mock(ScheduleVersionRepository.class);
    private final TournamentScheduleOrchestrationService orchestration =
        mock(TournamentScheduleOrchestrationService.class);
    private final SchedulePersistenceService persistence =
        mock(SchedulePersistenceService.class);

    private final TournamentScheduleApiService service = new TournamentScheduleApiService(
        tournaments, versions, orchestration, persistence);

    @Test
    void generatesSavesAndReturnsSavedSchedule() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(202L);
        when(tournaments.findForConfigurationUpdate(202L)).thenReturn(Optional.of(tournament));
        CompleteSchedulingResult result = successfulResult();
        SavedSchedule saved = new SavedSchedule(
            202L, 301L, "Final", LocalDateTime.now(), 1, List.of());
        when(orchestration.generateSchedule(202L)).thenReturn(result);
        when(persistence.saveSchedule(202L, "Final", result)).thenReturn(301L);
        when(persistence.findSchedule(202L, 301L)).thenReturn(Optional.of(saved));

        SavedSchedule actual = service.generateAndSave(202L, "Final");

        assertEquals(saved, actual);
        verify(persistence).saveSchedule(202L, "Final", result);
    }

    @Test
    void rejectsFailedGenerationAndDoesNotPersist() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(203L);
        when(tournaments.findForConfigurationUpdate(203L)).thenReturn(Optional.of(tournament));
        CompleteSchedulingResult failed = new CompleteSchedulingResult(
            203L, CompleteSchedulingResult.Status.NO_FEASIBLE_SCHEDULE,
            1, 0, List.of(), 0, 0, 0, 0, List.of(),
            List.of(new SchedulingConflictDTO("NO_CANDIDATES", "No candidates", 1, 1)));
        when(orchestration.generateSchedule(203L)).thenReturn(failed);

        assertThrows(ScheduleConflictException.class,
            () -> service.generateAndSave(203L, "Failed"));
        verifyNoInteractions(persistence);
    }

    @Test
    void listsEmptyVersionsAndReturnsSummaries() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(204L);
        when(tournaments.findById(204L)).thenReturn(Optional.of(tournament));
        when(versions.findAllByTournament_TournamentId(204L)).thenReturn(List.of());
        assertEquals(List.of(), service.listSchedules(204L));

        ScheduleVersion version = new ScheduleVersion();
        version.setVersionId(401L);
        version.setVersionName("v1");
        version.setCreatedAt(LocalDateTime.of(2026, 12, 1, 10, 0));
        version.setMatchCount(6);
        when(versions.findAllByTournament_TournamentId(204L)).thenReturn(List.of(version));

        List<ScheduleVersionSummary> summaries = service.listSchedules(204L);
        assertEquals(401L, summaries.get(0).versionId());
        assertEquals("v1", summaries.get(0).versionName());
        assertEquals(6, summaries.get(0).matchCount());
    }

    @Test
    void rejectsMissingTournamentAndMissingVersion() {
        when(tournaments.findById(205L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.listSchedules(205L));

        Tournament tournament = new Tournament();
        tournament.setTournamentId(206L);
        when(tournaments.findById(206L)).thenReturn(Optional.of(tournament));
        when(persistence.findSchedule(206L, 999L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> service.getSchedule(206L, 999L));
    }

    @Test
    void validatesBlankVersionNameBeforeGeneration() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(207L);
        when(tournaments.findById(207L)).thenReturn(Optional.of(tournament));

        assertThrows(IllegalArgumentException.class,
            () -> service.generateAndSave(207L, " "));
        verifyNoInteractions(orchestration, persistence);
    }

    private CompleteSchedulingResult successfulResult() {
        return new CompleteSchedulingResult(
            202L, CompleteSchedulingResult.Status.SCHEDULE_GENERATED,
            1, 1,
            List.of(new ScheduledMatchDTO(
                new com.example.backend.dto.MatchFixture(1, 1, 1L, "A", 2L, "B"),
                LocalDateTime.of(2026, 12, 1, 9, 0),
                LocalDateTime.of(2026, 12, 1, 12, 0),
                10L, "Ground", List.of(20L, 21L, 22L))),
            1, 0, 1, 1, List.of(), List.of());
    }
}
