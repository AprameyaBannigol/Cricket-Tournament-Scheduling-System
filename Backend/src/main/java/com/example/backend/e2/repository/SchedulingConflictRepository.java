package com.example.backend.e2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.SchedulingConflict;

public interface SchedulingConflictRepository
        extends JpaRepository<SchedulingConflict, Long> {

    List<SchedulingConflict> findAllByScheduleVersion_VersionId(Long versionId);

    List<SchedulingConflict> findAllByScheduleVersion_VersionIdAndResolved(
        Long versionId,
        Boolean resolved
    );
}
