package com.example.backend.e2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.Stadium;

public interface StadiumRepository extends JpaRepository<Stadium, Long> {

    List<Stadium> findAllByTournament_TournamentId(Long tournamentId);

    Optional<Stadium> findByTournament_TournamentIdAndStadiumId(Long tournamentId, Long stadiumId);
}
