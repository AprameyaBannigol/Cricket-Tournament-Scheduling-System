package com.example.backend.e2.dto;

import java.time.LocalDateTime;

public record ScheduleVersionSummary(
    Long versionId,
    String versionName,
    LocalDateTime createdAt,
    int matchCount
) {
}
