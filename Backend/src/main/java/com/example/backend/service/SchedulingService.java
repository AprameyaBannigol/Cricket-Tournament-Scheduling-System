package com.example.backend.service;

import com.example.backend.dto.SchedulingResult;
import com.example.backend.dto.TournamentInputDTO;

public interface SchedulingService {

    SchedulingResult generateFixtures(TournamentInputDTO tournament);
}
