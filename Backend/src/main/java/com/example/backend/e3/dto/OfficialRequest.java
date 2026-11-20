package com.example.backend.e3.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OfficialRequest(
    @NotBlank(message = "Official name is required") @Size(max = 255) String name,
    @NotBlank(message = "Official role is required") @Size(max = 255) String role,
    @Size(max = 255) String qualification,
    @Size(max = 255) String status
) {
    public record Response(Long officialId, Long tournamentId, String name, String role,
        String qualification, String status) {}
}
