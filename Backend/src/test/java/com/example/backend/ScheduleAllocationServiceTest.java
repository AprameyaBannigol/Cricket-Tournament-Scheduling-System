package com.example.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.example.backend.dto.AvailabilityDTO;
import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult.Status;
import com.example.backend.dto.OfficialDTO;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.dto.SchedulingConstraintsDTO;
import com.example.backend.dto.SchedulingTeamDTO;
import com.example.backend.dto.StadiumDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.dto.VenueTravelTimeDTO;
import com.example.backend.service.ConstraintValidationService;
import com.example.backend.service.FixtureGenerationService;
import com.example.backend.service.ScheduleAllocationService;
import com.example.backend.service.SchedulingSearchProperties;

class ScheduleAllocationServiceTest {

    private static final LocalDate FIRST_DAY = LocalDate.of(2026, 6, 1);
    private final ConstraintValidationService validator = new ConstraintValidationService();
    private final SchedulingSearchProperties searchProperties = new SchedulingSearchProperties();

    @Test
    void generatesCompleteScheduleAndPassesIndependentValidation() {
        CompleteSchedulingResult result = service().generateSchedule(input(
            4, dates(3), List.of(LocalTime.of(10, 0), LocalTime.of(12, 0)),
            0, false, 0, List.of(), defaultOfficials(4, dates(3), allRounds(4))
        ));

        assertEquals(Status.SCHEDULE_GENERATED, result.status());
        assertEquals(6, result.totalFixtures());
        assertEquals(6, result.scheduledMatches());
        assertEquals(6, result.matches().size());
        assertTrue(result.validationSummary().size() >= 4);
        assertTrue(result.conflicts().isEmpty());
    }

    @Test
    void rejectsCandidateTimesInDaylightSavingGaps() {
        LocalDate date = LocalDate.of(2026, 3, 8);
        TournamentSchedulingInputDTO request = input(
            2, List.of(date), List.of(LocalTime.of(2, 30)),
            0, false, 0, List.of(),
            defaultOfficials(1, List.of(date), List.of(1))
        );
        List<SchedulingTeamDTO> teams = request.teams().stream()
            .map(team -> new SchedulingTeamDTO(team.id(), team.name(),
                List.of(window(date, "00:00", "04:00"))))
            .toList();
        request = copyWithTeams(request, teams);
        request = copyWithStadiums(request, List.of(new StadiumDTO(
            1L, "Ground 1", List.of(window(date, "00:00", "04:00")), List.of(60))));
        request = copyWithZone(request, ZoneId.of("America/New_York"));
        request = copyWithOfficials(request, List.of(new OfficialDTO(
            1L, "Official 1", List.of(window(date, "00:00", "04:00")), List.of(1))));

        CompleteSchedulingResult result = service().generateSchedule(request);

        assertEquals(Status.NO_FEASIBLE_SCHEDULE, result.status());
        assertTrue(result.matches().isEmpty());
    }

    @Test
    void backtracksFromFirstGreedyChoiceAndFindsAlternative() {
        List<OfficialDTO> officials = List.of(
            official(1, List.of(1), List.of(FIRST_DAY, FIRST_DAY.plusDays(1))),
            official(2, List.of(2), List.of(FIRST_DAY, FIRST_DAY.plusDays(2))),
            official(3, List.of(3), List.of(FIRST_DAY, FIRST_DAY.plusDays(2)))
        );
        CompleteSchedulingResult result = service().generateSchedule(input(
            3, dates(3), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), officials
        ));

