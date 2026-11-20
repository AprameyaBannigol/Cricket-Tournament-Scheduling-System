package com.example.backend.e2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.ScheduleVersion;

public interface ScheduleVersionRepository extends JpaRepository<ScheduleVersion, Long> {

    List<ScheduleVersion> findAllByTournament_TournamentId(Long tournamentId);

    boolean existsByTournament_TournamentIdAndVersionName(Long tournamentId, String versionName);

    Optional<ScheduleVersion> findByTournament_TournamentIdAndVersionId(
        Long tournamentId, Long versionId);
}
