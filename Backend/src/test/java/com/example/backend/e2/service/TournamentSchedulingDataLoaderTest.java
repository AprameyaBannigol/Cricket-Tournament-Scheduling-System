package com.example.backend.e2.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.e2.entity.Availability;
import com.example.backend.e2.entity.MatchConfiguration;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.SchedulingConstraints;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.entity.VenueTravelTime;
import com.example.backend.e2.repository.AvailabilityRepository;
import com.example.backend.e2.repository.MatchConfigurationRepository;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.SchedulingConstraintsRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e2.repository.VenueTravelTimeRepository;

import jakarta.persistence.EntityNotFoundException;

class TournamentSchedulingDataLoaderTest {

    private static final Long TOURNAMENT_ID = 42L;
    private static final LocalDate MATCH_DATE = LocalDate.of(2026, 6, 1);

    private final TournamentRepository tournamentRepository = mock(TournamentRepository.class);
    private final TeamRepository teamRepository = mock(TeamRepository.class);
    private final StadiumRepository stadiumRepository = mock(StadiumRepository.class);
    private final OfficialRepository officialRepository = mock(OfficialRepository.class);
    private final AvailabilityRepository availabilityRepository =
        mock(AvailabilityRepository.class);
    private final MatchConfigurationRepository matchConfigurationRepository =
        mock(MatchConfigurationRepository.class);
    private final SchedulingConstraintsRepository schedulingConstraintsRepository =
        mock(SchedulingConstraintsRepository.class);
    private final VenueTravelTimeRepository venueTravelTimeRepository =
        mock(VenueTravelTimeRepository.class);

    private TournamentSchedulingDataLoader loader;

    @BeforeEach
    void setUp() {
        loader = new TournamentSchedulingDataLoader(
            tournamentRepository,
            teamRepository,
            stadiumRepository,
            officialRepository,
            availabilityRepository,
            matchConfigurationRepository,
            schedulingConstraintsRepository,
            venueTravelTimeRepository
        );
    }

