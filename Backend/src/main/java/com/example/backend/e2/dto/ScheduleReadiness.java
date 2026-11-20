package com.example.backend.e2.dto;

import java.util.List;

import com.example.backend.dto.SchedulingConflictDTO;

public record ScheduleReadiness(boolean ready, List<SchedulingConflictDTO> issues) {
    public ScheduleReadiness(List<SchedulingConflictDTO> issues) {
        this(issues.isEmpty(), issues);
    }
}
