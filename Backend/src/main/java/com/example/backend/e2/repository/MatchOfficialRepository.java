package com.example.backend.e2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.MatchOfficial;
import com.example.backend.e2.entity.MatchOfficialId;

public interface MatchOfficialRepository
        extends JpaRepository<MatchOfficial, MatchOfficialId> {

    List<MatchOfficial> findAllByMatch_MatchId(Long matchId);

    @EntityGraph(attributePaths = {"official"})
    List<MatchOfficial> findAllByMatch_ScheduleVersion_VersionIdOrderById_OfficialId(Long versionId);
}
