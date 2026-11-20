package com.example.backend.e2.service;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.AvailabilityDTO;
import com.example.backend.dto.OfficialDTO;
import com.example.backend.dto.SchedulingConstraintsDTO;
import com.example.backend.dto.SchedulingTeamDTO;
import com.example.backend.dto.StadiumDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.dto.VenueTravelTimeDTO;
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

@Service
public class TournamentSchedulingDataLoader {

    private static final ZoneId TOURNAMENT_TIME_ZONE = ZoneId.of("Asia/Kolkata");
    private static final int VENUE_BUFFER_MINUTES = 0;
    static final int OFFICIALS_REQUIRED_PER_MATCH = 3;

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final StadiumRepository stadiumRepository;
    private final OfficialRepository officialRepository;
    private final AvailabilityRepository availabilityRepository;
    private final MatchConfigurationRepository matchConfigurationRepository;
    private final SchedulingConstraintsRepository schedulingConstraintsRepository;
    private final VenueTravelTimeRepository venueTravelTimeRepository;

    public TournamentSchedulingDataLoader(
            TournamentRepository tournamentRepository,
            TeamRepository teamRepository,
            StadiumRepository stadiumRepository,
            OfficialRepository officialRepository,
            AvailabilityRepository availabilityRepository,
            MatchConfigurationRepository matchConfigurationRepository,
            SchedulingConstraintsRepository schedulingConstraintsRepository,
            VenueTravelTimeRepository venueTravelTimeRepository) {
        this.tournamentRepository = tournamentRepository;
        this.teamRepository = teamRepository;
        this.stadiumRepository = stadiumRepository;
        this.officialRepository = officialRepository;
        this.availabilityRepository = availabilityRepository;
        this.matchConfigurationRepository = matchConfigurationRepository;
        this.schedulingConstraintsRepository = schedulingConstraintsRepository;
        this.venueTravelTimeRepository = venueTravelTimeRepository;
    }

    @Transactional(readOnly = true)
    public TournamentSchedulingInputDTO loadForTournament(Long tournamentId) {
        if (tournamentId == null || tournamentId <= 0) {
            throw new IllegalArgumentException("Tournament ID must be positive");
        }

        Tournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Tournament not found: " + tournamentId));
        if (tournament.getStartDate() == null || tournament.getEndDate() == null) {
            throw new MissingSchedulingSetupException(
                "Tournament " + tournamentId + " must have start and end dates");
        }

        MatchConfiguration configuration = matchConfigurationRepository
            .findByTournament_TournamentId(tournamentId)
            .orElseThrow(() -> new MissingSchedulingSetupException(
                "Match configuration is missing for tournament " + tournamentId));
        SchedulingConstraints constraints = schedulingConstraintsRepository
            .findByTournament_TournamentId(tournamentId)
            .orElseThrow(() -> new MissingSchedulingSetupException(
                "Scheduling constraints are missing for tournament " + tournamentId));

        List<Team> teams = teamRepository.findAllByTournament_TournamentId(tournamentId)
            .stream()
            .filter(team -> hasStatus(team.getStatus(), "ACTIVE"))
            .sorted(Comparator.comparing(Team::getTeamId))
            .toList();
        List<Stadium> stadiums = stadiumRepository
            .findAllByTournament_TournamentId(tournamentId)
            .stream()
            .filter(stadium -> hasStatus(stadium.getAvailabilityStatus(), "AVAILABLE"))
            .sorted(Comparator.comparing(Stadium::getStadiumId))
            .toList();
        List<Official> officials = officialRepository
            .findAllByTournament_TournamentId(tournamentId)
            .stream()
            .filter(official -> hasStatus(official.getStatus(), "ACTIVE"))
            .sorted(Comparator.comparing(Official::getOfficialId))
            .toList();

        Map<Long, List<AvailabilityDTO>> teamAvailability = availabilityByResource(
            loadAvailability(teams, Team::getTeamId,
                availabilityRepository::findAllByTeam_TeamIdIn),
            row -> row.getTeam().getTeamId()
        );
        Map<Long, List<AvailabilityDTO>> stadiumAvailability = availabilityByResource(
            loadAvailability(stadiums, Stadium::getStadiumId,
                availabilityRepository::findAllByStadium_StadiumIdIn),
            row -> row.getStadium().getStadiumId()
        );
        Map<Long, List<AvailabilityDTO>> officialAvailability = availabilityByResource(
            loadAvailability(officials, Official::getOfficialId,
                availabilityRepository::findAllByOfficial_OfficialIdIn),
            row -> row.getOfficial().getOfficialId()
        );

        List<Long> stadiumIds = stadiums.stream().map(Stadium::getStadiumId).toList();
        Set<Long> eligibleStadiumIds = Set.copyOf(stadiumIds);
        List<VenueTravelTimeDTO> travelTimes = stadiumIds.isEmpty()
            ? List.of()
            : venueTravelTimeRepository.findAllByFromStadium_StadiumIdIn(stadiumIds)
                .stream()
                .filter(travel -> eligibleStadiumIds.contains(travel.getToStadium().getStadiumId()))
                .sorted(Comparator
                    .comparing((VenueTravelTime travel) ->
                        travel.getFromStadium().getStadiumId())
                    .thenComparing(travel -> travel.getToStadium().getStadiumId()))
                .map(this::toVenueTravelTimeDTO)
                .toList();

        List<AvailabilityDTO> allAvailability = new ArrayList<>();
        teamAvailability.values().forEach(allAvailability::addAll);
        stadiumAvailability.values().forEach(allAvailability::addAll);
        officialAvailability.values().forEach(allAvailability::addAll);
        List<LocalTime> availableTimeSlots = allAvailability.stream()
            .map(AvailabilityDTO::startTime)
            .distinct()
            .sorted()
            .toList();

        int roundCount = teams.size() % 2 == 0 ? teams.size() - 1 : teams.size();
        List<Integer> eligibleRounds = java.util.stream.IntStream
            .rangeClosed(1, Math.max(roundCount, 0))
            .boxed()
            .toList();

        List<SchedulingTeamDTO> schedulingTeams = teams.stream()
            .map(team -> new SchedulingTeamDTO(
                team.getTeamId(),
                team.getTeamName(),
                teamAvailability.getOrDefault(team.getTeamId(), List.of())
            ))
            .toList();
        List<StadiumDTO> schedulingStadiums = stadiums.stream()
            .map(stadium -> new StadiumDTO(
                stadium.getStadiumId(),
                stadium.getName(),
                stadiumAvailability.getOrDefault(stadium.getStadiumId(), List.of()),
                List.of(configuration.getMatchDurationMinutes())
            ))
            .toList();
        List<OfficialDTO> schedulingOfficials = officials.stream()
            .map(official -> new OfficialDTO(
                official.getOfficialId(),
                official.getName(),
                officialAvailability.getOrDefault(official.getOfficialId(), List.of()),
                eligibleRounds
            ))
            .toList();
        SchedulingConstraintsDTO schedulingConstraints = new SchedulingConstraintsDTO(
            constraints.getMinimumRecoveryMinutes(),
            constraints.getTravelConstraintEnabled(),
            constraints.getMinimumTravelMinutes(),
            travelTimes
        );

        return new TournamentSchedulingInputDTO(
            tournament.getTournamentId(),
            tournament.getName(),
            tournament.getStartDate(),
            tournament.getEndDate(),
            TOURNAMENT_TIME_ZONE,
            schedulingTeams,
            schedulingStadiums,
            schedulingOfficials,
            configuration.getMatchDurationMinutes(),
            availableTimeSlots,
            VENUE_BUFFER_MINUTES,
            OFFICIALS_REQUIRED_PER_MATCH,
            schedulingConstraints
        );
    }

