package com.example.backend.e2.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import com.example.backend.e2.entity.Tournament;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tournament t where t.tournamentId = :id")
    Optional<Tournament> findForConfigurationUpdate(@Param("id") Long id);
}
