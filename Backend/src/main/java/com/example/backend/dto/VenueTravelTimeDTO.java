package com.example.backend.dto;

public record VenueTravelTimeDTO(
    Long fromStadiumId,
    Long toStadiumId,
    Integer travelMinutes
) {
}
