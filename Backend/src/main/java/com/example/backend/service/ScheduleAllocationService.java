package com.example.backend.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.backend.dto.AvailabilityDTO;
import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult.Status;
import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.OfficialDTO;
import com.example.backend.dto.ScheduledMatchDTO;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.dto.SchedulingResult;
import com.example.backend.dto.SchedulingTeamDTO;
import com.example.backend.dto.StadiumDTO;
import com.example.backend.dto.TeamDTO;
import com.example.backend.dto.TournamentInputDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;

@Service
public class ScheduleAllocationService {

    private final SchedulingService fixtureGenerationService;
    private final ConstraintValidationService validationService;
    private final SchedulingSearchProperties searchProperties;

    public ScheduleAllocationService(
            SchedulingService fixtureGenerationService,
            ConstraintValidationService validationService,
            SchedulingSearchProperties searchProperties) {
        this.fixtureGenerationService = fixtureGenerationService;
        this.validationService = validationService;
        this.searchProperties = searchProperties;
    }

    public CompleteSchedulingResult generateSchedule(TournamentSchedulingInputDTO input) {
        long startNanos = System.nanoTime();
        List<SchedulingConflictDTO> inputErrors = validationService.validateInput(input);
        if (!inputErrors.isEmpty()) {
            return result(input == null ? null : input.tournamentId(),
                Status.INVALID_INPUT, 0, List.of(), 0, 0, 0,
                startNanos, List.of(), inputErrors);
        }
        if (!validSearchLimits()) {
            return result(input.tournamentId(), Status.INVALID_INPUT, 0, List.of(),
                0, 0, 0, startNanos, List.of(),
                List.of(conflict("INVALID_SEARCH_LIMITS",
                    "Configured scheduling search limits must be positive")));
        }

        SchedulingResult fixtureResult = fixtureGenerationService.generateFixtures(
            new TournamentInputDTO(input.tournamentId(),
                input.teams().stream().map(team -> new TeamDTO(team.id(), team.name())).toList())
        );
        List<MatchFixture> fixtures = fixtureResult.fixtures();
        Search search = new Search(input, fixtures, startNanos);
        search.generateCandidates();

        if (search.limitReached) {
            return result(input.tournamentId(), Status.SEARCH_LIMIT_REACHED,
                fixtures.size(), List.of(), search.nodes, search.backtracks,
                search.candidateAssignments, startNanos, List.of(),
                List.of(conflict("SEARCH_LIMIT_REACHED",
                    "A configured search limit was reached during candidate generation")));
        }

        MatchFixture noCandidateFixture = fixtures.stream()
            .filter(fixture -> search.candidates.getOrDefault(fixture.matchNumber(), List.of())
                .isEmpty())
            .findFirst()
            .orElse(null);
        if (noCandidateFixture != null) {
            return result(input.tournamentId(), Status.NO_FEASIBLE_SCHEDULE,
                fixtures.size(), List.of(), search.nodes, search.backtracks,
                search.candidateAssignments, startNanos, List.of(),
                List.of(conflict("NO_CANDIDATES",
                    "No candidate satisfies availability and eligibility for match "
                        + noCandidateFixture.matchNumber(),
                    noCandidateFixture)));
        }

        boolean scheduled = search.solve();
        if (search.limitReached) {
            return result(input.tournamentId(), Status.SEARCH_LIMIT_REACHED,
                fixtures.size(), List.of(), search.nodes, search.backtracks,
                search.candidateAssignments, startNanos, List.of(),
                List.of(conflict("SEARCH_LIMIT_REACHED",
                    "A configured search limit was reached before a complete schedule was found")));
        }
        if (!scheduled) {
            return result(input.tournamentId(), Status.NO_FEASIBLE_SCHEDULE,
                fixtures.size(), List.of(), search.nodes, search.backtracks,
                search.candidateAssignments, startNanos, List.of(),
                List.of(conflict("SEARCH_EXHAUSTED",
                    "The complete candidate search space was exhausted without a feasible schedule")));
        }

        List<ScheduledMatchDTO> schedule = fixtures.stream()
            .map(fixture -> search.assigned.get(fixture.matchNumber()).toScheduledMatch())
            .sorted(Comparator.comparingInt(match -> match.fixture().matchNumber()))
            .toList();
        List<String> validationErrors = validationService.validateSchedule(input, fixtures, schedule);
        if (!validationErrors.isEmpty()) {
            List<SchedulingConflictDTO> conflicts = validationErrors.stream()
                .map(message -> conflict("FINAL_VALIDATION_FAILED", message))
                .toList();
            return result(input.tournamentId(), Status.NO_FEASIBLE_SCHEDULE,
                fixtures.size(), List.of(), search.nodes, search.backtracks,
                search.candidateAssignments, startNanos, List.of(), conflicts);
        }

        return result(input.tournamentId(), Status.SCHEDULE_GENERATED,
            fixtures.size(), schedule, search.nodes, search.backtracks,
            search.candidateAssignments, startNanos,
            List.of(
                "Every generated fixture is scheduled exactly once.",
                "Team availability, overlap, recovery, and configured travel constraints passed.",
                "Stadium availability, duration, buffer, and overlap constraints passed.",
                "Official availability, eligibility, and overlap constraints passed."
            ),
            List.of());
    }

