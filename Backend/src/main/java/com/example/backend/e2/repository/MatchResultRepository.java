package com.example.backend.e2.repository;

import java.util.Optional;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.MatchResult;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {

    Optional<MatchResult> findByMatch_MatchId(Long matchId);
    Optional<MatchResult> findByFixture_FixtureId(Long fixtureId);

    @EntityGraph(attributePaths = {"fixture", "fixture.team1", "fixture.team2", "winnerTeam"})
    List<MatchResult> findAllByFixture_FixtureIdIn(Collection<Long> fixtureIds);
}
