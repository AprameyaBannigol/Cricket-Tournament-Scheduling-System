package com.example.backend.e2.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import com.example.backend.e2.dto.MatchResultRequest;
import com.example.backend.e2.dto.TournamentMatchResult;
import com.example.backend.e2.service.MatchResultService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/matches")
public class MatchResultController {
    private final MatchResultService service;
    private final com.example.backend.security.PermissionService permissions;
    public MatchResultController(MatchResultService service, com.example.backend.security.PermissionService permissions) {
        this.service = service;
        this.permissions = permissions;
    }

    @GetMapping
    public List<TournamentMatchResult> list(@PathVariable Long tournamentId,
            org.springframework.security.core.Authentication authentication) {
        List<TournamentMatchResult> matches = service.list(tournamentId);
        if (permissions.hasRole(authentication, com.example.backend.security.AppRole.TEAM_MANAGER)) {
            var assigned = java.util.Set.copyOf(permissions.assignedFixtureIds(authentication, tournamentId));
            return matches.stream().filter(match -> assigned.contains(match.fixtureId())).toList();
        }
        return matches;
    }

    @GetMapping("/{fixtureId}/result")
    @PreAuthorize("!hasRole('TEAM_MANAGER') or @permissions.canManageFixture(authentication,#tournamentId,#fixtureId)")
    public TournamentMatchResult get(@PathVariable Long tournamentId, @PathVariable Long fixtureId) {
        return service.get(tournamentId, fixtureId);
    }

    @PutMapping("/{fixtureId}/result")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("@permissions.canManageFixture(authentication,#tournamentId,#fixtureId)")
    public TournamentMatchResult save(@PathVariable Long tournamentId, @PathVariable Long fixtureId,
            @Valid @RequestBody MatchResultRequest request) {
        return service.save(tournamentId, fixtureId, request);
    }
}
