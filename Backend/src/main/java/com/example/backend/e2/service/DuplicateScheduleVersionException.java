package com.example.backend.e2.service;

public class DuplicateScheduleVersionException extends IllegalArgumentException {
    public DuplicateScheduleVersionException(Long tournamentId, String versionName) {
        super("Schedule version already exists for tournament " + tournamentId + ": " + versionName);
    }
}
