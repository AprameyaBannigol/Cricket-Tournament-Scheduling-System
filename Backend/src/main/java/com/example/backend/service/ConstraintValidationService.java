package com.example.backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.backend.dto.AvailabilityDTO;
import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.OfficialDTO;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.dto.SchedulingConstraintsDTO;
import com.example.backend.dto.SchedulingTeamDTO;
import com.example.backend.dto.StadiumDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.dto.VenueTravelTimeDTO;

@Service
public class ConstraintValidationService {

    public List<SchedulingConflictDTO> validateInput(TournamentSchedulingInputDTO input) {
        List<SchedulingConflictDTO> errors = new ArrayList<>();
        if (input == null) {
            return List.of(conflict("INVALID_INPUT", "Request body is required"));
        }
        if (input.tournamentId() == null || input.tournamentId() <= 0) {
            errors.add(conflict("INVALID_INPUT", "Tournament ID must be positive"));
        }
        if (input.tournamentName() == null || input.tournamentName().isBlank()) {
            errors.add(conflict("INVALID_INPUT", "Tournament name is required"));
        }
        if (input.startDate() == null || input.endDate() == null
                || input.startDate().isAfter(input.endDate())) {
            errors.add(conflict("INVALID_INPUT", "A valid tournament date range is required"));
        }
        if (input.timeZone() == null) {
            errors.add(conflict("INVALID_INPUT", "Tournament time zone is required"));
        }
        if (input.matchDurationMinutes() == null || input.matchDurationMinutes() <= 0) {
            errors.add(conflict("INVALID_INPUT", "Match duration must be positive"));
        }
        if (input.bufferMinutes() == null || input.bufferMinutes() < 0) {
            errors.add(conflict("INVALID_INPUT", "Buffer minutes must not be negative"));
        }
        if (input.officialsRequiredPerMatch() == null || input.officialsRequiredPerMatch() <= 0) {
            errors.add(conflict("INVALID_INPUT", "At least one official is required per match"));
        }
        if (input.availableTimeSlots() == null || input.availableTimeSlots().isEmpty()
                || input.availableTimeSlots().stream().anyMatch(slot -> slot == null)
                || new HashSet<>(input.availableTimeSlots()).size() != input.availableTimeSlots().size()) {
            errors.add(conflict("INVALID_INPUT",
                "Available time slots must be nonempty, non-null, and unique"));
        }

        Set<Long> teamIds = new HashSet<>();
        if (input.teams() == null || input.teams().size() < 2) {
            errors.add(conflict("INVALID_INPUT", "At least two teams are required"));
        } else {
            for (SchedulingTeamDTO team : input.teams()) {
                if (team == null || team.id() == null || team.id() <= 0
                        || team.name() == null || team.name().isBlank()) {
                    errors.add(conflict("INVALID_INPUT",
                        "Each team requires a positive ID and nonblank name"));
                    continue;
                }
                if (!teamIds.add(team.id())) {
                    errors.add(conflict("INVALID_INPUT", "Team IDs must be unique"));
                }
                validateAvailability(team.availability(), "Team " + team.id(), errors);
            }
        }

        Set<Long> stadiumIds = new HashSet<>();
        if (input.stadiums() == null || input.stadiums().isEmpty()) {
            errors.add(conflict("INVALID_INPUT", "At least one stadium is required"));
        } else {
            for (StadiumDTO stadium : input.stadiums()) {
                if (stadium == null || stadium.id() == null || stadium.id() <= 0
                        || stadium.name() == null || stadium.name().isBlank()) {
                    errors.add(conflict("INVALID_INPUT",
                        "Each stadium requires a positive ID and nonblank name"));
                    continue;
                }
                if (!stadiumIds.add(stadium.id())) {
                    errors.add(conflict("INVALID_INPUT", "Stadium IDs must be unique"));
                }
                validateAvailability(stadium.availability(), "Stadium " + stadium.id(), errors);
                if (stadium.supportedMatchDurationsMinutes() == null
                        || stadium.supportedMatchDurationsMinutes().isEmpty()
                        || stadium.supportedMatchDurationsMinutes().stream()
                            .anyMatch(duration -> duration == null || duration <= 0)) {
                    errors.add(conflict("INVALID_INPUT",
                        "Each stadium must list positive supported match durations"));
                }
            }
        }

        Set<Long> officialIds = new HashSet<>();
        if (input.officials() == null || input.officials().isEmpty()) {
            errors.add(conflict("INVALID_INPUT", "At least one official is required"));
        } else {
            for (OfficialDTO official : input.officials()) {
                if (official == null || official.id() == null || official.id() <= 0
                        || official.name() == null || official.name().isBlank()) {
                    errors.add(conflict("INVALID_INPUT",
                        "Each official requires a positive ID and nonblank name"));
                    continue;
                }
                if (!officialIds.add(official.id())) {
                    errors.add(conflict("INVALID_INPUT", "Official IDs must be unique"));
                }
                validateAvailability(official.availability(), "Official " + official.id(), errors);
                if (official.eligibleRounds() == null || official.eligibleRounds().isEmpty()
                        || official.eligibleRounds().stream()
                            .anyMatch(round -> round == null || round <= 0)
                        || new HashSet<>(official.eligibleRounds()).size()
                            != official.eligibleRounds().size()) {
                    errors.add(conflict("INVALID_INPUT",
                        "Each official must list unique positive eligible round numbers"));
                }
            }
        }

        validateConstraints(input.constraints(), stadiumIds, errors);
        if (input.teams() != null && input.teams().size() >= 2 && input.officials() != null) {
            int roundCount = input.teams().size() % 2 == 0
                ? input.teams().size() - 1 : input.teams().size();
            for (OfficialDTO official : input.officials()) {
                if (official != null && official.eligibleRounds() != null
                        && official.eligibleRounds().stream().anyMatch(round -> round > roundCount)) {
                    errors.add(conflict("INVALID_INPUT",
                        "Official eligibility includes a round outside this tournament"));
                }
            }
        }
        return List.copyOf(errors);
    }

