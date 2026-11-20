package com.example.backend.e2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.Official;

public interface OfficialRepository extends JpaRepository<Official, Long> {

    List<Official> findAllByTournament_TournamentId(Long tournamentId);

    Optional<Official> findByTournament_TournamentIdAndOfficialId(Long tournamentId, Long officialId);
}
