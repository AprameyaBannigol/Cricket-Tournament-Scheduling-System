package com.example.backend.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:batch6teammanager;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class TeamManagerDashboardIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired AppUserRepository users;
    @Autowired PasswordEncoder encoder;
    private String managerPassword;
    private String otherManagerPassword;
    private String viewerPassword;

    @BeforeEach
    void clearIsolatedDatabase() {
        jdbc.update("delete from organizer_tournament_assignment");
        jdbc.update("delete from team_manager_assignment");
        jdbc.update("delete from match_result");
        jdbc.update("delete from match_official");
        jdbc.update("delete from scheduling_conflict");
        jdbc.update("delete from \"match\"");
        jdbc.update("delete from schedule_version");
        jdbc.update("delete from fixture");
        jdbc.update("delete from availability");
        jdbc.update("delete from venue_travel_time");
        jdbc.update("delete from official");
        jdbc.update("delete from stadium");
        jdbc.update("delete from team");
        jdbc.update("delete from match_configuration");
        jdbc.update("delete from scheduling_constraints");
        jdbc.update("delete from tournament");
        users.deleteAll();
        managerPassword = otherManagerPassword = viewerPassword = null;
    }

    @Test
    void managerSeesOnlyAssignedTeamsAndTheirFixturesAndCannotReadOrEditOtherTeam() throws Exception {
        seedTournament();
        AppUser manager = user(AppRole.TEAM_MANAGER, "manager");
        AppUser anotherManager = user(AppRole.TEAM_MANAGER, "other");
        jdbc.update("insert into team_manager_assignment(user_id,team_id) values (?,811)", manager.getId());
        jdbc.update("insert into team_manager_assignment(user_id,team_id) values (?,812)", anotherManager.getId());
        MockHttpSession session = login(manager, managerPassword);

        mvc.perform(get("/api/team-manager/dashboard").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.teams.length()").value(1))
            .andExpect(jsonPath("$.teams[0].teamId").value(811))
            .andExpect(jsonPath("$.teams[0].tournamentName").value("Manager Cup"))
            .andExpect(jsonPath("$.teams[0].matches.length()").value(1))
            .andExpect(jsonPath("$.teams[0].matches[0].fixtureId").value(841));
        mvc.perform(get("/api/tournaments/801/teams").session(session))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].teamId").value(811));
        mvc.perform(get("/api/tournaments/801/matches").session(session))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].fixtureId").value(841));
        mvc.perform(get("/api/tournaments/801/matches/842/result").session(session)).andExpect(status().isForbidden());
        mvc.perform(put("/api/tournaments/801/teams/812").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"teamName\":\"Changed\",\"status\":\"ACTIVE\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(put("/api/tournaments/801/teams/811").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"teamName\":\"North XI Updated\",\"status\":\"ACTIVE\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.teamName").value("North XI Updated"));
        mvc.perform(get("/api/tournaments/802/teams").session(session))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void unassignedManagerGetsAnEmptyDashboardAndViewerCannotWrite() throws Exception {
        seedTournament();
        AppUser unassigned = user(AppRole.TEAM_MANAGER, "unassigned");
        AppUser viewer = user(AppRole.VIEWER, "viewer");
        MockHttpSession managerSession = login(unassigned, managerPassword);
        MockHttpSession viewerSession = login(viewer, viewerPassword);

        mvc.perform(get("/api/team-manager/dashboard").session(managerSession))
            .andExpect(status().isOk()).andExpect(jsonPath("$.teams.length()").value(0));
        mvc.perform(get("/api/team-manager/dashboard").session(viewerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/tournaments").session(viewerSession)).andExpect(status().isOk());
        mvc.perform(get("/api/tournaments/801/teams").session(viewerSession))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
        mvc.perform(get("/api/tournaments/801/matches").session(viewerSession))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));
        mvc.perform(post("/api/tournaments").session(viewerSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Forbidden Cup\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(put("/api/tournaments/801/teams/811").session(viewerSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"teamName\":\"Changed\",\"status\":\"ACTIVE\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(put("/api/tournaments/801/matches/841/result").session(viewerSession).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"resultType\":\"NO_RESULT\",\"team1Score\":0,\"team1Wickets\":0,\"team1Overs\":\"0\",\"team2Score\":0,\"team2Wickets\":0,\"team2Overs\":\"0\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void otherRolesCannotAccessTeamManagerDashboardAndAdminOrganizerRoutesRemainAvailable() throws Exception {
        AppUser viewer = user(AppRole.VIEWER, "route-viewer");
        AppUser organizer = user(AppRole.ORGANIZER, "route-organizer");
        AppUser admin = user(AppRole.ADMIN, "route-admin");
        mvc.perform(get("/api/team-manager/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/team-manager/dashboard").session(login(viewer, viewerPassword)))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/organizer/dashboard").session(login(organizer, passwordFor(AppRole.ORGANIZER))))
            .andExpect(status().isOk());
        mvc.perform(get("/api/organizer/dashboard").session(login(admin, passwordFor(AppRole.ADMIN))))
            .andExpect(status().isOk());
    }

    private void seedTournament() {
        jdbc.update("insert into tournament(tournament_id,name,status,start_date,end_date) values (801,'Manager Cup','UPCOMING',DATE '2026-12-01',DATE '2026-12-10')");
        jdbc.update("insert into tournament(tournament_id,name,status,start_date,end_date) values (802,'Other Cup','UPCOMING',DATE '2026-12-01',DATE '2026-12-10')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (811,801,'North XI','ACTIVE')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (812,801,'South XI','ACTIVE')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (813,801,'East XI','ACTIVE')");
        jdbc.update("insert into fixture(fixture_id,tournament_id,round_number,match_number,team1_id,team2_id,status) values (841,801,1,1,811,812,'PENDING')");
        jdbc.update("insert into fixture(fixture_id,tournament_id,round_number,match_number,team1_id,team2_id,status) values (842,801,1,2,812,813,'PENDING')");
        jdbc.update("insert into stadium(stadium_id,tournament_id,name) values (821,801,'Ground One')");
        jdbc.update("insert into schedule_version(version_id,tournament_id,version_name,created_at,match_count) values (831,801,'Saved',CURRENT_TIMESTAMP,2)");
        jdbc.update("insert into \"match\"(match_id,fixture_id,version_id,stadium_id,start_time,end_time,match_status) values (851,841,831,821,DATEADD('DAY',1,CURRENT_TIMESTAMP),DATEADD('HOUR',3,DATEADD('DAY',1,CURRENT_TIMESTAMP)),'SCHEDULED')");
        jdbc.update("insert into \"match\"(match_id,fixture_id,version_id,stadium_id,start_time,end_time,match_status) values (852,842,831,821,DATEADD('DAY',2,CURRENT_TIMESTAMP),DATEADD('HOUR',3,DATEADD('DAY',2,CURRENT_TIMESTAMP)),'SCHEDULED')");
    }

    private AppUser user(AppRole role, String key) {
        String email = key + "-" + UUID.randomUUID() + "@example.org";
        String password = UUID.randomUUID().toString() + UUID.randomUUID();
        AppUser saved = users.saveAndFlush(new AppUser(email, encoder.encode(password), Set.of(role)));
        switch (role) {
            case TEAM_MANAGER -> { if (managerPassword == null) managerPassword = password; else if (otherManagerPassword == null) otherManagerPassword = password; }
            case VIEWER -> viewerPassword = password;
            case ORGANIZER -> organizerPassword = password;
            case ADMIN -> adminPassword = password;
        }
        return saved;
    }

    private String organizerPassword;
    private String adminPassword;
    private String passwordFor(AppRole role) { return role == AppRole.ORGANIZER ? organizerPassword : adminPassword; }

    private MockHttpSession login(AppUser user, String password) throws Exception {
        MvcResult result = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"" + password
                        + "\",\"selectedRole\":\"" + user.getRoles().iterator().next().name() + "\"}"))
            .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
}
