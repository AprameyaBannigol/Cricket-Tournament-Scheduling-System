package com.example.backend.e3.service;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import com.example.backend.e2.entity.Fixture;
import com.example.backend.e2.entity.Match;
import com.example.backend.e2.entity.MatchConfiguration;
import com.example.backend.e2.entity.ScheduleVersion;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.MatchConfigurationRepository;
import com.example.backend.e2.repository.MatchRepository;
import com.example.backend.e2.repository.ScheduleVersionRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e2.repository.MatchResultRepository;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:batch5stats;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
class MatchResultsAndStatisticsIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private TournamentRepository tournaments;
    @Autowired private TeamRepository teams;
    @Autowired private StadiumRepository stadiums;
    @Autowired private FixtureRepository fixtures;
    @Autowired private ScheduleVersionRepository versions;
    @Autowired private MatchRepository matches;
    @Autowired private MatchConfigurationRepository configurations;
    @Autowired private MatchResultRepository results;

    private Tournament cup;
    private Tournament otherCup;
    private Team falcons;
    private Team owls;
    private Fixture firstFixture;
    private Fixture secondFixture;
    private Fixture thirdFixture;
    private Fixture fourthFixture;
    private String base;

    @BeforeEach
    void seedIsolatedTournament() {
        cup = tournament("Batch 5 isolated cup");
        otherCup = tournament("Batch 5 other cup");
        falcons = team(cup, "Falcons");
        owls = team(cup, "Owls");
        Team foreign = team(otherCup, "Foreign team");
        firstFixture = fixture(cup, falcons, owls, 1);
        secondFixture = fixture(cup, falcons, owls, 2);
        thirdFixture = fixture(cup, falcons, owls, 3);
        fourthFixture = fixture(cup, falcons, owls, 4);
        fixture(otherCup, foreign, team(otherCup, "Foreign opponent"), 1);
        configuration(cup, 20);
        schedule(firstFixture, "First version", "First Ground", LocalDateTime.of(2026, 12, 1, 10, 0));
        schedule(firstFixture, "Revised version", "Second Ground", LocalDateTime.of(2026, 12, 1, 10, 0));
        schedule(secondFixture, "First version", "First Ground", LocalDateTime.of(2026, 12, 2, 10, 0));
        schedule(thirdFixture, "First version", "Third Ground", LocalDateTime.of(2026, 12, 3, 10, 0));
        schedule(fourthFixture, "First version", "Fourth Ground", LocalDateTime.of(2026, 12, 3, 14, 0));
        base = "/api/tournaments/" + cup.getTournamentId();
    }

    @Test
    void createsEditsAndRetrievesResultAcrossScheduleVersionsAndRecalculatesStatistics() throws Exception {
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 150, 4, "20.0", 120, 10, "18.3")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.result.winnerTeamId").value(falcons.getTeamId().intValue()))
            .andExpect(jsonPath("$.result.winningMargin").value(30));
        mvc.perform(get(resultPath(firstFixture))).andExpect(status().isOk())
            .andExpect(jsonPath("$.result.resultType").value("COMPLETED"));
        mvc.perform(get(base + "/matches")).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()" ).value(4))
            .andExpect(jsonPath("$[0].result.team1Score").value(150));

        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("TIED", 100, 8, "18.3", 100, 9, "18.2")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.resultType").value("TIED"))
            .andExpect(jsonPath("$.result.winnerTeamId").doesNotExist());
        mvc.perform(get(resultPath(firstFixture))).andExpect(status().isOk())
            .andExpect(jsonPath("$.result.resultType").value("TIED"));
        org.junit.jupiter.api.Assertions.assertTrue(results.findByFixture_FixtureId(firstFixture.getFixtureId()).isPresent());
        org.junit.jupiter.api.Assertions.assertEquals(1, results.findAllByFixture_FixtureIdIn(
            java.util.List.of(firstFixture.getFixtureId())).size());

        mvc.perform(put(resultPath(secondFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("NO_RESULT", 0, 0, "0.0", 0, 0, "0.0")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.resultType").value("NO_RESULT"));
        mvc.perform(put(resultPath(thirdFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("ABANDONED", 0, 0, "0.0", 0, 0, "0.0")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.resultType").value("ABANDONED"));
        mvc.perform(put(resultPath(fourthFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 50, 3, "8.0", 40, 1, "8.0")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.winner").value("Falcons"));
        mvc.perform(get(base + "/standings")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].team").value("Falcons"))
            .andExpect(jsonPath("$[0].played").value(4))
            .andExpect(jsonPath("$[0].won").value(1))
            .andExpect(jsonPath("$[0].tied").value(1))
            .andExpect(jsonPath("$[0].noResult").value(2))
            .andExpect(jsonPath("$[0].points").value(5));
        mvc.perform(get(base + "/analytics")).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalFixtures").value(4))
            .andExpect(jsonPath("$.completedMatches").value(2))
            .andExpect(jsonPath("$.noResultMatches").value(2))
            .andExpect(jsonPath("$.totalRuns").value(290))
            .andExpect(jsonPath("$.teamPerformance[0].wins").value(1))
            .andExpect(jsonPath("$.teamPerformance[1].losses").value(1))
            .andExpect(jsonPath("$.stadiumUsage.length()").value(4));
        mvc.perform(get("/api/tournaments/" + otherCup.getTournamentId() + "/standings"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].played").value(0));
        mvc.perform(get("/api/tournaments/" + otherCup.getTournamentId() + "/matches/" + firstFixture.getFixtureId() + "/result"))
            .andExpect(status().isNotFound());
    }

    @Test
    void rejectsInvalidScoresWicketsOversAndTournamentOwnership() throws Exception {
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 100, 11, "20.0", 99, 5, "19.0")))
            .andExpect(status().isBadRequest());
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 100, 2, "17.6", 99, 5, "19.0")))
            .andExpect(status().isBadRequest());
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 100, 2, "20.1", 99, 5, "19.0")))
            .andExpect(status().isBadRequest());
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("TIED", 100, 2, "17.0", 99, 5, "19.0")))
            .andExpect(status().isBadRequest());
        mvc.perform(put("/api/tournaments/" + otherCup.getTournamentId() + "/matches/" + firstFixture.getFixtureId() + "/result")
                .contentType(MediaType.APPLICATION_JSON).content(result("COMPLETED", 100, 2, "17.0", 99, 5, "19.0")))
            .andExpect(status().isNotFound());
        org.junit.jupiter.api.Assertions.assertTrue(results.findByFixture_FixtureId(firstFixture.getFixtureId()).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 10, 15, 20, 50, 7})
    void resultValidationStandingsAndAnalyticsUseSavedOvers(int oversLimit) throws Exception {
        setOvers(oversLimit);
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 100, 2, oversLimit + ".0", 90, 3, "1.0")))
            .andExpect(status().isOk());
        mvc.perform(put(resultPath(secondFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 100, 2, oversLimit + ".1", 90, 3, "1.0")))
            .andExpect(status().isBadRequest());
        mvc.perform(get(base + "/standings")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].won").value(1));
        mvc.perform(get(base + "/analytics")).andExpect(status().isOk())
            .andExpect(jsonPath("$.completedMatches").value(1));
    }

    @ParameterizedTest
    @ValueSource(ints = {5, 10, 15, 20, 50, 7})
    void nrrUsesLegalBallsAndConfiguredAllocationForAllOutInnings(int oversLimit) throws Exception {
        setOvers(oversLimit);
        mvc.perform(put(resultPath(firstFixture)).contentType(MediaType.APPLICATION_JSON)
                .content(result("COMPLETED", 100, 10, "4.2", 80, 5, "4.3")))
            .andExpect(status().isOk());
        double expectedNrr = java.math.BigDecimal.valueOf(100)
            .divide(java.math.BigDecimal.valueOf(oversLimit), 8, java.math.RoundingMode.HALF_UP)
            .subtract(java.math.BigDecimal.valueOf(480)
                .divide(java.math.BigDecimal.valueOf(27), 8, java.math.RoundingMode.HALF_UP))
            .setScale(3, java.math.RoundingMode.HALF_UP).doubleValue();
        mvc.perform(get(base + "/standings")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].team").value("Falcons"))
            .andExpect(jsonPath("$[0].netRunRate").value(expectedNrr));
        assertEquals(105, TournamentStatisticsService.cricketBalls(new java.math.BigDecimal("17.3")));
    }

    @Test
    void emptyTournamentHasDeterministicZeroStandingsAndAnalytics() throws Exception {
        Tournament empty = tournament("Empty tournament");
        team(empty, "Owls");
        team(empty, "Falcons");
        String emptyBase = "/api/tournaments/" + empty.getTournamentId();
        mvc.perform(get(emptyBase + "/standings")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].team").value("Falcons"))
            .andExpect(jsonPath("$[0].position").value(1))
            .andExpect(jsonPath("$[0].netRunRate").value(0));
        mvc.perform(get(emptyBase + "/analytics")).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalFixtures").value(0))
            .andExpect(jsonPath("$.completionPercentage").value(0))
            .andExpect(jsonPath("$.pendingMatches").value(0))
            .andExpect(jsonPath("$.resultDistribution.completed").value(0));
    }

    private Tournament tournament(String name) {
        Tournament value = new Tournament(); value.setName(name);
        value.setStartDate(LocalDate.of(2026, 12, 1)); value.setEndDate(LocalDate.of(2026, 12, 3));
        return tournaments.save(value);
    }
    private Team team(Tournament tournament, String name) {
        Team value = new Team(); value.setTournament(tournament); value.setTeamName(name); value.setStatus("ACTIVE");
        return teams.save(value);
    }
    private Fixture fixture(Tournament tournament, Team first, Team second, int number) {
        Fixture value = new Fixture(); value.setTournament(tournament); value.setTeam1(first); value.setTeam2(second);
        value.setRoundNumber(1); value.setMatchNumber(number); value.setStatus("PENDING");
        return fixtures.save(value);
    }
    private void configuration(Tournament tournament, int overs) {
        MatchConfiguration value = new MatchConfiguration(); value.setTournament(tournament); value.setMatchFormat("T20");
        value.setOversPerInnings(overs); value.setMaxBowlerOvers(4); value.setMatchDurationMinutes(180);
        configurations.save(value);
    }
    private void setOvers(int overs) {
        MatchConfiguration config = configurations.findByTournament_TournamentId(cup.getTournamentId()).orElseThrow();
        config.setOversPerInnings(overs);
        configurations.save(config);
    }
    private void schedule(Fixture fixture, String versionName, String stadiumName, LocalDateTime start) {
        ScheduleVersion version = new ScheduleVersion(); version.setTournament(fixture.getTournament());
        version.setVersionName(versionName); version.setCreatedAt(LocalDateTime.now().plusNanos(versions.count()));
        version.setMatchCount(1); version = versions.save(version);
        Stadium stadium = new Stadium(); stadium.setTournament(fixture.getTournament()); stadium.setName(stadiumName);
        stadium = stadiums.save(stadium);
        Match match = new Match(); match.setFixture(fixture); match.setScheduleVersion(version); match.setStadium(stadium);
        match.setStartTime(start); match.setEndTime(start.plusHours(3)); match.setMatchStatus("SCHEDULED");
        matches.save(match);
    }
    private String resultPath(Fixture fixture) { return base + "/matches/" + fixture.getFixtureId() + "/result"; }
    private static String result(String type, int firstScore, int firstWickets, String firstOvers,
            int secondScore, int secondWickets, String secondOvers) {
        return """
            {"resultType":"%s","team1Score":%d,"team1Wickets":%d,"team1Overs":"%s",
             "team2Score":%d,"team2Wickets":%d,"team2Overs":"%s","remarks":"isolated test"}
            """.formatted(type, firstScore, firstWickets, firstOvers, secondScore, secondWickets, secondOvers);
    }
}
