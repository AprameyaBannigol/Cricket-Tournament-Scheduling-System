package com.example.backend.e2.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record MatchResultRequest(
        @NotBlank String resultType,
        @NotNull @PositiveOrZero Integer team1Score,
        @NotNull @PositiveOrZero @Max(10) Integer team1Wickets,
        @NotBlank String team1Overs,
        @NotNull @PositiveOrZero Integer team2Score,
        @NotNull @PositiveOrZero @Max(10) Integer team2Wickets,
        @NotBlank String team2Overs,
        @Size(max = 1000) String remarks) {
}
