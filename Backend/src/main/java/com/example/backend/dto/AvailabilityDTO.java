package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record AvailabilityDTO(
    LocalDate date,
    LocalTime startTime,
    LocalTime endTime
) {
}
