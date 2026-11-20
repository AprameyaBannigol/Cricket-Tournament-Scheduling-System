package com.example.backend.e2.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.e2.dto.SavedSchedule;
import com.example.backend.e2.dto.ScheduleReadiness;
import com.example.backend.e2.dto.ScheduleVersionSummary;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.TournamentRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
public class TournamentScheduleApiService {

    private final TournamentRepository tournaments;
    private final ScheduleVersionRepository versions;
    private final TournamentScheduleOrchestrationService orchestration;
    private final SchedulePersistenceService persistence;

    public TournamentScheduleApiService(
            TournamentRepository tournaments,
            ScheduleVersionRepository versions,
            TournamentScheduleOrchestrationService orchestration,
            SchedulePersistenceService persistence) {
        this.tournaments = tournaments;
        this.versions = versions;
        this.orchestration = orchestration;
        this.persistence = persistence;
    }

    @Transactional
    public SavedSchedule generateAndSave(Long tournamentId, String versionName) {
        validateId(tournamentId);
        validateVersionName(versionName);
        // Serialize writes for a tournament, including configuration edits and repeated version names.
        tournaments.findForConfigurationUpdate(tournamentId)
            .orElseThrow(() -> new EntityNotFoundException("Tournament not found: " + tournamentId));
        if (versions.existsByTournament_TournamentIdAndVersionName(tournamentId, versionName)) {
            throw new DuplicateScheduleVersionException(tournamentId, versionName);
        }

        CompleteSchedulingResult result;
        try {
            result = orchestration.generateSchedule(tournamentId);
        } catch (MissingSchedulingSetupException exception) {
            throw new ScheduleConflictException("Complete scheduling setup before generating a version",
                List.of(missingSetup(exception)));
        }
        if (result == null
                || result.status() != CompleteSchedulingResult.Status.SCHEDULE_GENERATED
                || result.matches() == null
                || result.matches().isEmpty()
                || result.matches().size() != result.totalFixtures()
                || result.matches().size() != result.scheduledMatches()
                || result.conflicts() == null
                || !result.conflicts().isEmpty()) {
            throw new ScheduleConflictException("A complete, conflict-free schedule could not be generated",
                result == null || result.conflicts() == null ? List.of() : result.conflicts());
        }

        Long versionId = persistence.saveSchedule(tournamentId, versionName, result);
        return persistence.findSchedule(tournamentId, versionId)
            .orElseThrow(() -> new IllegalStateException("Saved schedule could not be retrieved"));
    }

    public ScheduleReadiness readiness(Long tournamentId) {
        validateId(tournamentId);
        try {
            return new ScheduleReadiness(orchestration.checkReadiness(tournamentId));
        } catch (MissingSchedulingSetupException exception) {
            return new ScheduleReadiness(List.of(missingSetup(exception)));
        }
    }

    private static SchedulingConflictDTO missingSetup(MissingSchedulingSetupException exception) {
        return new SchedulingConflictDTO("MISSING_SETUP", exception.getMessage(), null, null);
    }

    @Transactional(readOnly = true)
    public List<ScheduleVersionSummary> listSchedules(Long tournamentId) {
        requireTournament(tournamentId);
        return versions.findAllByTournament_TournamentId(tournamentId).stream()
            .sorted(Comparator.comparing(
                    (ScheduleVersion entity) -> entity.getCreatedAt(),
                    Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(ScheduleVersion::getVersionId,
                    Comparator.nullsLast(Comparator.naturalOrder())))
            .map(version -> new ScheduleVersionSummary(
                version.getVersionId(),
                version.getVersionName(),
                version.getCreatedAt(),
                version.getMatchCount() == null ? 0 : version.getMatchCount()))
            .toList();
    }

    @Transactional(readOnly = true)
    public SavedSchedule getSchedule(Long tournamentId, Long versionId) {
        requireTournament(tournamentId);
        return persistence.findSchedule(tournamentId, versionId)
            .orElseThrow(() -> new EntityNotFoundException(
                "Schedule version not found: " + tournamentId + "/" + versionId));
    }

    private void validateVersionName(String versionName) {
        if (versionName == null || versionName.isBlank()
                || versionName.codePointCount(0, versionName.length()) > 100) {
            throw new IllegalArgumentException(
                "Version name must contain 1 to 100 characters and cannot be blank");
        }
    }

    private void validateId(Long tournamentId) {
        if (tournamentId == null || tournamentId <= 0) {
            throw new IllegalArgumentException("Tournament ID must be positive");
        }
    }

    private void requireTournament(Long tournamentId) {
        validateId(tournamentId);
        tournaments.findById(tournamentId)
            .orElseThrow(() -> new EntityNotFoundException("Tournament not found: " + tournamentId));
    }
}
