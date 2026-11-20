package com.example.backend.e2.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateScheduleRequest(
    @NotBlank(message = "Version name is required")
    @Size(max = 100, message = "Version name must be at most 100 characters")
    String versionName
) {
}
