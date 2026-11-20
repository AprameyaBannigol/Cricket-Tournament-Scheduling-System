package com.example.backend.e2.service;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.example.backend.e2.entity.Fixture;
import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.FixtureRepository;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:batch4;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false",
    "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc(addFilters = false)
@WithMockUser(roles = "ADMIN")
class LiveScheduleIntegrationTest {

    private static final LocalDate DATE = LocalDate.of(2026, 12, 1);
    private static final String MATCH = """
        {"matchFormat":"T20","oversPerInnings":20,"maxBowlerOvers":4,"inningsBreakMinutes":15,
         "matchDurationMinutes":120,"pointsForWin":2,"pointsForTie":1,"pointsForLoss":0,"superOverEnabled":true}
        """;
    private static final String CONSTRAINTS = """
        {"minimumRecoveryMinutes":90,"maxMatchesPerTeamPerDay":1,"maxMatchesPerStadiumPerDay":2,
         "travelConstraintEnabled":true,"minimumTravelMinutes":30,"avoidGroundBlackouts":true,
         "avoidOfficialBlackouts":true,"nightToMorningRestriction":false,"reserveDayEnforced":false}
        """;

    @Autowired private MockMvc mvc;
    @Autowired private TournamentRepository tournaments;
    @Autowired private TeamRepository teams;
    @Autowired private StadiumRepository stadiums;
    @Autowired private OfficialRepository officials;
    @Autowired private FixtureRepository fixtures;

    @Test
    void validatesReadinessAndPersistsOnlyCompleteTournamentScopedVersions() throws Exception {
        Tournament cup = tournament("Batch 4 Cup");
        Tournament other = tournament("Other Cup");
        String base = path(cup);
        String otherBase = path(other);
        String schedules = base + "/schedules";
        String readiness = schedules + "/readiness";
        String generate = schedules + "/generate";

        mvc.perform(get("/api/tournaments/999999/schedules/readiness")).andExpect(status().isNotFound());
        mvc.perform(get(readiness)).andExpect(status().isOk()).andExpect(jsonPath("$.ready").value(false))
            .andExpect(jsonPath("$.issues[0].code").value("MISSING_SETUP"));
        mvc.perform(post(generate).contentType(MediaType.APPLICATION_JSON).content(version("Incomplete")))
            .andExpect(status().isUnprocessableContent()).andExpect(jsonPath("$.issues[0].code").value("MISSING_SETUP"));
        save(base + "/match-configuration", MATCH);
        save(base + "/scheduling-constraints", CONSTRAINTS);

        mvc.perform(get(readiness)).andExpect(status().isOk()).andExpect(jsonPath("$.issues[*].message",
            org.hamcrest.Matchers.hasItem("At least two teams are required")));

        Team first = team(cup, "Falcons");
        Team second = team(cup, "Owls");
        Stadium from = stadium(cup, "Main Ground");
        Stadium to = stadium(cup, "Second Ground");
        Stadium foreign = stadium(other, "Other Ground");
        String travel = base + "/venue-travel-times";
        String outbound = travel + "/" + from.getStadiumId() + "/" + to.getStadiumId();
        String inbound = travel + "/" + to.getStadiumId() + "/" + from.getStadiumId();

        mvc.perform(put(travel + "/" + from.getStadiumId() + "/" + foreign.getStadiumId())
            .contentType(MediaType.APPLICATION_JSON).content("{\"travelMinutes\":30}"))
            .andExpect(status().isNotFound());
        mvc.perform(put(outbound).contentType(MediaType.APPLICATION_JSON).content("{\"travelMinutes\":-1}"))
            .andExpect(status().isBadRequest());
        save(outbound, "{\"travelMinutes\":35}");
        save(outbound, "{\"travelMinutes\":40}");
        mvc.perform(get(otherBase + "/venue-travel-times")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());

        availability(base, "teams", first.getTeamId(), "08:00", "12:00");
        availability(base, "teams", second.getTeamId(), "08:00", "12:00");
        availability(base, "stadiums", from.getStadiumId(), "08:00", "12:00");
        availability(base, "stadiums", to.getStadiumId(), "08:00", "12:00");
        availability(base, "officials", official(cup, "Asha"), "08:00", "12:00");
        availability(base, "officials", official(cup, "Dev"), "08:00", "12:00");

        mvc.perform(get(readiness)).andExpect(status().isOk())
            .andExpect(jsonPath("$.issues[*].message", org.hamcrest.Matchers.hasItems(
                "At least 3 eligible officials are required per match",
                "Travel constraints require travel times for every directed stadium pair")));
        save(inbound, "{\"travelMinutes\":55}");
        mvc.perform(get(travel)).andExpect(status().isOk()).andExpect(jsonPath("$[0].travelMinutes").value(40))
            .andExpect(jsonPath("$[1].travelMinutes").value(55));

        Long third = official(cup, "Isha");
        availability(base, "officials", third, "11:00", "13:00");
        mvc.perform(get(readiness)).andExpect(status().isOk()).andExpect(jsonPath("$.ready").value(false))
            .andExpect(jsonPath("$.issues[0].code").value("NO_CANDIDATES"));
        mvc.perform(post(generate).contentType(MediaType.APPLICATION_JSON).content(version("No overlap")))
            .andExpect(status().isUnprocessableContent()).andExpect(jsonPath("$.issues[0].matchNumber").value(1));
        mvc.perform(get(schedules)).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());

