package com.example.backend.e2.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.Match;

public interface MatchRepository extends JpaRepository<Match, Long> {

    @EntityGraph(attributePaths = {"stadium", "fixture", "fixture.team1", "fixture.team2"})
    List<Match> findAllByScheduleVersion_VersionId(Long versionId);
}