    private boolean validSearchLimits() {
        return searchProperties.getMaximumSearchNodes() > 0
            && searchProperties.getMaximumDurationMillis() > 0
            && searchProperties.getMaximumCandidateAssignments() > 0
            && searchProperties.getMaximumGeneratedCandidates() > 0;
    }

    private CompleteSchedulingResult result(
            Long tournamentId,
            Status status,
            int fixtureCount,
            List<ScheduledMatchDTO> matches,
            long nodes,
            long backtracks,
            long candidates,
            long startNanos,
            List<String> summary,
            List<SchedulingConflictDTO> conflicts) {
        return new CompleteSchedulingResult(
            tournamentId,
            status,
            fixtureCount,
            matches.size(),
            List.copyOf(matches),
            nodes,
            backtracks,
            candidates,
            Duration.ofNanos(System.nanoTime() - startNanos).toMillis(),
            List.copyOf(summary),
            List.copyOf(conflicts)
        );
    }

    private SchedulingConflictDTO conflict(String code, String message) {
        return new SchedulingConflictDTO(code, message, null, null);
    }

    private SchedulingConflictDTO conflict(
            String code,
            String message,
            MatchFixture fixture) {
        return new SchedulingConflictDTO(
            code, message, fixture.round(), fixture.matchNumber());
    }

    private final class Search {

        private final TournamentSchedulingInputDTO input;
        private final List<MatchFixture> fixtures;
        private final long startNanos;
        private final Map<Integer, List<Candidate>> candidates = new HashMap<>();
        private final Map<Integer, Candidate> assigned = new HashMap<>();
        private final Map<Long, SchedulingTeamDTO> teams = new HashMap<>();
        private final Map<Long, Integer> stadiumCandidateCounts = new HashMap<>();
        private final Map<Long, Integer> officialCandidateCounts = new HashMap<>();
        private long nodes;
        private long backtracks;
        private long candidateAssignments;
        private long generatedCandidates;
        private boolean limitReached;

        Search(TournamentSchedulingInputDTO input, List<MatchFixture> fixtures, long startNanos) {
            this.input = input;
            this.fixtures = fixtures;
            this.startNanos = startNanos;
            input.teams().forEach(team -> teams.put(team.id(), team));
        }

