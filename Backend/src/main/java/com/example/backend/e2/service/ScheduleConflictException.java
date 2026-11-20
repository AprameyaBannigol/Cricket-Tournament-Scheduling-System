package com.example.backend.e2.service;

import java.util.List;

import com.example.backend.dto.SchedulingConflictDTO;

public class ScheduleConflictException extends RuntimeException {

    private final List<SchedulingConflictDTO> issues;

    public ScheduleConflictException(String message) {
        this(message, List.of());
    }

    public ScheduleConflictException(String message, List<SchedulingConflictDTO> issues) {
        super(message);
        this.issues = issues;
    }

    public List<SchedulingConflictDTO> getIssues() {
        return issues;
    }
}
