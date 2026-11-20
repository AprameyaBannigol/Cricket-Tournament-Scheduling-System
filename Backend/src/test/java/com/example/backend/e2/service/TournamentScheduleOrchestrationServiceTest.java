package com.example.backend.e2.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.example.backend.dto.AvailabilityDTO;
import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult.Status;
import com.example.backend.dto.OfficialDTO;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.dto.SchedulingConstraintsDTO;
import com.example.backend.dto.SchedulingTeamDTO;
import com.example.backend.dto.StadiumDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.dto.VenueTravelTimeDTO;
import com.example.backend.service.ConstraintValidationService;
import com.example.backend.service.FixtureGenerationService;
import com.example.backend.service.ScheduleAllocationService;
import com.example.backend.service.SchedulingSearchProperties;

import jakarta.persistence.EntityNotFoundException;

class TournamentScheduleOrchestrationServiceTest {

    private static final Long TOURNAMENT_ID = 1L;
    private final TournamentSchedulingDataLoader dataLoader =
        mock(TournamentSchedulingDataLoader.class);
    private final ScheduleAllocationService allocationService =
        mock(ScheduleAllocationService.class);

    @Test
    void loadsTournamentInputAndDelegatesSchedulingToE1() {
        TournamentSchedulingInputDTO input = schedulingInput();
        CompleteSchedulingResult expected = result(Status.SCHEDULE_GENERATED, List.of());
        when(dataLoader.loadForTournament(TOURNAMENT_ID)).thenReturn(input);
        when(allocationService.generateSchedule(input)).thenReturn(expected);

        CompleteSchedulingResult actual = new TournamentScheduleOrchestrationService(
            dataLoader, allocationService).generateSchedule(TOURNAMENT_ID);

        assertSame(expected, actual);
        verify(dataLoader).loadForTournament(TOURNAMENT_ID);
        verify(allocationService).generateSchedule(input);
    }

    @Test
    void propagatesMissingTournamentAndDoesNotInvokeE1() {
        when(dataLoader.loadForTournament(TOURNAMENT_ID))
            .thenThrow(new EntityNotFoundException("Tournament not found: 1"));
        TournamentScheduleOrchestrationService service =
            new TournamentScheduleOrchestrationService(dataLoader, allocationService);

        EntityNotFoundException exception = assertThrows(
            EntityNotFoundException.class, () -> service.generateSchedule(TOURNAMENT_ID));

        assertTrue(exception.getMessage().contains("Tournament not found"));
        verifyNoInteractions(allocationService);
    }

    @Test
    void returnsE1IncompleteInputConflictsWithoutConvertingThemToSuccess() {
        TournamentSchedulingInputDTO input = schedulingInput();
        CompleteSchedulingResult invalid = result(Status.INVALID_INPUT,
            List.of(new SchedulingConflictDTO(
                "INVALID_INPUT", "At least two teams are required", null, null)));
        when(dataLoader.loadForTournament(TOURNAMENT_ID)).thenReturn(input);
        when(allocationService.generateSchedule(input)).thenReturn(invalid);

        CompleteSchedulingResult actual = new TournamentScheduleOrchestrationService(
            dataLoader, allocationService).generateSchedule(TOURNAMENT_ID);

        assertEquals(Status.INVALID_INPUT, actual.status());
        assertEquals(invalid.conflicts(), actual.conflicts());
    }

    @Test
    void returnsE1InfeasibleScheduleConflicts() {
        TournamentSchedulingInputDTO input = schedulingInput();
        CompleteSchedulingResult infeasible = result(Status.NO_FEASIBLE_SCHEDULE,
            List.of(new SchedulingConflictDTO(
                "NO_CANDIDATES", "No candidate satisfies availability", 1, 1)));
        when(dataLoader.loadForTournament(TOURNAMENT_ID)).thenReturn(input);
        when(allocationService.generateSchedule(input)).thenReturn(infeasible);

        CompleteSchedulingResult actual = new TournamentScheduleOrchestrationService(
            dataLoader, allocationService).generateSchedule(TOURNAMENT_ID);

        assertEquals(Status.NO_FEASIBLE_SCHEDULE, actual.status());
        assertEquals(infeasible.conflicts(), actual.conflicts());
    }

