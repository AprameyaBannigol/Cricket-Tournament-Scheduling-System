package com.example.backend.dto;

import java.util.List;

public record StadiumDTO(
    Long id,
    String name,
    List<AvailabilityDTO> availability,
    List<Integer> supportedMatchDurationsMinutes
) {
}
