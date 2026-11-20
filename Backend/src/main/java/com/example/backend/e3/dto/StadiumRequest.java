package com.example.backend.e3.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record StadiumRequest(
    @NotBlank(message = "Stadium name is required") @Size(max = 255) String name,
    @Size(max = 255) String shortName,
    @Size(max = 255) String groundType,
    @PositiveOrZero(message = "Stadium capacity cannot be negative") Integer capacity,
    @Positive(message = "Number of pitches must be positive") Integer numberOfPitches,
    Boolean floodlights,
    @Size(max = 255) String curator,
    @Size(max = 255) String availabilityStatus
) {
    public record Response(
        Long stadiumId, Long tournamentId, String name, String shortName, String groundType,
        Integer capacity, Integer numberOfPitches, Boolean floodlights, String curator,
        String availabilityStatus
    ) {}
}
