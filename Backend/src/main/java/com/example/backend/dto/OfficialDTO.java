package com.example.backend.dto;

import java.util.List;

public record OfficialDTO(
    Long id,
    String name,
    List<AvailabilityDTO> availability,
    List<Integer> eligibleRounds
) {
}