        private void generateCandidates() {
            List<LocalTime> slots = input.availableTimeSlots().stream().sorted().toList();
            List<StadiumDTO> orderedStadiums = input.stadiums().stream()
                .sorted(Comparator.comparing(StadiumDTO::id)).toList();
            List<OfficialDTO> orderedOfficials = input.officials().stream()
                .sorted(Comparator.comparing(OfficialDTO::id)).toList();
            for (MatchFixture fixture : fixtures) {
                List<Candidate> matchCandidates = new ArrayList<>();
                LocalDate date = input.startDate();
                while (!date.isAfter(input.endDate())) {
                    if (expired()) {
                        limitReached = true;
                        return;
                    }
                    for (LocalTime slot : slots) {
                        if (expired()) {
                            limitReached = true;
                            return;
                        }
                        LocalDateTime start = LocalDateTime.of(date, slot);
                        LocalDateTime end = start.plusMinutes(input.matchDurationMinutes());
                        if (!end.toLocalDate().equals(date)
                                || !validZonedInterval(start, end)
                                || !available(teams.get(fixture.team1Id()).availability(), start, end)
                                || !available(teams.get(fixture.team2Id()).availability(), start, end)) {
                            continue;
                        }
                        for (StadiumDTO stadium : orderedStadiums) {
                            if (expired()) {
                                limitReached = true;
                                return;
                            }
                            LocalDateTime venueEnd = end.plusMinutes(input.bufferMinutes());
                            if (!stadium.supportedMatchDurationsMinutes()
                                    .contains(input.matchDurationMinutes())
                                    || !validZonedInterval(start, venueEnd)
                                    || !available(stadium.availability(), start, venueEnd)) {
                                continue;
                            }
                            List<OfficialDTO> eligibleOfficials = orderedOfficials.stream()
                                .filter(official -> official.eligibleRounds().contains(fixture.round())
                                    && available(official.availability(), start, end))
                                .toList();
                            if (eligibleOfficials.size() < input.officialsRequiredPerMatch()) {
                                continue;
                            }
                            addOfficialCombinations(
                                fixture, start, end, stadium, eligibleOfficials,
                                0, new ArrayList<>(), matchCandidates);
                            if (limitReached) {
                                return;
                            }
                        }
                    }
                    if (date.equals(input.endDate())) {
                        break;
                    }
                    date = date.plusDays(1);
                }
                candidates.put(fixture.matchNumber(), List.copyOf(matchCandidates));
                for (Candidate candidate : matchCandidates) {
                    stadiumCandidateCounts.merge(candidate.stadium.id(), 1, Integer::sum);
                    candidate.officials.forEach(official ->
                        officialCandidateCounts.merge(official.id(), 1, Integer::sum));
                }
            }
        }

        private void addOfficialCombinations(
                MatchFixture fixture,
                LocalDateTime start,
                LocalDateTime end,
                StadiumDTO stadium,
                List<OfficialDTO> eligible,
                int index,
                List<OfficialDTO> selected,
                List<Candidate> output) {
            if (limitReached) {
                return;
            }
            if (selected.size() == input.officialsRequiredPerMatch()) {
                if (generatedCandidates >= searchProperties.getMaximumGeneratedCandidates()) {
                    limitReached = true;
                    return;
                }
                output.add(new Candidate(fixture, start, end, stadium, List.copyOf(selected)));
                generatedCandidates++;
                return;
            }
            int stillNeeded = input.officialsRequiredPerMatch() - selected.size();
            for (int i = index; i <= eligible.size() - stillNeeded; i++) {
                selected.add(eligible.get(i));
                addOfficialCombinations(
                    fixture, start, end, stadium, eligible, i + 1, selected, output);
                selected.remove(selected.size() - 1);
                if (limitReached) {
                    return;
                }
            }
        }

