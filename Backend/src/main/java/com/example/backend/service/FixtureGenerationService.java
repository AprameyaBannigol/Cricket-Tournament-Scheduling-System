package com.example.backend.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.SchedulingResult;
import com.example.backend.dto.TeamDTO;
import com.example.backend.dto.TournamentInputDTO;

@Service
public class FixtureGenerationService implements SchedulingService {

    @Override
    public SchedulingResult generateFixtures(TournamentInputDTO tournament) {
        if (tournament == null || tournament.tournamentId() == null
                || tournament.tournamentId() <= 0 || tournament.teams() == null) {
            throw new IllegalArgumentException("Tournament and teams are required");
        }

        HashSet<Long> teamIds = new HashSet<>();
        for (TeamDTO team : tournament.teams()) {
            if (team == null || team.id() == null || team.name() == null
                    || team.id() <= 0 || team.name().isBlank()) {
                throw new IllegalArgumentException(
                    "Each team requires a positive ID and nonblank name"
                );
            }
            if (!teamIds.add(team.id())) {
                throw new IllegalArgumentException("Team IDs must be unique");
            }
        }

        List<TeamDTO> teams = tournament.teams().stream()
            .sorted(Comparator.comparing(TeamDTO::id))
            .toList();

        if (teams.size() < 2) {
            throw new IllegalArgumentException("At least two teams are required");
        }

        // An odd team count requires one BYE per round.
        List<TeamDTO> rotating = new ArrayList<>(teams);
        if (rotating.size() % 2 != 0) {
            rotating.add(null);
        }

        int n = rotating.size();
        int matchNumber = 1;
        List<MatchFixture> fixtures = new ArrayList<>();

        for (int round = 0; round < n - 1; round++) {
            for (int i = 0; i < n / 2; i++) {
                TeamDTO team1 = rotating.get(i);
                TeamDTO team2 = rotating.get(n - 1 - i);

                if (team1 == null || team2 == null) {
                    continue;
                }

                fixtures.add(new MatchFixture(
                    round + 1,
                    matchNumber++,
                    team1.id(),
                    team1.name(),
                    team2.id(),
                    team2.name()
                ));
            }

            // Circle-method rotation: keep first position fixed.
            rotating.add(1, rotating.remove(n - 1));
        }

        return new SchedulingResult(
            tournament.tournamentId(),
            SchedulingResult.Status.FIXTURES_GENERATED,
            List.copyOf(fixtures)
        );
    }
}
