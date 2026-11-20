package com.example.backend.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/team-manager")
@PreAuthorize("hasRole('TEAM_MANAGER')")
public class TeamManagerDashboardController {
    private final TeamManagerDashboardService dashboard;

    public TeamManagerDashboardController(TeamManagerDashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/dashboard")
    public TeamManagerDashboardService.DashboardResponse dashboard(Authentication authentication) {
        return dashboard.dashboard(authentication);
    }
}
