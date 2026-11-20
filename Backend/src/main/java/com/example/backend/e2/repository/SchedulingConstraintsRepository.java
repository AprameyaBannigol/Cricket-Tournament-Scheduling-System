package com.example.backend.e2.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.SchedulingConstraints;

public interface SchedulingConstraintsRepository
        extends JpaRepository<SchedulingConstraints, Long> {

    Optional<SchedulingConstraints> findByTournament_TournamentId(Long tournamentId);
}
