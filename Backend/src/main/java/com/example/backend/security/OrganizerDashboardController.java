package com.example.backend.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/organizer")
@PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
public class OrganizerDashboardController {
    private final OrganizerDashboardService dashboard;

    public OrganizerDashboardController(OrganizerDashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/dashboard")
    public OrganizerDashboardService.DashboardResponse dashboard(Authentication authentication) {
        return dashboard.dashboard(authentication);
    }
}
