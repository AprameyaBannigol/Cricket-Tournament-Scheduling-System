package com.example.backend.e3.controller;

import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.access.prepost.PreAuthorize;

import com.example.backend.e3.dto.MatchConfigurationRequest;
import com.example.backend.e3.dto.SchedulingAvailabilityRequest;
import com.example.backend.e3.dto.SchedulingConstraintsRequest;
import com.example.backend.e3.service.SchedulingConfigurationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/tournaments/{tournamentId}")
public class SchedulingConfigurationController {

    private final SchedulingConfigurationService service;

    public SchedulingConfigurationController(SchedulingConfigurationService service) {
        this.service = service;
    }

    @GetMapping("/match-configuration")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public ResponseEntity<MatchConfigurationRequest> matchConfiguration(@PathVariable Long tournamentId) {
        return configuration(service.getMatchConfiguration(tournamentId));
    }

    @PutMapping("/match-configuration")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public MatchConfigurationRequest saveMatchConfiguration(
            @PathVariable Long tournamentId, @Valid @RequestBody MatchConfigurationRequest request) {
        return service.saveMatchConfiguration(tournamentId, request);
    }

    @GetMapping("/scheduling-constraints")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public ResponseEntity<SchedulingConstraintsRequest> constraints(@PathVariable Long tournamentId) {
        return configuration(service.getConstraints(tournamentId));
    }

    @PutMapping("/scheduling-constraints")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public SchedulingConstraintsRequest saveConstraints(
            @PathVariable Long tournamentId, @Valid @RequestBody SchedulingConstraintsRequest request) {
        return service.saveConstraints(tournamentId, request);
    }

    @GetMapping("/availability/{resourceType}/{resourceId}")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public SchedulingAvailabilityRequest availability(
            @PathVariable Long tournamentId, @PathVariable String resourceType, @PathVariable Long resourceId) {
        return service.getAvailability(tournamentId, resourceType, resourceId);
    }

    @PutMapping("/availability/{resourceType}/{resourceId}")
    @PreAuthorize("@permissions.canManageSchedulingResource(authentication,#tournamentId,#resourceType,#resourceId)")
    public SchedulingAvailabilityRequest saveAvailability(
            @PathVariable Long tournamentId, @PathVariable String resourceType, @PathVariable Long resourceId,
            @Valid @RequestBody SchedulingAvailabilityRequest request) {
        return service.saveAvailability(tournamentId, resourceType, resourceId, request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail invalidConfiguration(MethodArgumentNotValidException exception) {
        String detail = exception.getBindingResult().getFieldErrors().stream().findFirst()
            .map(error -> error.getField() + " " + error.getDefaultMessage())
            .orElse("Invalid scheduling configuration");
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail invalidPathId(MethodArgumentTypeMismatchException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            exception.getName() + " must be a positive integer");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail dataConflict() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
            "The scheduling configuration conflicts with a database constraint");
    }

    private static <T> ResponseEntity<T> configuration(Optional<T> value) {
        return value.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }
}
