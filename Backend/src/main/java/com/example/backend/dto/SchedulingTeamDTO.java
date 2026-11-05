package com.example.backend.dto;

import java.util.List;

public record SchedulingTeamDTO(
    Long id,
    String name,
    List<AvailabilityDTO> availability
) {
}
