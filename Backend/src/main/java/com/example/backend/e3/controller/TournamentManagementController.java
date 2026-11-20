package com.example.backend.e3.controller;

import java.net.URI;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.e3.dto.OfficialRequest;
import com.example.backend.e3.dto.StadiumRequest;
import com.example.backend.e3.dto.TeamRequest;
import com.example.backend.e3.dto.TournamentRequest;
import com.example.backend.e3.service.TournamentManagementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping(TournamentManagementController.BASE_PATH)
public class TournamentManagementController {

    static final String BASE_PATH = "/api/tournaments";

    private final TournamentManagementService service;
    private final com.example.backend.security.PermissionService permissions;

    @Autowired
    public TournamentManagementController(TournamentManagementService service,
            com.example.backend.security.PermissionService permissions) {
        this.service = service;
        this.permissions = permissions;
    }

    public TournamentManagementController(TournamentManagementService service) {
        this(service, null);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    @Transactional
    public ResponseEntity<TournamentRequest.Response> createTournament(@Valid @RequestBody TournamentRequest request,
            Authentication authentication) {
        TournamentRequest.Response created = service.createTournament(request);
        if (permissions != null && authentication != null
                && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ORGANIZER"))
                && authentication.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            var userId = permissions.userIdFor(authentication);
            permissions.assignOrganizer(userId, created.tournamentId());
        }
        return ResponseEntity.created(URI.create(BASE_PATH + "/" + created.tournamentId())).body(created);
    }

    @GetMapping
    public List<TournamentRequest.Response> listTournaments(Authentication authentication) {
        List<TournamentRequest.Response> tournaments = service.listTournaments();
        if (permissions != null && permissions.hasRole(authentication, com.example.backend.security.AppRole.ORGANIZER)
                && !permissions.hasRole(authentication, com.example.backend.security.AppRole.ADMIN)) {
            var assigned = java.util.Set.copyOf(permissions.assignedTournamentIds(authentication));
            return tournaments.stream().filter(tournament -> assigned.contains(tournament.tournamentId())).toList();
        }
        return tournaments;
    }

    @GetMapping("/{tournamentId}")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public TournamentRequest.Response getTournament(@PathVariable Long tournamentId) {
        return service.getTournament(tournamentId);
    }

    @PutMapping("/{tournamentId}")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public TournamentRequest.Response updateTournament(@PathVariable Long tournamentId,
            @Valid @RequestBody TournamentRequest request) {
        return service.updateTournament(tournamentId, request);
    }

    @PostMapping("/{tournamentId}/teams")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public ResponseEntity<TeamRequest.Response> createTeam(@PathVariable Long tournamentId,
            @Valid @RequestBody TeamRequest request) {
        TeamRequest.Response created = service.createTeam(tournamentId, request);
        return ResponseEntity.created(resourceUri(tournamentId, "teams", created.teamId())).body(created);
    }

    @GetMapping("/{tournamentId}/teams")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public List<TeamRequest.Response> listTeams(@PathVariable Long tournamentId, Authentication authentication) {
        List<TeamRequest.Response> teams = service.listTeams(tournamentId);
        if (permissions != null && permissions.hasRole(authentication, com.example.backend.security.AppRole.TEAM_MANAGER)) {
            var assigned = java.util.Set.copyOf(permissions.assignedTeamIds(authentication));
            return teams.stream().filter(team -> assigned.contains(team.teamId())).toList();
        }
        return teams;
    }

    @PutMapping("/{tournamentId}/teams/{teamId}")
    @PreAuthorize("@permissions.canManageTournamentOrTeam(authentication,#tournamentId,#teamId)")
    public TeamRequest.Response updateTeam(@PathVariable Long tournamentId, @PathVariable Long teamId,
            @Valid @RequestBody TeamRequest request) {
        return service.updateTeam(tournamentId, teamId, request);
    }

    @PostMapping("/{tournamentId}/stadiums")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public ResponseEntity<StadiumRequest.Response> createStadium(@PathVariable Long tournamentId,
            @Valid @RequestBody StadiumRequest request) {
        StadiumRequest.Response created = service.createStadium(tournamentId, request);
        return ResponseEntity.created(resourceUri(tournamentId, "stadiums", created.stadiumId())).body(created);
    }

    @GetMapping("/{tournamentId}/stadiums")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public List<StadiumRequest.Response> listStadiums(@PathVariable Long tournamentId) {
        return service.listStadiums(tournamentId);
    }

    @PutMapping("/{tournamentId}/stadiums/{stadiumId}")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public StadiumRequest.Response updateStadium(@PathVariable Long tournamentId, @PathVariable Long stadiumId,
            @Valid @RequestBody StadiumRequest request) {
        return service.updateStadium(tournamentId, stadiumId, request);
    }

    @PostMapping("/{tournamentId}/officials")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public ResponseEntity<OfficialRequest.Response> createOfficial(@PathVariable Long tournamentId,
            @Valid @RequestBody OfficialRequest request) {
        OfficialRequest.Response created = service.createOfficial(tournamentId, request);
        return ResponseEntity.created(resourceUri(tournamentId, "officials", created.officialId())).body(created);
    }

    @GetMapping("/{tournamentId}/officials")
    @PreAuthorize("!hasRole('ORGANIZER') or @permissions.canManageTournament(authentication,#tournamentId)")
    public List<OfficialRequest.Response> listOfficials(@PathVariable Long tournamentId) {
        return service.listOfficials(tournamentId);
    }

    @PutMapping("/{tournamentId}/officials/{officialId}")
    @PreAuthorize("@permissions.canManageTournament(authentication,#tournamentId)")
    public OfficialRequest.Response updateOfficial(@PathVariable Long tournamentId, @PathVariable Long officialId,
            @Valid @RequestBody OfficialRequest request) {
        return service.updateOfficial(tournamentId, officialId, request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ProblemDetail invalidPathId(MethodArgumentTypeMismatchException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            exception.getName() + " must be a positive integer");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail dataConflict() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
            "The resource conflicts with a database constraint");
    }

    private URI resourceUri(Long tournamentId, String collection, Long resourceId) {
        return URI.create(BASE_PATH + "/" + tournamentId + "/" + collection + "/" + resourceId);
    }
}
