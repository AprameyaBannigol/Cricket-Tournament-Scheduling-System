package com.example.backend.e2.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.example.backend.e2.entity.Fixture;

public interface FixtureRepository extends JpaRepository<Fixture, Long> {

    List<Fixture> findAllByTournament_TournamentId(Long tournamentId);

    @Query("""
        select f from Fixture f
        where f.tournament.tournamentId = :tournamentId and f.roundNumber = :round
          and ((f.team1.teamId = :firstTeam and f.team2.teamId = :secondTeam)
            or (f.team1.teamId = :secondTeam and f.team2.teamId = :firstTeam))
        """)
    Optional<Fixture> findByPair(Long tournamentId, int round, Long firstTeam, Long secondTeam);

    @Modifying
    @Query(value = """
        insert into fixture (tournament_id, round_number, match_number, team1_id, team2_id, status)
        values (:tournamentId, :round, :matchNumber, :firstTeam, :secondTeam, 'PENDING')
        on conflict (tournament_id, round_number, (least(team1_id, team2_id)),
                     (greatest(team1_id, team2_id))) do nothing
        """, nativeQuery = true)
    int insertPendingIfAbsent(Long tournamentId, int round, int matchNumber,
        Long firstTeam, Long secondTeam);
}
