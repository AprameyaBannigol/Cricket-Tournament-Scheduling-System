package com.example.backend.e2.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.example.backend.dto.VenueTravelTimeDTO;
import com.example.backend.e2.service.VenueTravelTimeService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}/venue-travel-times")
public class VenueTravelTimeController {

    private final VenueTravelTimeService service;

    public VenueTravelTimeController(VenueTravelTimeService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public List<VenueTravelTimeDTO> list(@PathVariable Long tournamentId) {
        return service.list(tournamentId);
    }

    @PutMapping("/{fromStadiumId}/{toStadiumId}")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public VenueTravelTimeDTO save(@PathVariable Long tournamentId, @PathVariable Long fromStadiumId,
            @PathVariable Long toStadiumId, @Valid @RequestBody TravelTimeRequest request) {
        return service.save(tournamentId, fromStadiumId, toStadiumId, request.travelMinutes());
    }

    public record TravelTimeRequest(
            @NotNull(message = "Travel minutes are required")
            @PositiveOrZero(message = "Travel minutes must be nonnegative")
            Integer travelMinutes) {
    }
}
