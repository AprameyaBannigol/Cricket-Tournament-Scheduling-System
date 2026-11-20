package com.example.backend.e3.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.e3.dto.StandingsRow;
import com.example.backend.e3.dto.TournamentAnalytics;
import com.example.backend.e3.service.TournamentStatisticsService;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}")
public class TournamentStatisticsController {
    private final TournamentStatisticsService service;

    public TournamentStatisticsController(TournamentStatisticsService service) {
        this.service = service;
    }

    @GetMapping("/standings")
    public List<StandingsRow> standings(@PathVariable Long tournamentId) {
        return service.standings(tournamentId);
    }

    @GetMapping("/analytics")
    public TournamentAnalytics analytics(@PathVariable Long tournamentId) {
        return service.analytics(tournamentId);
    }
}