    private boolean hasStatus(String actualStatus, String expectedStatus) {
        return expectedStatus.equalsIgnoreCase(actualStatus);
    }

    private <T> List<Availability> loadAvailability(
            List<T> resources,
            Function<T, Long> idExtractor,
            Function<Collection<Long>, List<Availability>> availabilityQuery) {
        if (resources.isEmpty()) {
            return List.of();
        }
        List<Long> resourceIds = resources.stream().map(idExtractor).toList();
        return availabilityQuery.apply(resourceIds);
    }

    private Map<Long, List<AvailabilityDTO>> availabilityByResource(
            List<Availability> rows,
            Function<Availability, Long> resourceIdExtractor) {
        Map<Long, List<AvailabilityDTO>> availabilityById = new HashMap<>();
        Map<Long, List<AvailabilityDTO>> blackoutsById = new HashMap<>();
        for (Availability row : rows) {
            Long resourceId = resourceIdExtractor.apply(row);
            if (resourceId == null) continue;
            AvailabilityDTO window = new AvailabilityDTO(
                row.getAvailableDate(), row.getStartTime(), row.getEndTime());
            if (hasStatus(row.getAvailabilityStatus(), "AVAILABLE")) {
                availabilityById.computeIfAbsent(resourceId, ignored -> new ArrayList<>()).add(window);
            } else if (hasStatus(row.getAvailabilityStatus(), "UNAVAILABLE")) {
                blackoutsById.computeIfAbsent(resourceId, ignored -> new ArrayList<>()).add(window);
            }
        }
        Comparator<AvailabilityDTO> chronological = Comparator.comparing(AvailabilityDTO::date)
            .thenComparing(AvailabilityDTO::startTime).thenComparing(AvailabilityDTO::endTime);
        blackoutsById.values().forEach(windows -> windows.sort(chronological));
        availabilityById.replaceAll((id, windows) -> windows.stream()
            .flatMap(window -> subtractBlackouts(window, blackoutsById.getOrDefault(id, List.of())).stream())
            .distinct().sorted(chronological).toList());
        return availabilityById;
    }

    private List<AvailabilityDTO> subtractBlackouts(AvailabilityDTO window, List<AvailabilityDTO> blackouts) {
        List<AvailabilityDTO> available = new ArrayList<>();
        LocalTime start = window.startTime();
        for (AvailabilityDTO blackout : blackouts) {
            if (!window.date().equals(blackout.date()) || !blackout.endTime().isAfter(start)
                    || !blackout.startTime().isBefore(window.endTime())
                    || !blackout.startTime().isBefore(blackout.endTime())) {
                continue;
            }
            if (blackout.startTime().isAfter(start)) {
                available.add(new AvailabilityDTO(window.date(), start, blackout.startTime()));
            }
            start = blackout.endTime();
        }
        if (start.isBefore(window.endTime())) {
            available.add(new AvailabilityDTO(window.date(), start, window.endTime()));
        }
        return available;
    }

    private VenueTravelTimeDTO toVenueTravelTimeDTO(VenueTravelTime travelTime) {
        return new VenueTravelTimeDTO(
            travelTime.getFromStadium().getStadiumId(),
            travelTime.getToStadium().getStadiumId(),
            travelTime.getTravelMinutes()
        );
    }
}
