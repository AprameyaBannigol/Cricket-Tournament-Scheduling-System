package com.example.backend.e3.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TournamentRequest(
    @NotBlank(message = "Tournament name is required") @Size(max = 255) String name,
    @Size(max = 255) String edition,
    @Size(max = 255) String category,
    @Size(max = 255) String season,
    LocalDate startDate,
    LocalDate endDate,
    @Size(max = 255) String hostInstitution,
    @Size(max = 255) String ballType,
    @Size(max = 255) String status
) {
    public record Response(
        Long tournamentId, String name, String edition, String category, String season,
        LocalDate startDate, LocalDate endDate, String hostInstitution, String ballType, String status
    ) {}
}