        availability(base, "officials", third, "08:00", "12:00");
        mvc.perform(get(readiness)).andExpect(status().isOk()).andExpect(jsonPath("$.ready").value(true))
            .andExpect(jsonPath("$.issues").isEmpty());

        // H2 cannot run the PostgreSQL expression-index upsert. Seed the shared fixture only.
        Fixture fixture = new Fixture();
        fixture.setTournament(cup);
        fixture.setTeam1(first);
        fixture.setTeam2(second);
        fixture.setMatchNumber(1);
        fixture.setRoundNumber(1);
        fixture.setStatus("PENDING");
        fixtures.save(fixture);

        CountDownLatch start = new CountDownLatch(1);
        Callable<Integer> duplicateRequest = () -> {
            SecurityContext workerContext = adminSecurityContext();
            SecurityContextHolder.setContext(workerContext);
            start.await();
            try {
                return mvc.perform(post(generate).contentType(MediaType.APPLICATION_JSON).content(version("Opening")))
                    .andReturn().getResponse().getStatus();
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var firstRequest = executor.submit(duplicateRequest);
            var secondRequest = executor.submit(duplicateRequest);
            start.countDown();
            assertEquals(List.of(201, 409), List.of(firstRequest.get(10, TimeUnit.SECONDS),
                secondRequest.get(10, TimeUnit.SECONDS)).stream().sorted().toList());
        }

        String listed = mvc.perform(get(schedules)).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].versionName").value("Opening"))
            .andReturn().getResponse().getContentAsString();
        Number versionId = JsonPath.read(listed, "$[0].versionId");
        String detail = schedules + "/" + versionId;
        mvc.perform(get(detail)).andExpect(status().isOk())
            .andExpect(jsonPath("$.tournamentId").value(cup.getTournamentId().intValue()))
            .andExpect(jsonPath("$.matchCount").value(1))
            .andExpect(jsonPath("$.matches[0].fixture.team1").value("Falcons"))
            .andExpect(jsonPath("$.matches[0].startTime").value(containsString("T08:00")))
            .andExpect(jsonPath("$.matches[0].endTime").value(containsString("T10:00")))
            .andExpect(jsonPath("$.matches[0].officials.length()").value(3));
        mvc.perform(get(otherBase + "/schedules")).andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
        mvc.perform(get(otherBase + "/schedules/" + versionId)).andExpect(status().isNotFound());
    }

    private void save(String url, String body) throws Exception {
        mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
    }

    private void availability(String base, String kind, Long id, String start, String end) throws Exception {
        save(base + "/availability/" + kind + "/" + id, """
            {"windows":[{"date":"%s","startTime":"%s","endTime":"%s","status":"AVAILABLE"}]}
            """.formatted(DATE, start, end));
    }

    private Tournament tournament(String name) {
        Tournament cup = new Tournament();
        cup.setName(name);
        cup.setStartDate(DATE);
        cup.setEndDate(DATE);
        return tournaments.save(cup);
    }

    private Team team(Tournament cup, String name) {
        Team team = new Team();
        team.setTournament(cup);
        team.setTeamName(name);
        team.setStatus("ACTIVE");
        return teams.save(team);
    }

    private Stadium stadium(Tournament cup, String name) {
        Stadium stadium = new Stadium();
        stadium.setTournament(cup);
        stadium.setName(name);
        stadium.setAvailabilityStatus("AVAILABLE");
        return stadiums.save(stadium);
    }

    private Long official(Tournament cup, String name) {
        Official official = new Official();
        official.setTournament(cup);
        official.setName(name);
        official.setRole("UMPIRE");
        official.setStatus("ACTIVE");
        return officials.save(official).getOfficialId();
    }

    private static String path(Tournament cup) {
        return "/api/tournaments/" + cup.getTournamentId();
    }

    private static String version(String name) {
        return "{\"versionName\":\"" + name + "\"}";
    }

    private static SecurityContext adminSecurityContext() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("integration-admin", "",
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        return context;
    }
}
