package com.example.backend.e2.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.backend.e2.dto.SavedSchedule;
import com.example.backend.e2.dto.ScheduleVersionSummary;
import com.example.backend.e2.service.DuplicateScheduleVersionException;
import com.example.backend.e2.service.ScheduleConflictException;
import com.example.backend.e2.service.TournamentScheduleApiService;

import jakarta.persistence.EntityNotFoundException;

class TournamentScheduleControllerTest {

    private TournamentScheduleApiService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(TournamentScheduleApiService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(
                new TournamentScheduleController(service))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();
    }

    @Test
    void generateReturns201AndSavedVersionId() throws Exception {
        SavedSchedule saved = new SavedSchedule(
            300L, 301L, "Final", LocalDateTime.of(2026, 12, 1, 10, 0), 1, List.of());
        when(service.generateAndSave(300L, "Final")).thenReturn(saved);

        mockMvc.perform(post("/api/tournaments/300/schedules/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"versionName\":\"Final\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.tournamentId").value(300))
            .andExpect(jsonPath("$.versionId").value(301))
            .andExpect(jsonPath("$.matchCount").value(1));
    }

    @Test
    void listReturnsVersionsAndEmptyList() throws Exception {
        ScheduleVersionSummary summary = new ScheduleVersionSummary(
            301L, "Final", LocalDateTime.of(2026, 12, 1, 10, 0), 6);
        when(service.listSchedules(300L)).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/tournaments/300/schedules"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].versionId").value(301))
            .andExpect(jsonPath("$[0].matchCount").value(6));

        when(service.listSchedules(301L)).thenReturn(List.of());
        mockMvc.perform(get("/api/tournaments/301/schedules"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void mapsValidationDuplicateConflictMissingAndFailedGeneration() throws Exception {
        mockMvc.perform(post("/api/tournaments/300/schedules/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"versionName\":\" \"}"))
            .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/tournaments/300/schedules/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{"))
            .andExpect(status().isBadRequest());

        when(service.generateAndSave(300L, "Duplicate"))
            .thenThrow(new DuplicateScheduleVersionException(300L, "Duplicate"));
        mockMvc.perform(post("/api/tournaments/300/schedules/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"versionName\":\"Duplicate\"}"))
            .andExpect(status().isConflict());

        when(service.generateAndSave(300L, "Impossible"))
            .thenThrow(new ScheduleConflictException("Conflict-free schedule unavailable"));
        mockMvc.perform(post("/api/tournaments/300/schedules/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"versionName\":\"Impossible\"}"))
            .andExpect(status().isUnprocessableEntity());

        when(service.getSchedule(300L, 999L))
            .thenThrow(new EntityNotFoundException("Schedule version not found"));
        mockMvc.perform(get("/api/tournaments/300/schedules/999"))
            .andExpect(status().isNotFound());
    }
}
