package com.example.backend.dto;

import java.util.List;

public record CompleteSchedulingResult(
    Long tournamentId,
    Status status,
    int totalFixtures,
    int scheduledMatches,
    List<ScheduledMatchDTO> matches,
    long searchNodesExplored,
    long backtracks,
    long candidateAssignmentsConsidered,
    long executionTimeMillis,
    List<String> validationSummary,
    List<SchedulingConflictDTO> conflicts
) {
    public enum Status {
        SCHEDULE_GENERATED,
        INVALID_INPUT,
        NO_FEASIBLE_SCHEDULE,
        SEARCH_LIMIT_REACHED
    }
}