    @Test
    void loadsActiveSchedulingDataAndBuildsTheExistingE1Input() {
        Tournament tournament = tournament();
        Team team1 = team(1L, "Falcons", "ACTIVE");
        Team team2 = team(2L, "Tigers", "ACTIVE");
        Team team3 = team(3L, "Owls", "ACTIVE");
        Team inactiveTeam = team(4L, "Inactive", "INACTIVE");
        Stadium stadium1 = stadium(10L, "Central", "AVAILABLE");
        Stadium stadium2 = stadium(11L, "North", "AVAILABLE");
        Stadium unavailableStadium = stadium(12L, "Unavailable", "CLOSED");
        Official official1 = official(20L, "Official One", "ACTIVE");
        Official official2 = official(21L, "Official Two", "ACTIVE");
        Official official3 = official(22L, "Official Three", "ACTIVE");
        Official inactiveOfficial = official(23L, "Inactive Official", "INACTIVE");

        when(tournamentRepository.findById(TOURNAMENT_ID))
            .thenReturn(Optional.of(tournament));
        when(matchConfigurationRepository.findByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(Optional.of(configuration()));
        when(schedulingConstraintsRepository.findByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(Optional.of(constraints()));
        when(teamRepository.findAllByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(List.of(team1, inactiveTeam, team2, team3));
        when(stadiumRepository.findAllByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(List.of(stadium1, unavailableStadium, stadium2));
        when(officialRepository.findAllByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(List.of(official1, inactiveOfficial, official2, official3));
        when(availabilityRepository.findAllByTeam_TeamIdIn(anyCollection()))
            .thenReturn(List.of(
                availability(team1, null, null, "AVAILABLE", "08:00", "18:00"),
                availability(team2, null, null, "AVAILABLE", "09:00", "18:00"),
                availability(team3, null, null, "AVAILABLE", "09:00", "18:00"),
                availability(team1, null, null, "UNAVAILABLE", "06:00", "07:00")
            ));
        when(availabilityRepository.findAllByStadium_StadiumIdIn(anyCollection()))
            .thenReturn(List.of(
                availability(null, stadium1, null, "AVAILABLE", "10:00", "17:00"),
                availability(null, stadium2, null, "AVAILABLE", "11:00", "17:00")
            ));
        when(availabilityRepository.findAllByOfficial_OfficialIdIn(anyCollection()))
            .thenReturn(List.of(
                availability(null, null, official1, "AVAILABLE", "09:00", "17:00"),
                availability(null, null, official2, "AVAILABLE", "10:00", "17:00"),
                availability(null, null, official3, "AVAILABLE", "11:00", "17:00")
            ));
        when(venueTravelTimeRepository.findAllByFromStadium_StadiumIdIn(anyCollection()))
            .thenReturn(List.of(travelTime(stadium1, stadium2, 45)));

        TournamentSchedulingInputDTO result = loader.loadForTournament(TOURNAMENT_ID);

        assertEquals(TOURNAMENT_ID, result.tournamentId());
        assertEquals("Intercollegiate Cup", result.tournamentName());
        assertEquals(MATCH_DATE, result.startDate());
        assertEquals(MATCH_DATE.plusDays(2), result.endDate());
        assertEquals("Asia/Kolkata", result.timeZone().getId());
        assertEquals(List.of(1L, 2L, 3L),
            result.teams().stream().map(team -> team.id()).toList());
        assertEquals("Falcons", result.teams().getFirst().name());
        assertEquals(1, result.teams().getFirst().availability().size());
        assertEquals(LocalTime.of(8, 0),
            result.teams().getFirst().availability().getFirst().startTime());
        assertEquals(List.of(10L, 11L),
            result.stadiums().stream().map(stadium -> stadium.id()).toList());
        assertEquals(List.of(180),
            result.stadiums().getFirst().supportedMatchDurationsMinutes());
        assertEquals(List.of(20L, 21L, 22L),
            result.officials().stream().map(official -> official.id()).toList());
        assertEquals(List.of(1, 2, 3), result.officials().getFirst().eligibleRounds());
        assertEquals(180, result.matchDurationMinutes());
        assertEquals(0, result.bufferMinutes());
        assertEquals(3, result.officialsRequiredPerMatch());
        assertEquals(60, result.constraints().minimumRecoveryMinutes());
        assertTrue(result.constraints().travelConstraintEnabled());
        assertEquals(90, result.constraints().minimumTravelMinutes());
        assertEquals(1, result.constraints().venueTravelTimes().size());
        assertEquals(List.of(
            LocalTime.of(8, 0), LocalTime.of(9, 0), LocalTime.of(10, 0),
            LocalTime.of(11, 0)
        ), result.availableTimeSlots());
        verify(tournamentRepository).findById(TOURNAMENT_ID);
    }

    @Test
    void rejectsNonPositiveTournamentIdsBeforeRepositoryAccess() {
        assertThrows(IllegalArgumentException.class, () -> loader.loadForTournament(0L));
    }

    @Test
    void reportsWhenTournamentDoesNotExist() {
        when(tournamentRepository.findById(TOURNAMENT_ID)).thenReturn(Optional.empty());

        EntityNotFoundException exception = assertThrows(
            EntityNotFoundException.class,
            () -> loader.loadForTournament(TOURNAMENT_ID)
        );

        assertTrue(exception.getMessage().contains(TOURNAMENT_ID.toString()));
    }

    @Test
    void reportsWhenMatchConfigurationIsMissing() {
        when(tournamentRepository.findById(TOURNAMENT_ID))
            .thenReturn(Optional.of(tournament()));
        when(matchConfigurationRepository.findByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> loader.loadForTournament(TOURNAMENT_ID)
        );

        assertTrue(exception.getMessage().contains("Match configuration"));
    }

    @Test
    void reportsWhenSchedulingConstraintsAreMissing() {
        when(tournamentRepository.findById(TOURNAMENT_ID))
            .thenReturn(Optional.of(tournament()));
        when(matchConfigurationRepository.findByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(Optional.of(configuration()));
        when(schedulingConstraintsRepository.findByTournament_TournamentId(TOURNAMENT_ID))
            .thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> loader.loadForTournament(TOURNAMENT_ID)
        );

        assertTrue(exception.getMessage().contains("Scheduling constraints"));
    }

    private Tournament tournament() {
        Tournament tournament = new Tournament();
        tournament.setTournamentId(TOURNAMENT_ID);
        tournament.setName("Intercollegiate Cup");
        tournament.setStartDate(MATCH_DATE);
        tournament.setEndDate(MATCH_DATE.plusDays(2));
        return tournament;
    }

    private Team team(Long id, String name, String status) {
        Team team = new Team();
        team.setTeamId(id);
        team.setTeamName(name);
        team.setStatus(status);
        return team;
    }

    private Stadium stadium(Long id, String name, String status) {
        Stadium stadium = new Stadium();
        stadium.setStadiumId(id);
        stadium.setName(name);
        stadium.setAvailabilityStatus(status);
        return stadium;
    }

    private Official official(Long id, String name, String status) {
        Official official = new Official();
        official.setOfficialId(id);
        official.setName(name);
        official.setStatus(status);
        return official;
    }

    private Availability availability(
            Team team,
            Stadium stadium,
            Official official,
            String status,
            String start,
            String end) {
        Availability availability = new Availability();
        availability.setTeam(team);
        availability.setStadium(stadium);
        availability.setOfficial(official);
        availability.setAvailabilityStatus(status);
        availability.setAvailableDate(MATCH_DATE);
        availability.setStartTime(LocalTime.parse(start));
        availability.setEndTime(LocalTime.parse(end));
        return availability;
    }

    private MatchConfiguration configuration() {
        MatchConfiguration configuration = new MatchConfiguration();
        configuration.setMatchDurationMinutes(180);
        return configuration;
    }

    private SchedulingConstraints constraints() {
        SchedulingConstraints constraints = new SchedulingConstraints();
        constraints.setMinimumRecoveryMinutes(60);
        constraints.setTravelConstraintEnabled(true);
        constraints.setMinimumTravelMinutes(90);
        constraints.setTravelBufferHours(BigDecimal.valueOf(1.5));
        return constraints;
    }

    private VenueTravelTime travelTime(Stadium from, Stadium to, int minutes) {
        VenueTravelTime travelTime = new VenueTravelTime();
        travelTime.setFromStadium(from);
        travelTime.setToStadium(to);
        travelTime.setTravelMinutes(minutes);
        return travelTime;
    }
}