    public List<String> validateSchedule(
            TournamentSchedulingInputDTO input,
            List<MatchFixture> fixtures,
            List<ScheduledMatchDTO> schedule) {
        List<String> errors = new ArrayList<>();
        if (schedule.size() != fixtures.size()) {
            errors.add("Scheduled match count does not equal generated fixture count");
        }

        Map<Integer, MatchFixture> fixtureByNumber = new HashMap<>();
        for (MatchFixture fixture : fixtures) {
            if (fixtureByNumber.put(fixture.matchNumber(), fixture) != null) {
                errors.add("Generated fixture match numbers are not unique");
            }
        }

        Map<Long, SchedulingTeamDTO> teams = new HashMap<>();
        input.teams().forEach(team -> teams.put(team.id(), team));
        Map<Long, StadiumDTO> stadiums = new HashMap<>();
        input.stadiums().forEach(stadium -> stadiums.put(stadium.id(), stadium));
        Map<Long, OfficialDTO> officials = new HashMap<>();
        input.officials().forEach(official -> officials.put(official.id(), official));

        Set<Integer> scheduledNumbers = new HashSet<>();
        for (ScheduledMatchDTO match : schedule) {
            MatchFixture fixture = match.fixture();
            if (fixture == null || !scheduledNumbers.add(fixture.matchNumber())
                    || !fixture.equals(fixtureByNumber.get(fixture.matchNumber()))) {
                errors.add("A generated fixture is missing, duplicated, or changed");
                continue;
            }
            if (match.startTime() == null || match.endTime() == null
                    || !match.endTime().equals(match.startTime()
                        .plusMinutes(input.matchDurationMinutes()))
                    || !validZonedInterval(input, match.startTime(), match.endTime())) {
                errors.add("Match " + fixture.matchNumber() + " has an invalid duration");
                continue;
            }
            LocalDate date = match.startTime().toLocalDate();
            if (date.isBefore(input.startDate()) || date.isAfter(input.endDate())
                    || match.endTime().toLocalDate().isAfter(input.endDate())
                    || !input.availableTimeSlots().contains(match.startTime().toLocalTime())) {
                errors.add("Match " + fixture.matchNumber()
                    + " is outside the tournament date range or configured time slots");
            }

            SchedulingTeamDTO team1 = teams.get(fixture.team1Id());
            SchedulingTeamDTO team2 = teams.get(fixture.team2Id());
            if (team1 == null || team2 == null
                    || !covers(team1.availability(), match.startTime(), match.endTime())
                    || !covers(team2.availability(), match.startTime(), match.endTime())) {
                errors.add("Match " + fixture.matchNumber() + " violates team availability");
            }

            StadiumDTO stadium = stadiums.get(match.stadiumId());
            LocalDateTime venueEnd = match.endTime().plusMinutes(input.bufferMinutes());
            if (stadium == null || !stadium.name().equals(match.stadiumName())
                    || !stadium.supportedMatchDurationsMinutes()
                        .contains(input.matchDurationMinutes())
                    || !validZonedInterval(input, match.startTime(), venueEnd)
                    || !covers(stadium.availability(), match.startTime(), venueEnd)) {
                errors.add("Match " + fixture.matchNumber()
                    + " violates stadium eligibility or availability");
            }
            if (match.officialIds() == null
                    || match.officialIds().size() != input.officialsRequiredPerMatch()
                    || new HashSet<>(match.officialIds()).size() != match.officialIds().size()) {
                errors.add("Match " + fixture.matchNumber()
                    + " does not have the required distinct officials");
            } else {
                for (Long officialId : match.officialIds()) {
                    OfficialDTO official = officials.get(officialId);
                    if (official == null || !official.eligibleRounds().contains(fixture.round())
                            || !covers(official.availability(), match.startTime(), match.endTime())) {
                        errors.add("Match " + fixture.matchNumber()
                            + " violates official eligibility or availability");
                    }
                }
            }
        }

        if (scheduledNumbers.size() != fixtures.size()) {
            errors.add("Not every generated fixture is scheduled exactly once");
        }
        validateResourceConflicts(input, schedule, errors);
        return List.copyOf(errors);
    }

