package com.example.backend.e3.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.backend.e2.controller.ApiExceptionHandler;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e3.service.TournamentManagementService;

class TournamentManagementControllerTest {

    private static final String TOURNAMENTS = "/api/tournaments";
    private static final String TOURNAMENT = TOURNAMENTS + "/10";

    private final TournamentRepository tournaments = mock(TournamentRepository.class);
    private final TeamRepository teams = mock(TeamRepository.class);
    private final StadiumRepository stadiums = mock(StadiumRepository.class);
    private final OfficialRepository officials = mock(OfficialRepository.class);
    private final Tournament tournament = new Tournament();
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        tournament.setTournamentId(10L);
        tournament.setName("CricCraft Cup");
        when(tournaments.findById(10L)).thenReturn(Optional.of(tournament));
        when(tournaments.existsById(10L)).thenReturn(true);
        mvc = MockMvcBuilders.standaloneSetup(new TournamentManagementController(
                new TournamentManagementService(tournaments, teams, stadiums, officials)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();
    }

    @Test
    void createsListsGetsAndUpdatesTournaments() throws Exception {
        when(tournaments.save(any(Tournament.class))).thenAnswer(invocation -> {
            Tournament created = invocation.getArgument(0);
            created.setTournamentId(11L);
            return created;
        });
        when(tournaments.findAll(Sort.by("tournamentId"))).thenReturn(List.of(tournament));

        mvc.perform(post(TOURNAMENTS).contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"  Winter Cup  ","startDate":"2026-12-01","endDate":"2026-12-02"}
                """))
            .andExpect(status().isCreated()).andExpect(header().string("Location", TOURNAMENTS + "/11"))
            .andExpect(jsonPath("$.name").value("Winter Cup"))
            .andExpect(jsonPath("$.startDate").value("2026-12-01"))
            .andExpect(jsonPath("$.status").value("UPCOMING"));
        mvc.perform(get(TOURNAMENTS)).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].tournamentId").value(10));
        mvc.perform(get(TOURNAMENT)).andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("CricCraft Cup"));
        mvc.perform(put(TOURNAMENT).contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Renamed Cup","hostInstitution":"KLE","status":"upcoming"}
                    """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tournamentId").value(10))
            .andExpect(jsonPath("$.hostInstitution").value("KLE"));
        assertEquals("Renamed Cup", tournament.getName());
    }

    @Test
    void createsListsAndUpdatesTeams() throws Exception {
        Team team = new Team();
        team.setTeamId(20L);
        team.setTournament(tournament);
        team.setTeamName("Falcons");
        when(teams.save(any(Team.class))).thenAnswer(invocation -> {
            Team created = invocation.getArgument(0);
            created.setTeamId(21L);
            return created;
        });
        when(teams.findAllByTournament_TournamentId(10L)).thenReturn(List.of(team));
        when(teams.findByTournament_TournamentIdAndTeamId(10L, 20L)).thenReturn(Optional.of(team));

        mvc.perform(post(TOURNAMENT + "/teams").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"teamName":"Owls","squadSize":15}
                    """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.teamId").value(21))
            .andExpect(jsonPath("$.tournamentId").value(10))
            .andExpect(jsonPath("$.squadSize").value(15)).andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get(TOURNAMENT + "/teams")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].teamName").value("Falcons"));
        mvc.perform(put(TOURNAMENT + "/teams/20").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"teamName":"Falcons XI","captain":"Anu"}
                    """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.captain").value("Anu"));
        assertEquals("Falcons XI", team.getTeamName());
        assertEquals(tournament, team.getTournament());
    }

    @Test
    void createsListsAndUpdatesStadiums() throws Exception {
        Stadium stadium = new Stadium();
        stadium.setStadiumId(30L);
        stadium.setTournament(tournament);
        stadium.setName("Oval");
        when(stadiums.save(any(Stadium.class))).thenAnswer(invocation -> {
            Stadium created = invocation.getArgument(0);
            created.setStadiumId(31L);
            return created;
        });
        when(stadiums.findAllByTournament_TournamentId(10L)).thenReturn(List.of(stadium));
        when(stadiums.findByTournament_TournamentIdAndStadiumId(10L, 30L)).thenReturn(Optional.of(stadium));

        mvc.perform(post(TOURNAMENT + "/stadiums").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"University Ground","numberOfPitches":2,"floodlights":true}
                    """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.stadiumId").value(31))
            .andExpect(jsonPath("$.tournamentId").value(10))
            .andExpect(jsonPath("$.numberOfPitches").value(2))
            .andExpect(jsonPath("$.floodlights").value(true))
            .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"));
        mvc.perform(get(TOURNAMENT + "/stadiums")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Oval"));
        mvc.perform(put(TOURNAMENT + "/stadiums/30").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Main Oval","capacity":8000,"availabilityStatus":"maintenance"}
                    """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.capacity").value(8000))
            .andExpect(jsonPath("$.availabilityStatus").value("MAINTENANCE"));
        assertEquals("Main Oval", stadium.getName());
        assertEquals(tournament, stadium.getTournament());
    }

    @Test
    void createsListsAndUpdatesOfficials() throws Exception {
        Official official = new Official();
        official.setOfficialId(40L);
        official.setTournament(tournament);
        official.setName("Priya");
        official.setRole("UMPIRE");
        when(officials.save(any(Official.class))).thenAnswer(invocation -> {
            Official created = invocation.getArgument(0);
            created.setOfficialId(41L);
            return created;
        });
        when(officials.findAllByTournament_TournamentId(10L)).thenReturn(List.of(official));
        when(officials.findByTournament_TournamentIdAndOfficialId(10L, 40L)).thenReturn(Optional.of(official));

        mvc.perform(post(TOURNAMENT + "/officials").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Ravi","role":"scorer"}
                    """))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.officialId").value(41))
            .andExpect(jsonPath("$.tournamentId").value(10))
            .andExpect(jsonPath("$.role").value("SCORER")).andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(get(TOURNAMENT + "/officials")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Priya"));
        mvc.perform(put(TOURNAMENT + "/officials/40").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Priya Rao","role":"umpire","qualification":"Level 2"}
                    """))
            .andExpect(status().isOk()).andExpect(jsonPath("$.qualification").value("Level 2"));
        assertEquals("Priya Rao", official.getName());
        assertEquals(tournament, official.getTournament());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
        /api/tournaments | {"name":" "}
        /api/tournaments | {"name":"Cup","startDate":"2026-12-02","endDate":"2026-12-01"}
        /api/tournaments/10/teams | {"teamName":"Falcons","squadSize":0}
        /api/tournaments/10/stadiums | {"name":"Oval","capacity":-1}
        /api/tournaments/10/officials | {"name":"Priya"}
        """)
    void rejectsInvalidCreateRequests(String path, String body) throws Exception {
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(tournaments, teams, stadiums, officials);
    }

    @Test
    void rejectsInvalidIdsAndUpdates() throws Exception {
        mvc.perform(get(TOURNAMENTS + "/abc")).andExpect(status().isBadRequest());
        mvc.perform(get(TOURNAMENTS + "/0/teams")).andExpect(status().isBadRequest());
        mvc.perform(put(TOURNAMENT + "/teams/20").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(tournaments, teams, stadiums, officials);
    }

    @Test
    void distinguishesMissingTournamentFromEmptyCollection() throws Exception {
        mvc.perform(get(TOURNAMENT + "/teams")).andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
        mvc.perform(get(TOURNAMENTS + "/99")).andExpect(status().isNotFound());
        mvc.perform(get(TOURNAMENTS + "/99/teams")).andExpect(status().isNotFound());
        mvc.perform(post(TOURNAMENTS + "/99/teams").contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"teamName":"Falcons"}
                    """))
            .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
        teams | {"teamName":"Falcons"}
        stadiums | {"name":"Oval"}
        officials | {"name":"Priya","role":"UMPIRE"}
        """)
    void cannotUpdateResourcesThroughAnotherTournament(String collection, String body) throws Exception {
        Team team = new Team();
        team.setTeamId(99L);
        team.setTournament(tournament);
        Stadium stadium = new Stadium();
        stadium.setStadiumId(99L);
        stadium.setTournament(tournament);
        Official official = new Official();
        official.setOfficialId(99L);
        official.setTournament(tournament);
        when(teams.findByTournament_TournamentIdAndTeamId(10L, 99L)).thenReturn(Optional.of(team));
        when(stadiums.findByTournament_TournamentIdAndStadiumId(10L, 99L)).thenReturn(Optional.of(stadium));
        when(officials.findByTournament_TournamentIdAndOfficialId(10L, 99L)).thenReturn(Optional.of(official));

        mvc.perform(put(TOURNAMENTS + "/11/" + collection + "/99").contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isNotFound());
        mvc.perform(put(TOURNAMENT + "/" + collection + "/99").contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tournamentId").value(10));
    }

    @Test
    void mapsDatabaseConflictsToManagementError() throws Exception {
        when(tournaments.save(any(Tournament.class))).thenThrow(new DataIntegrityViolationException("constraint"));
        mvc.perform(post(TOURNAMENTS).contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"CricCraft Cup"}
                """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.detail").value("The resource conflicts with a database constraint"));
    }
}
