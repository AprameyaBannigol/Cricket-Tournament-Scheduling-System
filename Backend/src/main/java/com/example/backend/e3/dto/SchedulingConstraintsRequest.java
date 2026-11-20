package com.example.backend.e3.dto;

import com.example.backend.e2.entity.SchedulingConstraints;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record SchedulingConstraintsRequest(
        @NotNull @PositiveOrZero Integer minimumRecoveryMinutes,
        @NotNull @Positive Integer maxMatchesPerTeamPerDay,
        @NotNull @Positive Integer maxMatchesPerStadiumPerDay,
        @NotNull Boolean travelConstraintEnabled,
        @NotNull @PositiveOrZero Integer minimumTravelMinutes,
        @NotNull Boolean avoidGroundBlackouts,
        @NotNull Boolean avoidOfficialBlackouts,
        @NotNull Boolean nightToMorningRestriction,
        @NotNull Boolean reserveDayEnforced) {

    public static SchedulingConstraintsRequest from(SchedulingConstraints row) {
        return new SchedulingConstraintsRequest(row.getMinimumRecoveryMinutes(),
            row.getMaxMatchesPerTeamPerDay(), row.getMaxMatchesPerStadiumPerDay(),
            row.getTravelConstraintEnabled(), row.getMinimumTravelMinutes(),
            row.getAvoidGroundBlackouts(), row.getAvoidOfficialBlackouts(),
            row.getNightToMorningRestriction(), row.getReserveDayEnforced());
    }
}
