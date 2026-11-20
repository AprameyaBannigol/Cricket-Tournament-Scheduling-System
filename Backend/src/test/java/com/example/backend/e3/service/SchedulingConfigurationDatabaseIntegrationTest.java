package com.example.backend.e3.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import com.example.backend.dto.AvailabilityDTO;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e2.service.TournamentSchedulingDataLoader;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:batch3;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
class SchedulingConfigurationDatabaseIntegrationTest {

    private static final LocalDate DATE = LocalDate.of(2026, 12, 1);
    private static final String MATCH = """
        {"matchFormat":"T20","oversPerInnings":20,"maxBowlerOvers":4,"powerplayOvers":6,
         "inningsBreakMinutes":15,"matchDurationMinutes":180,"minOversForDls":5,
         "pointsForWin":2.5,"pointsForTie":1,"pointsForLoss":0,"superOverEnabled":false}
        """;
    private static final String CONSTRAINTS = """
        {"minimumRecoveryMinutes":90,"maxMatchesPerTeamPerDay":2,"maxMatchesPerStadiumPerDay":3,
         "travelConstraintEnabled":true,"minimumTravelMinutes":35,"avoidGroundBlackouts":true,
         "avoidOfficialBlackouts":true,"nightToMorningRestriction":false,"reserveDayEnforced":false}
        """;
    private static final String AVAILABLE = """
        {"date":"2026-12-01","startTime":"08:00","endTime":"20:00","status":"AVAILABLE"}
        """;
    private static final String BLACKOUT = """
        {"date":"2026-12-01","startTime":"11:00","endTime":"12:00","status":"UNAVAILABLE"}
        """;

    @Autowired private MockMvc mvc;
    @Autowired private TournamentRepository tournaments;
    @Autowired private StadiumRepository stadiums;
    @Autowired private OfficialRepository officials;
    @Autowired private TeamRepository teams;
    @Autowired private TournamentSchedulingDataLoader loader;

