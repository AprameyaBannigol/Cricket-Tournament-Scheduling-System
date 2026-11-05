package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TeamDTO(
    @NotNull @Positive Long id,
    @NotBlank String name
) {
}
