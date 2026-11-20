package com.example.backend.e2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.Team;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findAllByTournament_TournamentId(Long tournamentId);

    Optional<Team> findByTournament_TournamentIdAndTeamId(Long tournamentId, Long teamId);
}
