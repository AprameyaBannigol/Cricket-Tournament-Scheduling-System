package com.example.backend.e3.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.e2.entity.Availability;
import com.example.backend.e2.entity.MatchConfiguration;
import com.example.backend.e2.entity.SchedulingConstraints;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.AvailabilityRepository;
import com.example.backend.e2.repository.MatchConfigurationRepository;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.SchedulingConstraintsRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e3.dto.MatchConfigurationRequest;
import com.example.backend.e3.dto.SchedulingAvailabilityRequest;
import com.example.backend.e3.dto.SchedulingAvailabilityRequest.Status;
import com.example.backend.e3.dto.SchedulingAvailabilityRequest.Window;
import com.example.backend.e3.dto.SchedulingConstraintsRequest;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional(readOnly = true)
public class SchedulingConfigurationService {

    private final TournamentRepository tournaments;
    private final MatchConfigurationRepository configurations;
    private final SchedulingConstraintsRepository constraints;
    private final AvailabilityRepository availability;
    private final TeamRepository teams;
    private final StadiumRepository stadiums;
    private final OfficialRepository officials;

    public SchedulingConfigurationService(TournamentRepository tournaments,
            MatchConfigurationRepository configurations, SchedulingConstraintsRepository constraints,
            AvailabilityRepository availability, TeamRepository teams, StadiumRepository stadiums,
            OfficialRepository officials) {
        this.tournaments = tournaments;
        this.configurations = configurations;
        this.constraints = constraints;
        this.availability = availability;
        this.teams = teams;
        this.stadiums = stadiums;
        this.officials = officials;
    }

    public Optional<MatchConfigurationRequest> getMatchConfiguration(Long id) {
        tournament(id, false);
        return configurations.findByTournament_TournamentId(id).map(MatchConfigurationRequest::from);
    }

    @Transactional
    public MatchConfigurationRequest saveMatchConfiguration(Long id, MatchConfigurationRequest request) {
        Tournament tournament = tournament(id, true);
        requireAtMost(request.maxBowlerOvers(), request.oversPerInnings(), "Max bowler overs");
        requireAtMost(request.powerplayOvers(), request.oversPerInnings(), "Powerplay overs");
        requireAtMost(request.minOversForDls(), request.oversPerInnings(), "Minimum DLS overs");
        if (request.inningsBreakMinutes() >= request.matchDurationMinutes()) {
            throw new IllegalArgumentException("Innings break must be shorter than the match duration");
        }
        MatchConfiguration row = configurations.findByTournament_TournamentId(id)
            .orElseGet(MatchConfiguration::new);
        row.setTournament(tournament);
        row.setMatchFormat(request.matchFormat().trim());
        row.setOversPerInnings(request.oversPerInnings());
        row.setMaxBowlerOvers(request.maxBowlerOvers());
        row.setPowerplayOvers(request.powerplayOvers());
        row.setInningsBreakMinutes(request.inningsBreakMinutes());
        row.setMatchDurationMinutes(request.matchDurationMinutes());
        row.setMinOversForDls(request.minOversForDls());
        row.setPointsForWin(request.pointsForWin());
        row.setPointsForTie(request.pointsForTie());
        row.setPointsForLoss(request.pointsForLoss());
        row.setSuperOverEnabled(request.superOverEnabled());
        return MatchConfigurationRequest.from(configurations.save(row));
    }

    public Optional<SchedulingConstraintsRequest> getConstraints(Long id) {
        tournament(id, false);
        return constraints.findByTournament_TournamentId(id).map(SchedulingConstraintsRequest::from);
    }