    private void validateConstraints(
            SchedulingConstraintsDTO constraints,
            Set<Long> stadiumIds,
            List<SchedulingConflictDTO> errors) {
        if (constraints == null) {
            errors.add(conflict("INVALID_INPUT", "Scheduling constraints are required"));
            return;
        }
        if (constraints.minimumRecoveryMinutes() == null
                || constraints.minimumRecoveryMinutes() < 0) {
            errors.add(conflict("INVALID_INPUT",
                "Minimum recovery minutes must be provided and nonnegative"));
        }
        if (constraints.travelConstraintEnabled() == null) {
            errors.add(conflict("INVALID_INPUT", "Travel constraint setting is required"));
        }
        if (constraints.minimumTravelMinutes() != null
                && constraints.minimumTravelMinutes() < 0) {
            errors.add(conflict("INVALID_INPUT", "Minimum travel minutes must not be negative"));
        }
        if (constraints.venueTravelTimes() == null) {
            errors.add(conflict("INVALID_INPUT", "Venue travel-time data is required"));
            return;
        }
        if (Boolean.TRUE.equals(constraints.travelConstraintEnabled())
                && constraints.minimumTravelMinutes() == null) {
            errors.add(conflict("INVALID_INPUT",
                "Minimum travel minutes are required when travel constraints are enabled"));
        }

        Set<String> pairs = new HashSet<>();
        for (VenueTravelTimeDTO travel : constraints.venueTravelTimes()) {
            if (travel == null || travel.fromStadiumId() == null || travel.toStadiumId() == null
                    || travel.travelMinutes() == null || travel.travelMinutes() < 0
                    || travel.fromStadiumId().equals(travel.toStadiumId())
                    || !stadiumIds.contains(travel.fromStadiumId())
                    || !stadiumIds.contains(travel.toStadiumId())) {
                errors.add(conflict("INVALID_INPUT", "Invalid venue travel-time entry"));
                continue;
            }
            String key = travel.fromStadiumId() + ":" + travel.toStadiumId();
            if (!pairs.add(key)) {
                errors.add(conflict("INVALID_INPUT", "Venue travel-time pairs must be unique"));
            }
        }
        if (Boolean.TRUE.equals(constraints.travelConstraintEnabled())) {
            for (Long from : stadiumIds) {
                for (Long to : stadiumIds) {
                    if (!from.equals(to) && !pairs.contains(from + ":" + to)) {
                        errors.add(conflict("INVALID_INPUT",
                            "Travel constraints require travel times for every directed stadium pair"));
                        return;
                    }
                }
            }
        }
    }

    private void validateAvailability(
            List<AvailabilityDTO> availability,
            String resource,
            List<SchedulingConflictDTO> errors) {
        if (availability == null || availability.isEmpty()) {
            errors.add(conflict("INVALID_INPUT",
                resource + " must provide explicit availability"));
            return;
        }
        for (AvailabilityDTO window : availability) {
            if (window == null || window.date() == null || window.startTime() == null
                    || window.endTime() == null || !window.startTime().isBefore(window.endTime())) {
                errors.add(conflict("INVALID_INPUT",
                    resource + " has an invalid availability window"));
            }
        }
    }

