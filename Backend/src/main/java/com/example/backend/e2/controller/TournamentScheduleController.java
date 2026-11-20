package com.example.backend.e2.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.example.backend.e2.dto.GenerateScheduleRequest;
import com.example.backend.e2.dto.SavedSchedule;
import com.example.backend.e2.dto.ScheduleReadiness;
import com.example.backend.e2.dto.ScheduleVersionSummary;
import com.example.backend.e2.service.TournamentScheduleApiService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tournaments")
public class TournamentScheduleController {

    private final TournamentScheduleApiService service;

    public TournamentScheduleController(TournamentScheduleApiService service) {
        this.service = service;
    }

    @PostMapping("/{tournamentId}/schedules/generate")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public ResponseEntity<SavedSchedule> generate(
            @PathVariable Long tournamentId,
            @Valid @RequestBody GenerateScheduleRequest request) {
        SavedSchedule saved = service.generateAndSave(tournamentId, request.versionName());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{tournamentId}/schedules/readiness")
    public ScheduleReadiness readiness(@PathVariable Long tournamentId) {
        return service.readiness(tournamentId);
    }

    @GetMapping("/{tournamentId}/schedules")
    public List<ScheduleVersionSummary> list(@PathVariable Long tournamentId) {
        return service.listSchedules(tournamentId);
    }

    @GetMapping("/{tournamentId}/schedules/{versionId}")
    public SavedSchedule get(
            @PathVariable Long tournamentId,
            @PathVariable Long versionId) {
        return service.getSchedule(tournamentId, versionId);
    }
}