    @Test
    void e1SchedulesFourTeamsUsingExactlyThreeOfficialsPerMatch() {
        TournamentSchedulingInputDTO input = schedulingInput();
        ScheduleAllocationService e1 = new ScheduleAllocationService(
            new FixtureGenerationService(),
            new ConstraintValidationService(),
            new SchedulingSearchProperties());
        when(dataLoader.loadForTournament(TOURNAMENT_ID)).thenReturn(input);

        CompleteSchedulingResult result = new TournamentScheduleOrchestrationService(
            dataLoader, e1).generateSchedule(TOURNAMENT_ID);

        assertEquals(Status.SCHEDULE_GENERATED, result.status(), result.conflicts().toString());
        assertEquals(6, result.totalFixtures());
        assertEquals(6, result.scheduledMatches());
        assertTrue(result.conflicts().isEmpty());
        assertTrue(result.matches().stream().allMatch(match ->
            match.officialIds().size() == 3
                && new HashSet<>(match.officialIds()).size() == 3
                && new HashSet<>(match.officialIds()).equals(Set.of(1L, 2L, 3L))));
        Set<String> pairings = result.matches().stream()
            .map(match -> {
                long first = match.fixture().team1Id();
                long second = match.fixture().team2Id();
                return Math.min(first, second) + ":" + Math.max(first, second);
            })
            .collect(java.util.stream.Collectors.toSet());
        assertEquals(6, pairings.size());
    }

    private static CompleteSchedulingResult result(
            Status status,
            List<SchedulingConflictDTO> conflicts) {
        return new CompleteSchedulingResult(
            TOURNAMENT_ID, status, 0, 0, List.of(), 0, 0, 0, 0, List.of(), conflicts);
    }

    private static TournamentSchedulingInputDTO schedulingInput() {
        LocalDate startDate = LocalDate.of(2026, 12, 1);
        LocalDate endDate = LocalDate.of(2026, 12, 10);
        List<AvailabilityDTO> availability = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            availability.add(new AvailabilityDTO(
                date, LocalTime.of(9, 0), LocalTime.of(12, 30)));
            availability.add(new AvailabilityDTO(
                date, LocalTime.of(13, 0), LocalTime.of(16, 30)));
        }

        List<SchedulingTeamDTO> teams = List.of(
            new SchedulingTeamDTO(1L, "Team 1", availability),
            new SchedulingTeamDTO(2L, "Team 2", availability),
            new SchedulingTeamDTO(3L, "Team 3", availability),
            new SchedulingTeamDTO(4L, "Team 4", availability));
        List<StadiumDTO> stadiums = List.of(
            new StadiumDTO(1L, "Stadium 1", availability, List.of(210)),
            new StadiumDTO(2L, "Stadium 2", availability, List.of(210)),
            new StadiumDTO(3L, "Stadium 3", availability, List.of(210)));
        List<OfficialDTO> officials = List.of(
            new OfficialDTO(1L, "Official 1", availability, List.of(1, 2, 3)),
            new OfficialDTO(2L, "Official 2", availability, List.of(1, 2, 3)),
            new OfficialDTO(3L, "Official 3", availability, List.of(1, 2, 3)));
        List<VenueTravelTimeDTO> travelTimes = List.of(
            new VenueTravelTimeDTO(1L, 2L, 60),
            new VenueTravelTimeDTO(2L, 1L, 75),
            new VenueTravelTimeDTO(1L, 3L, 75),
            new VenueTravelTimeDTO(3L, 1L, 90),
            new VenueTravelTimeDTO(2L, 3L, 90),
            new VenueTravelTimeDTO(3L, 2L, 60));

        return new TournamentSchedulingInputDTO(
            TOURNAMENT_ID,
            "Development Tournament",
            startDate,
            endDate,
            ZoneId.of("Asia/Kolkata"),
            teams,
            stadiums,
            officials,
            210,
            List.of(LocalTime.of(9, 0), LocalTime.of(13, 0)),
            0,
            3,
            new SchedulingConstraintsDTO(720, true, 60, travelTimes));
    }
}
