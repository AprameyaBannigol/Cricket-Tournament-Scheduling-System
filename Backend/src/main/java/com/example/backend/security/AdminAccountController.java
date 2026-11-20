package com.example.backend.security;

import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {
    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbc;

    public AdminAccountController(AppUserRepository users, PasswordEncoder passwordEncoder, JdbcTemplate jdbc) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jdbc = jdbc;
    }

    @PostMapping
    @Transactional
    public AccountResponse create(@Valid @RequestBody CreateAccountRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        Set<AppRole> roles = request.roles();
        AppUser saved = users.saveAndFlush(new AppUser(email, passwordEncoder.encode(request.password()), roles));
        return new AccountResponse(saved.getId(), saved.getEmail(), saved.getRoles());
    }

    @org.springframework.web.bind.annotation.PutMapping("/{userId}/roles")
    @Transactional
    public AccountResponse replaceRoles(@org.springframework.web.bind.annotation.PathVariable Long userId,
            @Valid @RequestBody RolesRequest request) {
        AppUser account = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (account.getRoles().contains(AppRole.ADMIN) && !request.roles().contains(AppRole.ADMIN)
                && users.countByRolesContaining(AppRole.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "At least one ADMIN account must remain");
        }
        account.replaceRoles(request.roles());
        AppUser saved = users.saveAndFlush(account);
        return new AccountResponse(saved.getId(), saved.getEmail(), saved.getRoles());
    }

    @PostMapping("/organizer-assignment")
    @Transactional
    public void assignOrganizer(@Valid @RequestBody OrganizerAssignment request) {
        requireUserRole(request.userId(), AppRole.ORGANIZER);
        requireExists("select exists(select 1 from tournament where tournament_id=?)", request.tournamentId(), "Tournament not found");
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,?) on conflict do nothing",
                request.userId(), request.tournamentId());
    }

    @PostMapping("/team-manager-assignment")
    @Transactional
    public void assignTeamManager(@Valid @RequestBody TeamAssignment request) {
        requireUserRole(request.userId(), AppRole.TEAM_MANAGER);
        requireExists("select exists(select 1 from team where team_id=?)", request.teamId(), "Team not found");
        jdbc.update("insert into team_manager_assignment(user_id,team_id) values (?,?) on conflict do nothing",
                request.userId(), request.teamId());
    }

    private void requireExists(String sql, Long id, String message) {
        if (!Boolean.TRUE.equals(jdbc.queryForObject(sql, Boolean.class, id))) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, message);
        }
    }

    private void requireUserRole(Long id, AppRole role) {
        AppUser user = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!user.getRoles().contains(role)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account must have role " + role);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> handleAdminRequestError(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
                .body(ProblemDetail.forStatusAndDetail(exception.getStatusCode(), exception.getReason()));
    }

    public record CreateAccountRequest(@NotBlank @Email String email, @NotBlank @Size(min=12, max=72) String password,
            @NotEmpty Set<@NotNull AppRole> roles) { }
    public record RolesRequest(@NotEmpty Set<@NotNull AppRole> roles) { }
    public record AccountResponse(Long id, String email, Set<AppRole> roles) { }
    public record OrganizerAssignment(@NotNull @Positive Long userId, @NotNull @Positive Long tournamentId) { }
    public record TeamAssignment(@NotNull @Positive Long userId, @NotNull @Positive Long teamId) { }
}