    private void validateResourceConflicts(
            TournamentSchedulingInputDTO input,
            List<ScheduledMatchDTO> schedule,
            List<String> errors) {
        SchedulingConstraintsDTO constraints = input.constraints();
        for (int i = 0; i < schedule.size(); i++) {
            ScheduledMatchDTO first = schedule.get(i);
            if (first.fixture() == null || first.startTime() == null || first.endTime() == null) {
                continue;
            }
            for (int j = i + 1; j < schedule.size(); j++) {
                ScheduledMatchDTO second = schedule.get(j);
                if (second.fixture() == null || second.startTime() == null
                        || second.endTime() == null) {
                    continue;
                }
                boolean overlap = overlaps(input, first.startTime(), first.endTime(),
                    second.startTime(), second.endTime());
                if (first.stadiumId() != null && first.stadiumId().equals(second.stadiumId())
                        && overlaps(input, first.startTime(),
                            first.endTime().plusMinutes(input.bufferMinutes()),
                            second.startTime(),
                            second.endTime().plusMinutes(input.bufferMinutes()))) {
                    errors.add("Stadium is double-booked");
                }
                if (overlap && shareAny(first.officialIds(), second.officialIds())) {
                    errors.add("An official is assigned to overlapping matches");
                }
                if (shareTeam(first.fixture(), second.fixture())) {
                    int gapMinutes = gapMinutes(input, first, second);
                    if (gapMinutes < constraints.minimumRecoveryMinutes()) {
                        errors.add("A team does not receive its configured minimum recovery");
                    }
                    if (Boolean.TRUE.equals(constraints.travelConstraintEnabled())
                            && first.stadiumId() != null && second.stadiumId() != null
                            && !first.stadiumId().equals(second.stadiumId())) {
                        int requiredTravel = requiredTravelMinutes(
                            constraints, first.stadiumId(), second.stadiumId());
                        if (gapMinutes < requiredTravel) {
                            errors.add("A team does not have sufficient travel time between venues");
                        }
                    }
                    if (overlap) {
                        errors.add("A team is assigned to overlapping matches");
                    }
                }
            }
        }
    }

    private int requiredTravelMinutes(
            SchedulingConstraintsDTO constraints,
            Long fromStadium,
            Long toStadium) {
        int venueTravel = constraints.venueTravelTimes().stream()
            .filter(travel -> travel.fromStadiumId().equals(fromStadium)
                && travel.toStadiumId().equals(toStadium))
            .mapToInt(VenueTravelTimeDTO::travelMinutes)
            .findFirst()
            .orElse(Integer.MAX_VALUE);
        return Math.max(constraints.minimumTravelMinutes(), venueTravel);
    }

    private boolean covers(
            List<AvailabilityDTO> availability,
            LocalDateTime start,
            LocalDateTime end) {
        if (availability == null) {
            return false;
        }
        return availability.stream().anyMatch(window ->
            window != null
                && window.date().equals(start.toLocalDate())
                && window.date().equals(end.toLocalDate())
                && !start.toLocalTime().isBefore(window.startTime())
                && !end.toLocalTime().isAfter(window.endTime()));
    }

    private int gapMinutes(
            TournamentSchedulingInputDTO input,
            ScheduledMatchDTO first,
            ScheduledMatchDTO second) {
        if (!first.startTime().isAfter(second.startTime())) {
            return Math.toIntExact(java.time.Duration.between(
                first.endTime().atZone(input.timeZone()).toInstant(),
                second.startTime().atZone(input.timeZone()).toInstant()).toMinutes());
        }
        return Math.toIntExact(java.time.Duration.between(
            second.endTime().atZone(input.timeZone()).toInstant(),
            first.startTime().atZone(input.timeZone()).toInstant()).toMinutes());
    }

    private boolean shareTeam(MatchFixture first, MatchFixture second) {
        return first.team1Id().equals(second.team1Id())
            || first.team1Id().equals(second.team2Id())
            || first.team2Id().equals(second.team1Id())
            || first.team2Id().equals(second.team2Id());
    }

    private boolean shareAny(List<Long> first, List<Long> second) {
        return first != null && second != null
            && first.stream().anyMatch(second::contains);
    }

    private boolean overlaps(
            TournamentSchedulingInputDTO input,
            LocalDateTime firstStart,
            LocalDateTime firstEnd,
            LocalDateTime secondStart,
            LocalDateTime secondEnd) {
        return firstStart.atZone(input.timeZone()).toInstant()
                .isBefore(secondEnd.atZone(input.timeZone()).toInstant())
            && secondStart.atZone(input.timeZone()).toInstant()
                .isBefore(firstEnd.atZone(input.timeZone()).toInstant());
    }

    private boolean validZonedInterval(
            TournamentSchedulingInputDTO input,
            LocalDateTime start,
            LocalDateTime end) {
        List<ZoneOffset> startOffsets = input.timeZone().getRules().getValidOffsets(start);
        List<ZoneOffset> endOffsets = input.timeZone().getRules().getValidOffsets(end);
        return startOffsets.size() == 1
            && endOffsets.size() == 1
            && startOffsets.getFirst().equals(endOffsets.getFirst());
    }

    private SchedulingConflictDTO conflict(String code, String message) {
        return new SchedulingConflictDTO(code, message, null, null);
    }
}
