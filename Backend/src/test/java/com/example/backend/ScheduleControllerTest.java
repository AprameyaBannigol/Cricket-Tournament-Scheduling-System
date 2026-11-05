package com.example.backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.example.backend.dto.MatchFixture;
import com.example.backend.dto.SchedulingResult;
import com.example.backend.dto.TeamDTO;
import com.example.backend.dto.TournamentInputDTO;
import com.example.backend.service.FixtureGenerationService;

class ScheduleControllerTest {

    private final FixtureGenerationService service = new FixtureGenerationService();

    @Test
    void generatesCompleteRoundRobinFixturesForEvenAndOddTeamCounts() {
        assertRoundRobinFixtures(2);
        assertRoundRobinFixtures(3);
        assertRoundRobinFixtures(4);
        assertRoundRobinFixtures(5);
        assertRoundRobinFixtures(6);
        assertRoundRobinFixtures(8);
        assertRoundRobinFixtures(10);
    }

    @Test
    void rejectsDuplicateTeamIds() {
        TournamentInputDTO tournament = new TournamentInputDTO(1L, List.of(
            new TeamDTO(1L, "Team 1"),
            new TeamDTO(1L, "Duplicate")
        ));

        assertThrows(IllegalArgumentException.class,
            () -> service.generateFixtures(tournament));
    }

    private void assertRoundRobinFixtures(int teamCount) {
        List<TeamDTO> teams = new ArrayList<>();
        for (long id = 1; id <= teamCount; id++) {
            teams.add(new TeamDTO(id, "Team " + id));
        }

        SchedulingResult result = service.generateFixtures(
            new TournamentInputDTO(1L, teams)
        );
        List<MatchFixture> fixtures = result.fixtures();

        assertEquals(1L, result.tournamentId());
        assertEquals(SchedulingResult.Status.FIXTURES_GENERATED, result.status());
        assertEquals(teamCount * (teamCount - 1) / 2, fixtures.size());

        Set<String> pairings = new HashSet<>();
        Map<Long, Integer> appearances = new HashMap<>();
        for (MatchFixture fixture : fixtures) {
            assertNotEquals(fixture.team1Id(), fixture.team2Id());
            String pairing = Math.min(fixture.team1Id(), fixture.team2Id())
                + "-" + Math.max(fixture.team1Id(), fixture.team2Id());
            assertTrue(pairings.add(pairing), "Duplicate pairing: " + pairing);
            appearances.merge(fixture.team1Id(), 1, Integer::sum);
            appearances.merge(fixture.team2Id(), 1, Integer::sum);
        }

        int expectedRounds = teamCount % 2 == 0 ? teamCount - 1 : teamCount;
        assertEquals(expectedRounds, fixtures.stream()
            .map(MatchFixture::round)
            .distinct()
            .count());

        for (int round = 1; round <= expectedRounds; round++) {
            int currentRound = round;
            List<MatchFixture> roundFixtures = fixtures.stream()
                .filter(fixture -> fixture.round() == currentRound)
                .toList();
            assertEquals(teamCount / 2, roundFixtures.size());

            Set<Long> teamsInRound = new HashSet<>();
            for (MatchFixture fixture : roundFixtures) {
                assertTrue(teamsInRound.add(fixture.team1Id()));
                assertTrue(teamsInRound.add(fixture.team2Id()));
            }
        }

        int expectedAppearances = teamCount % 2 == 0 ? expectedRounds : expectedRounds - 1;
        for (long teamId = 1; teamId <= teamCount; teamId++) {
            assertEquals(expectedAppearances, appearances.get(teamId));
        }
    }
}
