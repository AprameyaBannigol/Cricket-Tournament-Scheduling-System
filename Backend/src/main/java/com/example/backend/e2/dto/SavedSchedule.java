package com.example.backend.e2.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.example.backend.dto.MatchFixture;

public record SavedSchedule(
    Long tournamentId,
    Long versionId,
    String versionName,
    LocalDateTime createdAt,
    int matchCount,
    List<SavedMatch> matches
) {
    public record SavedMatch(
        Long matchId,
        Long fixtureId,
        MatchFixture fixture,
        String fixtureStatus,
        Long stadiumId,
        String stadiumName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer pitchNumber,
        String matchStatus,
        List<OfficialAssignment> officials
    ) {
    }

    public record OfficialAssignment(Long officialId, String name, String assignedRole) {
    }
}