        private boolean solve() {
            if (expired()) {
                limitReached = true;
                return false;
            }
            if (assigned.size() == fixtures.size()) {
                return true;
            }
            if (nodes >= searchProperties.getMaximumSearchNodes()) {
                limitReached = true;
                return false;
            }
            nodes++;

            MatchFixture selectedFixture = null;
            List<Candidate> feasibleForSelected = List.of();
            for (MatchFixture fixture : fixtures) {
                if (assigned.containsKey(fixture.matchNumber())) {
                    continue;
                }
                List<Candidate> feasible = new ArrayList<>();
                for (Candidate candidate : candidates.get(fixture.matchNumber())) {
                    if (expired()) {
                        limitReached = true;
                        return false;
                    }
                    if (isFeasible(candidate)) {
                        feasible.add(candidate);
                    }
                }
                if (selectedFixture == null || feasible.size() < feasibleForSelected.size()
                        || (feasible.size() == feasibleForSelected.size()
                            && fixtureOrder().compare(fixture, selectedFixture) < 0)) {
                    selectedFixture = fixture;
                    feasibleForSelected = feasible;
                }
                if (feasibleForSelected.isEmpty()) {
                    return false;
                }
            }
            if (limitReached) {
                return false;
            }

            List<Candidate> ordered = feasibleForSelected.stream()
                .sorted(candidateOrder())
                .toList();
            for (Candidate candidate : ordered) {
                if (expired()
                        || candidateAssignments >= searchProperties.getMaximumCandidateAssignments()) {
                    limitReached = true;
                    return false;
                }
                candidateAssignments++;
                assigned.put(candidate.fixture.matchNumber(), candidate);
                if (solve()) {
                    return true;
                }
                assigned.remove(candidate.fixture.matchNumber());
                if (!limitReached) {
                    backtracks++;
                } else {
                    return false;
                }
            }
            return false;
        }

        private boolean isFeasible(Candidate candidate) {
            for (Candidate previous : assigned.values()) {
                if (candidate.stadium.id().equals(previous.stadium.id())
                        && overlaps(candidate.start, candidate.venueEnd(input.bufferMinutes()),
                            previous.start, previous.venueEnd(input.bufferMinutes()))) {
                    return false;
                }
                if (overlaps(candidate.start, candidate.end, previous.start, previous.end)
                        && sharesOfficial(candidate, previous)) {
                    return false;
                }
                if (sharesTeam(candidate.fixture, previous.fixture)) {
                    int gap = gapMinutes(candidate, previous);
                    if (gap < input.constraints().minimumRecoveryMinutes()) {
                        return false;
                    }
                    if (Boolean.TRUE.equals(input.constraints().travelConstraintEnabled())
                            && !candidate.stadium.id().equals(previous.stadium.id())
                            && gap < requiredTravelMinutes(candidate, previous)) {
                        return false;
                    }
                }
            }
            return true;
        }

        private int requiredTravelMinutes(Candidate first, Candidate second) {
            Long from;
            Long to;
            if (first.start.isBefore(second.start)) {
                from = first.stadium.id();
                to = second.stadium.id();
            } else {
                from = second.stadium.id();
                to = first.stadium.id();
            }
            int venueTravel = input.constraints().venueTravelTimes().stream()
                .filter(travel -> travel.fromStadiumId().equals(from)
                    && travel.toStadiumId().equals(to))
                .mapToInt(travel -> travel.travelMinutes())
                .findFirst()
                .orElse(Integer.MAX_VALUE);
            return Math.max(input.constraints().minimumTravelMinutes(), venueTravel);
        }

        private Comparator<Candidate> candidateOrder() {
            return Comparator
                .comparingLong(this::flexibilityCost)
                .thenComparingInt(candidate -> stadiumUsage(candidate.stadium.id()))
                .thenComparingInt(this::assignedOfficialUsage)
                .thenComparingLong(this::idleGapCost)
                .thenComparing(candidate -> candidate.start)
                .thenComparing(candidate -> candidate.stadium.id())
                .thenComparing(candidate -> candidate.officials.stream()
                    .map(OfficialDTO::id).toList().toString());
        }

        private long flexibilityCost(Candidate candidate) {
            long cost = stadiumCandidateCounts.getOrDefault(candidate.stadium.id(), 0);
            for (OfficialDTO official : candidate.officials) {
                cost += officialCandidateCounts.getOrDefault(official.id(), 0);
            }
            return cost;
        }

        private int stadiumUsage(Long stadiumId) {
            return (int) assigned.values().stream()
                .filter(candidate -> candidate.stadium.id().equals(stadiumId)).count();
        }

        private int assignedOfficialUsage(Candidate candidate) {
            return candidate.officials.stream().mapToInt(official ->
                (int) assigned.values().stream()
                    .filter(existing -> existing.officials.stream()
                        .anyMatch(item -> item.id().equals(official.id())))
                    .count()).sum();
        }

