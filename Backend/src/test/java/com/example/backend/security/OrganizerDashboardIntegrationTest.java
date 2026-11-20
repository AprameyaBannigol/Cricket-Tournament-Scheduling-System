package com.example.backend.security;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Set;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;

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
    "spring.datasource.url=jdbc:h2:mem:batch6organizer;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class OrganizerDashboardIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired AppUserRepository users;
    @Autowired PasswordEncoder encoder;
    private final Map<Long, String> passwords = new HashMap<>();

    @BeforeEach
    void clearIsolatedDatabase() {
        passwords.clear();
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
    }

    @Test
    void organizerSeesOnlyAssignedTournamentAndItsDashboardData() throws Exception {
        tournament(701, "Assigned Cup");
        tournament(702, "Other Organizer Cup");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (711,701,'North XI','ACTIVE')");
        jdbc.update("insert into team(team_id,tournament_id,team_name,status) values (712,701,'South XI','ACTIVE')");
        jdbc.update("insert into stadium(stadium_id,tournament_id,name) values (721,701,'Central Ground')");
        jdbc.update("insert into official(official_id,tournament_id,name,role,status) values (731,701,'Official One','UMPIRE','ACTIVE')");
        jdbc.update("insert into fixture(fixture_id,tournament_id,round_number,match_number,team1_id,team2_id,status) values (741,701,1,1,711,712,'PENDING')");
        jdbc.update("insert into schedule_version(version_id,tournament_id,version_name,created_at,match_count) values (751,701,'First Draft',CURRENT_TIMESTAMP,1)");
        jdbc.update("insert into \"match\"(match_id,fixture_id,version_id,stadium_id,start_time,end_time,match_status) values (761,741,751,721,DATEADD('DAY',1,CURRENT_TIMESTAMP),DATEADD('HOUR',3,DATEADD('DAY',1,CURRENT_TIMESTAMP)),'SCHEDULED')");

        AppUser organizer = user(AppRole.ORGANIZER);
        AppUser otherOrganizer = user(AppRole.ORGANIZER);
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,701)", organizer.getId());
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,702)", otherOrganizer.getId());
        MockHttpSession session = login(organizer);

        mvc.perform(get("/api/organizer/dashboard").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tournaments.length()").value(1))
            .andExpect(jsonPath("$.tournaments[0].tournamentId").value(701))
            .andExpect(jsonPath("$.tournaments[0].teams.length()").value(2))
            .andExpect(jsonPath("$.tournaments[0].stadiums[0].name").value("Central Ground"))
            .andExpect(jsonPath("$.tournaments[0].officials[0].name").value("Official One"))
            .andExpect(jsonPath("$.tournaments[0].totalScheduledFixtures").value(1))
            .andExpect(jsonPath("$.tournaments[0].upcomingMatches").value(1))
            .andExpect(jsonPath("$.tournaments[0].schedulingReady").value(false))
            .andExpect(jsonPath("$.tournaments[0].latestScheduleVersion.versionName").value("First Draft"))
            .andExpect(jsonPath("$.tournaments[0].completionPercentage").value(0));
        mvc.perform(get("/api/tournaments").session(session))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].tournamentId").value(701))
            .andExpect(jsonPath("$[1]").doesNotExist());
        mvc.perform(get("/api/tournaments/702/teams").session(session)).andExpect(status().isForbidden());
        mvc.perform(put("/api/tournaments/702").session(session).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Unauthorized rename\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void unassignedOrganizerGetsEmptyDashboardAndCannotReadAnotherOrganizersResources() throws Exception {
        tournament(703, "Assigned Elsewhere");
        AppUser owner = user(AppRole.ORGANIZER);
        AppUser unassigned = user(AppRole.ORGANIZER);
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,703)", owner.getId());
        MockHttpSession session = login(unassigned);

        mvc.perform(get("/api/organizer/dashboard").session(session))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tournaments.length()").value(0));
        mvc.perform(get("/api/tournaments").session(session))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/tournaments/703").session(session)).andExpect(status().isForbidden());
    }

    @Test
    void adminCanUseOrganizerDashboardAndViewerOrTeamManagerCannot() throws Exception {
        tournament(704, "Admin Cup");
        AppUser admin = user(AppRole.ADMIN);
        AppUser viewer = user(AppRole.VIEWER);
        AppUser manager = user(AppRole.TEAM_MANAGER);

        mvc.perform(get("/api/organizer/dashboard")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/organizer/dashboard").session(login(viewer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/organizer/dashboard").session(login(manager))).andExpect(status().isForbidden());
        mvc.perform(get("/api/organizer/dashboard").session(login(admin)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.tournaments.length()").value(1))
            .andExpect(jsonPath("$.tournaments[0].tournamentId").value(704));
    }

    private void tournament(long id, String name) {
        jdbc.update("insert into tournament(tournament_id,name,status,start_date,end_date) values (?,?,'UPCOMING',DATE '2026-12-01',DATE '2026-12-10')", id, name);
    }

    private AppUser user(AppRole role) {
        String email = role.name().toLowerCase() + "-" + UUID.randomUUID() + "@example.org";
        String password = UUID.randomUUID().toString() + UUID.randomUUID();
        AppUser saved = users.saveAndFlush(new AppUser(email, encoder.encode(password), Set.of(role)));
        passwords.put(saved.getId(), password);
        return saved;
    }

    private MockHttpSession login(AppUser user) throws Exception {
        String password = passwords.get(user.getId());
        MvcResult result = mvc.perform(post("/api/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + user.getEmail() + "\",\"password\":\"" + password
                        + "\",\"selectedRole\":\"" + user.getRoles().iterator().next().name() + "\"}"))
            .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
}
