package com.example.backend.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TournamentInputDTO(
    @NotNull @Positive Long tournamentId,
    @NotEmpty List<@Valid TeamDTO> teams
) {
}
