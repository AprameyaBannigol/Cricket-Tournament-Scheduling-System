package com.example.backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.SchedulingResult;
import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.TournamentInputDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.service.ScheduleAllocationService;
import com.example.backend.service.SchedulingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {

    private final SchedulingService schedulingService;
    private final ScheduleAllocationService scheduleAllocationService;

    public ScheduleController(
            SchedulingService schedulingService,
            ScheduleAllocationService scheduleAllocationService) {
        this.schedulingService = schedulingService;
        this.scheduleAllocationService = scheduleAllocationService;
    }

    @PostMapping("/fixtures")
    public SchedulingResult generateFixtures(
            @Valid @RequestBody TournamentInputDTO tournament) {
        try {
            return schedulingService.generateFixtures(tournament);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                exception
            );
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<CompleteSchedulingResult> generateSchedule(
            @Valid @RequestBody TournamentSchedulingInputDTO tournament) {
        CompleteSchedulingResult result = scheduleAllocationService.generateSchedule(tournament);
        HttpStatus status = switch (result.status()) {
            case SCHEDULE_GENERATED -> HttpStatus.OK;
            case INVALID_INPUT -> HttpStatus.BAD_REQUEST;
            case NO_FEASIBLE_SCHEDULE -> HttpStatus.UNPROCESSABLE_ENTITY;
            case SEARCH_LIMIT_REACHED -> HttpStatus.SERVICE_UNAVAILABLE;
        };
        return ResponseEntity.status(status).body(result);
    }

}
