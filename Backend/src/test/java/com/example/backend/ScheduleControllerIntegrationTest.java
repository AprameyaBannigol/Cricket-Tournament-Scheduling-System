package com.example.backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduleControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void startsWithoutPersistenceAndServesBothSchedulingEndpoints() throws Exception {
        String completeRequest = """
            {
              "tournamentId": 42,
              "tournamentName": "Integration Cup",
              "startDate": "2026-11-06",
              "endDate": "2026-11-06",
              "timeZone": "Asia/Kolkata",
              "teams": [
                {"id": 1, "name": "Falcons", "availability": [
                  {"date": "2026-11-06", "startTime": "08:00:00", "endTime": "20:00:00"}
                ]},
                {"id": 2, "name": "Tigers", "availability": [
                  {"date": "2026-11-06", "startTime": "08:00:00", "endTime": "20:00:00"}
                ]}
              ],
              "stadiums": [{
                "id": 10,
                "name": "Central Ground",
                "availability": [
                  {"date": "2026-11-06", "startTime": "08:00:00", "endTime": "20:00:00"}
                ],
                "supportedMatchDurationsMinutes": [60]
              }],
              "officials": [{
                "id": 20,
                "name": "Official One",
                "availability": [
                  {"date": "2026-11-06", "startTime": "08:00:00", "endTime": "20:00:00"}
                ],
                "eligibleRounds": [1]
              }],
              "matchDurationMinutes": 60,
              "availableTimeSlots": ["10:00:00"],
              "bufferMinutes": 0,
              "officialsRequiredPerMatch": 1,
              "constraints": {
                "minimumRecoveryMinutes": 0,
                "travelConstraintEnabled": false,
                "minimumTravelMinutes": null,
                "venueTravelTimes": []
              }
            }
            """;

        mockMvc.perform(post("/api/schedule/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(completeRequest))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SCHEDULE_GENERATED"))
            .andExpect(jsonPath("$.scheduledMatches").value(1))
            .andExpect(jsonPath("$.matches.length()").value(1));

        mockMvc.perform(post("/api/schedule/fixtures")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"tournamentId": 42, "teams": [
                      {"id": 1, "name": "Falcons"},
                      {"id": 2, "name": "Tigers"}
                    ]}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("FIXTURES_GENERATED"))
            .andExpect(jsonPath("$.fixtures.length()").value(1));
    }

    @Test
    void postmanBacktrackingRequestGeneratesACompleteConflictFreeSchedule() throws Exception {
        String request = readBacktrackingRequest();

        mockMvc.perform(post("/api/schedule/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("SCHEDULE_GENERATED"))
            .andExpect(jsonPath("$.totalFixtures").value(3))
            .andExpect(jsonPath("$.scheduledMatches").value(3))
            .andExpect(jsonPath("$.matches.length()").value(3))
            .andExpect(jsonPath("$.backtracks").value(org.hamcrest.Matchers.greaterThan(0)))
            .andExpect(jsonPath("$.conflicts").isEmpty())
            .andExpect(jsonPath("$.matches[?(@.fixture.round == 1)].startTime")
                .value(org.hamcrest.Matchers.contains("2026-11-11T10:00:00")))
            .andExpect(jsonPath("$.matches[?(@.fixture.round == 2)].startTime")
                .value(org.hamcrest.Matchers.contains("2026-11-10T12:00:00")))
            .andExpect(jsonPath("$.matches[?(@.fixture.round == 3)].startTime")
                .value(org.hamcrest.Matchers.contains("2026-11-12T10:00:00")));
    }

    private String readBacktrackingRequest() throws IOException {
        try (var stream = getClass().getResourceAsStream(
                "/postman/successful-backtracking-request.json")) {
            if (stream == null) {
                throw new IOException("Backtracking request test resource was not found");
            }
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
