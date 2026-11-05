package com.example.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TournamentSchedulingInputDTO(
    @NotNull @Positive Long tournamentId,
    @NotNull String tournamentName,
    @NotNull LocalDate startDate,
    @NotNull LocalDate endDate,
    @NotNull ZoneId timeZone,
    @NotEmpty List<@Valid SchedulingTeamDTO> teams,
    @NotEmpty List<@Valid StadiumDTO> stadiums,
    @NotEmpty List<@Valid OfficialDTO> officials,
    @NotNull @Positive Integer matchDurationMinutes,
    @NotEmpty List<LocalTime> availableTimeSlots,
    @NotNull Integer bufferMinutes,
    @NotNull @Positive Integer officialsRequiredPerMatch,
    @NotNull @Valid SchedulingConstraintsDTO constraints
) {
}