    @Test
    void createsReadsAndUpdatesConfigurationInThePersistedLoader() throws Exception {
        Tournament cup = tournament("First cup");
        Tournament other = tournament("Other cup");
        String base = "/api/tournaments/" + cup.getTournamentId();
        String otherBase = "/api/tournaments/" + other.getTournamentId();
        String match = base + "/match-configuration";
        String constraints = base + "/scheduling-constraints";

        mvc.perform(get(match)).andExpect(status().isNoContent());
        mvc.perform(get(constraints)).andExpect(status().isNoContent());
        mvc.perform(get("/api/tournaments/99999/match-configuration")).andExpect(status().isNotFound());
        mvc.perform(put(match).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
        mvc.perform(put(match).contentType(MediaType.APPLICATION_JSON).content(MATCH)).andExpect(status().isOk());
        mvc.perform(get(match)).andExpect(status().isOk()).andExpect(jsonPath("$.pointsForWin").value(2.5));
        mvc.perform(put(match).contentType(MediaType.APPLICATION_JSON).content(MATCH.replace("180", "150")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.matchDurationMinutes").value(150));
        mvc.perform(get(otherBase + "/match-configuration")).andExpect(status().isNoContent());

        mvc.perform(put(constraints).contentType(MediaType.APPLICATION_JSON).content(CONSTRAINTS)).andExpect(status().isOk());
        mvc.perform(put(constraints).contentType(MediaType.APPLICATION_JSON)
            .content(CONSTRAINTS.replace("90", "120").replace("35", "45")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.minimumRecoveryMinutes").value(120));
        mvc.perform(get(constraints)).andExpect(status().isOk()).andExpect(jsonPath("$.maxMatchesPerStadiumPerDay").value(3));
        mvc.perform(get(otherBase + "/scheduling-constraints")).andExpect(status().isNoContent());

        String stadiumWindows = base + "/availability/stadiums/" + stadium(cup);
        String officialWindows = base + "/availability/officials/" + official(cup);
        String teamWindows = base + "/availability/teams/" + team(cup);
        mvc.perform(get(stadiumWindows)).andExpect(status().isOk()).andExpect(jsonPath("$.windows").isEmpty());
        mvc.perform(get(stadiumWindows.replace(base, otherBase))).andExpect(status().isNotFound());
        mvc.perform(put(officialWindows.replace(base, otherBase)).contentType(MediaType.APPLICATION_JSON)
            .content(windows(AVAILABLE))).andExpect(status().isNotFound());
        mvc.perform(put(stadiumWindows).contentType(MediaType.APPLICATION_JSON).content(windows(AVAILABLE)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.windows.length()").value(1));
        mvc.perform(put(stadiumWindows).contentType(MediaType.APPLICATION_JSON).content(windows(AVAILABLE, BLACKOUT)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.windows.length()").value(2));
        mvc.perform(put(stadiumWindows).contentType(MediaType.APPLICATION_JSON)
            .content(windows(AVAILABLE.replace("2026-12-01", "2026-12-03")))).andExpect(status().isBadRequest());
        mvc.perform(put(stadiumWindows).contentType(MediaType.APPLICATION_JSON)
            .content(windows(AVAILABLE.replace("20:00", "07:00")))).andExpect(status().isBadRequest());
        mvc.perform(get(stadiumWindows)).andExpect(status().isOk())
            .andExpect(jsonPath("$.windows[1].status").value("UNAVAILABLE"));

        String fullDay = BLACKOUT.replace("11:00", "00:00").replace("12:00", "23:59:59");
        mvc.perform(put(officialWindows).contentType(MediaType.APPLICATION_JSON).content(windows(AVAILABLE, fullDay)))
            .andExpect(status().isOk());
        mvc.perform(put(teamWindows).contentType(MediaType.APPLICATION_JSON).content(windows(AVAILABLE)))
            .andExpect(status().isOk());

        var input = loader.loadForTournament(cup.getTournamentId());
        assertEquals(150, input.matchDurationMinutes());
        assertEquals(120, input.constraints().minimumRecoveryMinutes());
        assertEquals(45, input.constraints().minimumTravelMinutes());
        assertTrue(input.constraints().travelConstraintEnabled());
        assertEquals(List.of(slot("08:00", "11:00"), slot("12:00", "20:00")), input.stadiums().getFirst().availability());
        assertEquals(List.of(slot("08:00", "20:00")), input.teams().getFirst().availability());
        assertTrue(input.officials().getFirst().availability().isEmpty());
        assertEquals(List.of(LocalTime.of(8, 0), LocalTime.of(12, 0)), input.availableTimeSlots());

        mvc.perform(put(officialWindows).contentType(MediaType.APPLICATION_JSON).content(windows(AVAILABLE)))
            .andExpect(status().isOk());
        assertFalse(loader.loadForTournament(cup.getTournamentId()).officials().getFirst().availability().isEmpty());
        mvc.perform(put(officialWindows).contentType(MediaType.APPLICATION_JSON).content(windows()))
            .andExpect(status().isOk());
        mvc.perform(get(officialWindows)).andExpect(status().isOk()).andExpect(jsonPath("$.windows").isEmpty());
    }

    private Tournament tournament(String name) {
        Tournament tournament = new Tournament();
        tournament.setName(name);
        tournament.setStartDate(DATE);
        tournament.setEndDate(DATE);
        return tournaments.save(tournament);
    }

    private Long stadium(Tournament cup) {
        Stadium stadium = new Stadium();
        stadium.setTournament(cup);
        stadium.setName("Ground");
        stadium.setAvailabilityStatus("AVAILABLE");
        return stadiums.save(stadium).getStadiumId();
    }

    private Long official(Tournament cup) {
        Official official = new Official();
        official.setTournament(cup);
        official.setName("Umpire");
        official.setStatus("ACTIVE");
        return officials.save(official).getOfficialId();
    }

    private Long team(Tournament cup) {
        Team team = new Team();
        team.setTournament(cup);
        team.setTeamName("Team");
        team.setStatus("ACTIVE");
        return teams.save(team).getTeamId();
    }

    private static String windows(String... entries) {
        return "{\"windows\":[" + String.join(",", entries) + "]}";
    }

    private static AvailabilityDTO slot(String start, String end) {
        return new AvailabilityDTO(DATE, LocalTime.parse(start), LocalTime.parse(end));
    }
}
