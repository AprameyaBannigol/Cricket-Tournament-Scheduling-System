package com.example.backend.e2.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.MatchConfiguration;

public interface MatchConfigurationRepository
        extends JpaRepository<MatchConfiguration, Long> {

    Optional<MatchConfiguration> findByTournament_TournamentId(Long tournamentId);
}
