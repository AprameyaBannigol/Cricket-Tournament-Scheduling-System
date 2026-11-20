package com.example.backend.e2.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.backend.dto.CompleteSchedulingResult;
import com.example.backend.dto.SchedulingConflictDTO;
import com.example.backend.dto.TournamentSchedulingInputDTO;
import com.example.backend.service.ScheduleAllocationService;

@Service
public class TournamentScheduleOrchestrationService {

    private final TournamentSchedulingDataLoader dataLoader;
    private final ScheduleAllocationService scheduleAllocationService;

    public TournamentScheduleOrchestrationService(
            TournamentSchedulingDataLoader dataLoader,
            ScheduleAllocationService scheduleAllocationService) {
        this.dataLoader = dataLoader;
        this.scheduleAllocationService = scheduleAllocationService;
    }

    public List<SchedulingConflictDTO> checkReadiness(Long tournamentId) {
        return scheduleAllocationService.checkReadiness(dataLoader.loadForTournament(tournamentId));
    }

    public CompleteSchedulingResult generateSchedule(Long tournamentId) {
        TournamentSchedulingInputDTO input = dataLoader.loadForTournament(tournamentId);
        return scheduleAllocationService.generateSchedule(input);
    }
}