    @Transactional
    public SchedulingConstraintsRequest saveConstraints(Long id, SchedulingConstraintsRequest request) {
        Tournament tournament = tournament(id, true);
        SchedulingConstraints row = constraints.findByTournament_TournamentId(id)
            .orElseGet(SchedulingConstraints::new);
        row.setTournament(tournament);
        row.setMinimumRecoveryMinutes(request.minimumRecoveryMinutes());
        row.setMaxMatchesPerTeamPerDay(request.maxMatchesPerTeamPerDay());
        row.setMaxMatchesPerStadiumPerDay(request.maxMatchesPerStadiumPerDay());
        row.setTravelConstraintEnabled(request.travelConstraintEnabled());
        row.setMinimumTravelMinutes(request.minimumTravelMinutes());
        row.setTravelBufferHours(BigDecimal.valueOf(request.minimumTravelMinutes())
            .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP));
        row.setAvoidGroundBlackouts(request.avoidGroundBlackouts());
        row.setAvoidOfficialBlackouts(request.avoidOfficialBlackouts());
        row.setNightToMorningRestriction(request.nightToMorningRestriction());
        row.setReserveDayEnforced(request.reserveDayEnforced());
        return SchedulingConstraintsRequest.from(constraints.save(row));
    }

    public SchedulingAvailabilityRequest getAvailability(Long id, String type, Long resourceId) {
        tournament(id, false);
        return availabilityResponse(resource(id, type, resourceId).rows());
    }

    @Transactional
    public SchedulingAvailabilityRequest saveAvailability(Long id, String type, Long resourceId,
            SchedulingAvailabilityRequest request) {
        Tournament tournament = tournament(id, true);
        Resource resource = resource(id, type, resourceId);
        if (!request.windows().isEmpty() && (tournament.getStartDate() == null || tournament.getEndDate() == null)) {
            throw new IllegalArgumentException("Set tournament start and end dates before saving availability");
        }
        for (Window window : request.windows()) {
            if (window.date().isBefore(tournament.getStartDate()) || window.date().isAfter(tournament.getEndDate())) {
                throw new IllegalArgumentException("Availability dates must be within the tournament dates");
            }
            if (!window.startTime().isBefore(window.endTime()) || window.startTime().getNano() != 0
                    || window.endTime().getNano() != 0) {
                throw new IllegalArgumentException("Availability times must use whole seconds and end after the start");
            }
        }

        List<Availability> existing = resource.rows().stream().filter(row -> status(row) != null).toList();
        if (existing.stream().anyMatch(row -> ownerCount(row) != 1)) {
            throw new IllegalArgumentException("An existing availability row has multiple resources and must be corrected");
        }
        availability.deleteAll(existing);
        availability.flush();
        List<Availability> rows = request.windows().stream().distinct().map(window -> {
            Availability row = new Availability();
            resource.assignOwner().accept(row);
            row.setAvailableDate(window.date());
            row.setStartTime(window.startTime());
            row.setEndTime(window.endTime());
            row.setAvailabilityStatus(window.status().name());
            return row;
        }).toList();
        return availabilityResponse(availability.saveAll(rows));
    }

    private Resource resource(Long tournamentId, String type, Long id) {
        if (id <= 0) throw new IllegalArgumentException("Resource ID must be positive");
        EntityNotFoundException notFound = new EntityNotFoundException("Resource not found in tournament: " + id);
        return switch (type) {
            case "teams" -> teams.findByTournament_TournamentIdAndTeamId(tournamentId, id)
                .map(team -> new Resource(availability.findAllByTeam_TeamIdIn(List.of(id)), row -> row.setTeam(team)))
                .orElseThrow(() -> notFound);
            case "stadiums" -> stadiums.findByTournament_TournamentIdAndStadiumId(tournamentId, id)
                .map(stadium -> new Resource(availability.findAllByStadium_StadiumIdIn(List.of(id)), row -> row.setStadium(stadium)))
                .orElseThrow(() -> notFound);
            case "officials" -> officials.findByTournament_TournamentIdAndOfficialId(tournamentId, id)
                .map(official -> new Resource(availability.findAllByOfficial_OfficialIdIn(List.of(id)), row -> row.setOfficial(official)))
                .orElseThrow(() -> notFound);
            default -> throw new IllegalArgumentException("Availability resource must be teams, stadiums, or officials");
        };
    }

    private Tournament tournament(Long id, boolean write) {
        if (id <= 0) throw new IllegalArgumentException("Tournament ID must be positive");
        return (write ? tournaments.findForConfigurationUpdate(id) : tournaments.findById(id))
            .orElseThrow(() -> new EntityNotFoundException("Tournament not found: " + id));
    }

    private static int ownerCount(Availability row) {
        return (row.getTeam() == null ? 0 : 1) + (row.getStadium() == null ? 0 : 1)
            + (row.getOfficial() == null ? 0 : 1);
    }

    private static Status status(Availability row) {
        for (Status status : Status.values()) {
            if (status.name().equalsIgnoreCase(row.getAvailabilityStatus())) return status;
        }
        return null;
    }

    private static SchedulingAvailabilityRequest availabilityResponse(List<Availability> rows) {
        return new SchedulingAvailabilityRequest(rows.stream()
            .filter(row -> status(row) != null)
            .map(row -> new Window(row.getAvailableDate(), row.getStartTime(), row.getEndTime(), status(row)))
            .sorted(Comparator.comparing(Window::date).thenComparing(Window::startTime)
                .thenComparing(Window::endTime).thenComparing(Window::status))
            .toList());
    }

    private static void requireAtMost(Integer value, int oversPerInnings, String label) {
        if (value != null && value > oversPerInnings) {
            throw new IllegalArgumentException(label + " cannot exceed overs per innings");
        }
    }

    private record Resource(List<Availability> rows, Consumer<Availability> assignOwner) {
    }
}