        private long idleGapCost(Candidate candidate) {
            long nearest = Long.MAX_VALUE;
            for (Candidate existing : assigned.values()) {
                if (sharesTeam(candidate.fixture, existing.fixture)) {
                    long gap = Math.abs(Duration.between(
                        candidate.start.isAfter(existing.start) ? existing.end : candidate.end,
                        candidate.start.isAfter(existing.start) ? candidate.start : existing.start
                    ).toMinutes());
                    nearest = Math.min(nearest, gap);
                }
            }
            return nearest == Long.MAX_VALUE ? 0 : nearest;
        }

        private Comparator<MatchFixture> fixtureOrder() {
            return Comparator.comparingInt(MatchFixture::round)
                .thenComparingInt(MatchFixture::matchNumber);
        }

        private boolean available(
                List<AvailabilityDTO> windows,
                LocalDateTime start,
                LocalDateTime end) {
            return windows.stream().anyMatch(window ->
                window.date().equals(start.toLocalDate())
                    && window.date().equals(end.toLocalDate())
                    && !start.toLocalTime().isBefore(window.startTime())
                    && !end.toLocalTime().isAfter(window.endTime()));
        }

        private boolean validZonedInterval(LocalDateTime start, LocalDateTime end) {
            List<java.time.ZoneOffset> startOffsets =
                input.timeZone().getRules().getValidOffsets(start);
            List<java.time.ZoneOffset> endOffsets =
                input.timeZone().getRules().getValidOffsets(end);
            return startOffsets.size() == 1
                && endOffsets.size() == 1
                && startOffsets.getFirst().equals(endOffsets.getFirst());
        }

        private boolean expired() {
            return Duration.ofNanos(System.nanoTime() - startNanos).toMillis()
                >= searchProperties.getMaximumDurationMillis();
        }

        private boolean overlaps(
                LocalDateTime firstStart,
                LocalDateTime firstEnd,
                LocalDateTime secondStart,
                LocalDateTime secondEnd) {
            return firstStart.atZone(input.timeZone()).toInstant()
                    .isBefore(secondEnd.atZone(input.timeZone()).toInstant())
                && secondStart.atZone(input.timeZone()).toInstant()
                    .isBefore(firstEnd.atZone(input.timeZone()).toInstant());
        }

        private int gapMinutes(Candidate first, Candidate second) {
            if (!first.start.isAfter(second.start)) {
                return Math.toIntExact(Duration.between(
                    first.end.atZone(input.timeZone()).toInstant(),
                    second.start.atZone(input.timeZone()).toInstant()).toMinutes());
            }
            return Math.toIntExact(Duration.between(
                second.end.atZone(input.timeZone()).toInstant(),
                first.start.atZone(input.timeZone()).toInstant()).toMinutes());
        }

        private boolean sharesTeam(MatchFixture first, MatchFixture second) {
            return first.team1Id().equals(second.team1Id())
                || first.team1Id().equals(second.team2Id())
                || first.team2Id().equals(second.team1Id())
                || first.team2Id().equals(second.team2Id());
        }

        private boolean sharesOfficial(Candidate first, Candidate second) {
            Set<Long> assignedOfficials = new HashSet<>();
            first.officials.forEach(official -> assignedOfficials.add(official.id()));
            return second.officials.stream().anyMatch(official ->
                assignedOfficials.contains(official.id()));
        }
    }

    private record Candidate(
        MatchFixture fixture,
        LocalDateTime start,
        LocalDateTime end,
        StadiumDTO stadium,
        List<OfficialDTO> officials
    ) {
        LocalDateTime venueEnd(int bufferMinutes) {
            return end.plusMinutes(bufferMinutes);
        }

        ScheduledMatchDTO toScheduledMatch() {
            return new ScheduledMatchDTO(
                fixture,
                start,
                end,
                stadium.id(),
                stadium.name(),
                officials.stream().map(OfficialDTO::id).toList()
            );
        }
    }
}
