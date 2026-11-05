package com.example.backend.dto;

public record SchedulingConflictDTO(
    String code,
    String message,
    Integer round,
    Integer matchNumber
) {
}
