package com.example.backend.e3.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TeamRequest(
    @NotBlank(message = "Team name is required") @Size(max = 255) String teamName,
    @Size(max = 255) String college,
    @Size(max = 255) String department,
    @Size(max = 255) String captain,
    @Size(max = 255) String coach,
    @Positive(message = "Squad size must be positive") Integer squadSize,
    @Size(max = 255) String pool,
    @Size(max = 255) String status
) {
    public record Response(
        Long teamId, Long tournamentId, String teamName, String college, String department,
        String captain, String coach, Integer squadSize, String pool, String status
    ) {}
}
