package com.example.backend.e3.dto;

import java.math.BigDecimal;

import com.example.backend.e2.entity.MatchConfiguration;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MatchConfigurationRequest(
        @NotBlank @Size(max = 255) String matchFormat,
        @NotNull @Positive Integer oversPerInnings,
        @NotNull @Positive Integer maxBowlerOvers,
        @PositiveOrZero Integer powerplayOvers,
        @NotNull @PositiveOrZero Integer inningsBreakMinutes,
        @NotNull @Positive Integer matchDurationMinutes,
        @PositiveOrZero Integer minOversForDls,
        @NotNull @PositiveOrZero @Digits(integer = 36, fraction = 2) BigDecimal pointsForWin,
        @NotNull @PositiveOrZero @Digits(integer = 36, fraction = 2) BigDecimal pointsForTie,
        @NotNull @PositiveOrZero @Digits(integer = 36, fraction = 2) BigDecimal pointsForLoss,
        @NotNull Boolean superOverEnabled) {

    public static MatchConfigurationRequest from(MatchConfiguration row) {
        return new MatchConfigurationRequest(row.getMatchFormat(), row.getOversPerInnings(),
            row.getMaxBowlerOvers(), row.getPowerplayOvers(), row.getInningsBreakMinutes(),
            row.getMatchDurationMinutes(), row.getMinOversForDls(), row.getPointsForWin(),
            row.getPointsForTie(), row.getPointsForLoss(), row.getSuperOverEnabled());
    }
}
