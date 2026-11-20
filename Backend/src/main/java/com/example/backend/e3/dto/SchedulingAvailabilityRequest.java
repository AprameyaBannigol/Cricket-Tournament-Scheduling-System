package com.example.backend.e3.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SchedulingAvailabilityRequest(@NotNull List<@NotNull @Valid Window> windows) {

    public enum Status { AVAILABLE, UNAVAILABLE }

    public record Window(
            @NotNull LocalDate date,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            @NotNull Status status) {
    }
}
