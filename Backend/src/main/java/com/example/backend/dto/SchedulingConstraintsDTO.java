package com.example.backend.dto;

import java.util.List;

public record SchedulingConstraintsDTO(
    Integer minimumRecoveryMinutes,
    Boolean travelConstraintEnabled,
    Integer minimumTravelMinutes,
    List<VenueTravelTimeDTO> venueTravelTimes
) {
}