        assertEquals(Status.SCHEDULE_GENERATED, result.status());
        assertTrue(result.backtracks() > 0);
        assertEquals(3, result.scheduledMatches());
    }

    @Test
    void unavailableTeamProducesNoScheduleRatherThanPartialSuccess() {
        TournamentSchedulingInputDTO request = input(
            2, dates(1), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), defaultOfficials(1, dates(1), List.of(1))
        );
        List<SchedulingTeamDTO> teams = new ArrayList<>(request.teams());
        teams.set(0, new SchedulingTeamDTO(teams.get(0).id(), teams.get(0).name(),
            List.of(window(FIRST_DAY, "12:00", "13:00"))));
        request = copyWithTeams(request, teams);

        CompleteSchedulingResult result = service().generateSchedule(request);

        assertEquals(Status.NO_FEASIBLE_SCHEDULE, result.status());
        assertEquals(0, result.scheduledMatches());
        assertTrue(result.matches().isEmpty());
    }

    @Test
    void reportsUnsatisfiableOverlappingFixturesWithoutPartialSchedule() {
        CompleteSchedulingResult result = service().generateSchedule(input(
            3, dates(1), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), defaultOfficials(1, dates(1), allRounds(3))
        ));

        assertEquals(Status.NO_FEASIBLE_SCHEDULE, result.status());
        assertEquals(3, result.totalFixtures());
        assertEquals(0, result.scheduledMatches());
        assertTrue(result.matches().isEmpty());
        assertEquals("SEARCH_EXHAUSTED", result.conflicts().getFirst().code());
    }

    @Test
    void rejectsMissingOfficialsAsInvalidInput() {
        TournamentSchedulingInputDTO request = input(
            2, dates(1), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), List.of()
        );

        CompleteSchedulingResult result = service().generateSchedule(request);

        assertEquals(Status.INVALID_INPUT, result.status());
        assertTrue(result.matches().isEmpty());
        assertTrue(result.conflicts().stream()
            .anyMatch(conflict -> conflict.message().contains("official")));
    }

    @Test
    void reportsUnavailableStadiumAndOfficialWithoutPartialResults() {
        TournamentSchedulingInputDTO request = input(
            2, dates(1), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), defaultOfficials(1, dates(1), List.of(1))
        );
        request = copyWithStadiums(request, List.of(new StadiumDTO(
            1L, "Ground 1", List.of(window(FIRST_DAY, "12:00", "18:00")), List.of(60))));
        CompleteSchedulingResult unavailableStadium = service().generateSchedule(request);
        assertEquals(Status.NO_FEASIBLE_SCHEDULE, unavailableStadium.status());
        assertTrue(unavailableStadium.matches().isEmpty());

        request = input(2, dates(1), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(),
            List.of(official(1, List.of(1), List.of(FIRST_DAY))));
        request = copyWithOfficials(request, List.of(new OfficialDTO(
            1L, "Official 1", List.of(window(FIRST_DAY, "12:00", "18:00")), List.of(1))));
        CompleteSchedulingResult unavailableOfficial = service().generateSchedule(request);
        assertEquals(Status.NO_FEASIBLE_SCHEDULE, unavailableOfficial.status());
        assertTrue(unavailableOfficial.matches().isEmpty());
    }

    @Test
    void enforcesMinimumTeamRecoveryBetweenMatches() {
        CompleteSchedulingResult result = service().generateSchedule(input(
            3, dates(1),
            List.of(LocalTime.of(10, 0), LocalTime.of(12, 0), LocalTime.of(14, 0)),
            120, false, 0, List.of(), defaultOfficials(3, dates(1), allRounds(3))
        ));

        assertEquals(Status.NO_FEASIBLE_SCHEDULE, result.status());
        assertTrue(result.matches().isEmpty());
    }

    @Test
    void finalValidationDetectsTeamStadiumAndOfficialDoubleBooking() {
        TournamentSchedulingInputDTO request = input(
            3, dates(3), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), defaultOfficials(1, dates(3), allRounds(3))
        );
        CompleteSchedulingResult result = service().generateSchedule(request);
        ScheduledMatchDTO first = result.matches().get(0);
        ScheduledMatchDTO second = result.matches().get(1);
        ScheduledMatchDTO corrupted = new ScheduledMatchDTO(
            second.fixture(), first.startTime(), first.endTime(),
            first.stadiumId(), first.stadiumName(), first.officialIds());
        List<ScheduledMatchDTO> schedule = List.of(first, corrupted, result.matches().get(2));

        List<String> errors = validator.validateSchedule(
            request, result.matches().stream().map(ScheduledMatchDTO::fixture).toList(), schedule);

        assertTrue(errors.stream().anyMatch(error -> error.contains("double-booked")));
        assertTrue(errors.stream().anyMatch(error -> error.contains("overlapping matches")));
    }

    @Test
    void distinguishesSearchLimitFromExhaustedSearch() {
        searchProperties.setMaximumSearchNodes(1);
        CompleteSchedulingResult result = service().generateSchedule(input(
            3, dates(3), List.of(LocalTime.of(10, 0), LocalTime.of(12, 0)),
            0, false, 0, List.of(), defaultOfficials(3, dates(3), allRounds(3))
        ));

        assertEquals(Status.SEARCH_LIMIT_REACHED, result.status());
        assertEquals(0, result.scheduledMatches());
        assertTrue(result.matches().isEmpty());
        assertFalse(result.conflicts().isEmpty());
    }

    @Test
    void travelConstraintUsesDirectedVenueTimesAndCanMakeInputInfeasible() {
        List<LocalDate> allDates = dates(3);
        List<StadiumDTO> stadiums = List.of(
            new StadiumDTO(1L, "A", List.of(
                window(allDates.get(0), "08:00", "18:00"),
                window(allDates.get(2), "08:00", "18:00")), List.of(60)),
            new StadiumDTO(2L, "B", List.of(
                window(allDates.get(1), "08:00", "18:00")), List.of(60))
        );
        List<VenueTravelTimeDTO> travelTimes = List.of(
            new VenueTravelTimeDTO(1L, 2L, 1400),
            new VenueTravelTimeDTO(2L, 1L, 1400)
        );
        TournamentSchedulingInputDTO request = input(
            3, allDates, List.of(LocalTime.of(10, 0)),
            0, true, 1400, travelTimes,
            defaultOfficials(3, allDates, allRounds(3))
        );
        request = copyWithStadiums(request, stadiums);

        CompleteSchedulingResult result = service().generateSchedule(request);

        assertEquals(Status.NO_FEASIBLE_SCHEDULE, result.status());
        assertTrue(result.matches().isEmpty());
    }

    @Test
    void independentValidatorDetectsCorruptedFinalSchedule() {
        TournamentSchedulingInputDTO request = input(
            2, dates(1), List.of(LocalTime.of(10, 0)),
            0, false, 0, List.of(), defaultOfficials(1, dates(1), List.of(1))
        );
        CompleteSchedulingResult result = service().generateSchedule(request);
        ScheduledMatchDTO valid = result.matches().getFirst();
        ScheduledMatchDTO corrupted = new ScheduledMatchDTO(
            valid.fixture(), valid.startTime(), valid.endTime().plusMinutes(1),
            valid.stadiumId(), valid.stadiumName(), valid.officialIds()
        );

        List<String> errors = validator.validateSchedule(
            request, List.of(valid.fixture()), List.of(corrupted));

        assertTrue(errors.stream().anyMatch(error -> error.contains("invalid duration")));
    }

    private ScheduleAllocationService service() {
        return new ScheduleAllocationService(
            new FixtureGenerationService(), validator, searchProperties);
    }

    private TournamentSchedulingInputDTO input(
            int teamCount,
            List<LocalDate> dates,
            List<LocalTime> slots,
            int minimumRecovery,
            boolean travelEnabled,
            int minimumTravel,
            List<VenueTravelTimeDTO> travelTimes,
            List<OfficialDTO> officials) {
        List<SchedulingTeamDTO> teams = new ArrayList<>();
        for (long id = 1; id <= teamCount; id++) {
            teams.add(new SchedulingTeamDTO(id, "Team " + id,
                dates.stream().map(date -> window(date, "08:00", "20:00")).toList()));
        }
        StadiumDTO stadium = new StadiumDTO(1L, "Ground 1",
            dates.stream().map(date -> window(date, "08:00", "20:00")).toList(),
            List.of(60));
        return new TournamentSchedulingInputDTO(
            1L,
            "Test tournament",
            dates.getFirst(),
            dates.getLast(),
            ZoneId.of("UTC"),
            teams,
            List.of(stadium),
            officials,
            60,
            slots,
            0,
            1,
            new SchedulingConstraintsDTO(
                minimumRecovery,
                travelEnabled,
                travelEnabled ? minimumTravel : null,
                travelTimes
            )
        );
    }

    private TournamentSchedulingInputDTO copyWithTeams(
            TournamentSchedulingInputDTO input,
            List<SchedulingTeamDTO> teams) {
        return new TournamentSchedulingInputDTO(
            input.tournamentId(), input.tournamentName(), input.startDate(), input.endDate(),
            input.timeZone(), teams, input.stadiums(), input.officials(),
            input.matchDurationMinutes(), input.availableTimeSlots(), input.bufferMinutes(),
            input.officialsRequiredPerMatch(), input.constraints());
    }

    private TournamentSchedulingInputDTO copyWithOfficials(
            TournamentSchedulingInputDTO input,
            List<OfficialDTO> officials) {
        return new TournamentSchedulingInputDTO(
            input.tournamentId(), input.tournamentName(), input.startDate(), input.endDate(),
            input.timeZone(), input.teams(), input.stadiums(), officials,
            input.matchDurationMinutes(), input.availableTimeSlots(), input.bufferMinutes(),
            input.officialsRequiredPerMatch(), input.constraints());
    }

    private TournamentSchedulingInputDTO copyWithZone(
            TournamentSchedulingInputDTO input,
            ZoneId timeZone) {
        return new TournamentSchedulingInputDTO(
            input.tournamentId(), input.tournamentName(), input.startDate(), input.endDate(),
            timeZone, input.teams(), input.stadiums(), input.officials(),
            input.matchDurationMinutes(), input.availableTimeSlots(), input.bufferMinutes(),
            input.officialsRequiredPerMatch(), input.constraints());
    }

    private TournamentSchedulingInputDTO copyWithStadiums(
            TournamentSchedulingInputDTO input,
            List<StadiumDTO> stadiums) {
        return new TournamentSchedulingInputDTO(
            input.tournamentId(), input.tournamentName(), input.startDate(), input.endDate(),
            input.timeZone(), input.teams(), stadiums, input.officials(),
            input.matchDurationMinutes(), input.availableTimeSlots(), input.bufferMinutes(),
            input.officialsRequiredPerMatch(), input.constraints());
    }

    private List<OfficialDTO> defaultOfficials(
            int count,
            List<LocalDate> dates,
            List<Integer> eligibleRounds) {
        List<OfficialDTO> officials = new ArrayList<>();
        for (long id = 1; id <= count; id++) {
            officials.add(new OfficialDTO(id, "Official " + id,
                dates.stream().map(date -> window(date, "08:00", "20:00")).toList(),
                eligibleRounds));
        }
        return officials;
    }

    private OfficialDTO official(
            long id,
            List<Integer> rounds,
            List<LocalDate> dates) {
        return new OfficialDTO(id, "Official " + id,
            dates.stream().map(date -> window(date, "08:00", "20:00")).toList(), rounds);
    }

    private List<Integer> allRounds(int teamCount) {
        int roundCount = teamCount % 2 == 0 ? teamCount - 1 : teamCount;
        List<Integer> rounds = new ArrayList<>();
        for (int round = 1; round <= roundCount; round++) {
            rounds.add(round);
        }
        return rounds;
    }

    private List<LocalDate> dates(int count) {
        List<LocalDate> dates = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            dates.add(FIRST_DAY.plusDays(i));
        }
        return dates;
    }

    private AvailabilityDTO window(LocalDate date, String start, String end) {
        return new AvailabilityDTO(date, LocalTime.parse(start), LocalTime.parse(end));
    }
}
