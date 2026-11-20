package com.example.backend.security;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {
    private final AppUserRepository users;
    private final JdbcTemplate jdbc;

    public AdminDashboardController(AppUserRepository users, JdbcTemplate jdbc) {
        this.users = users;
        this.jdbc = jdbc;
    }

    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        List<AppUser> accounts = users.findAll(Sort.by(Sort.Direction.ASC, "email"));
        Map<AppRole, Long> usersByRole = new EnumMap<>(AppRole.class);
        for (AppRole role : AppRole.values()) usersByRole.put(role, 0L);
        for (AppUser account : accounts) {
            for (AppRole role : account.getRoles()) usersByRole.compute(role, (key, value) -> value + 1);
        }

        Map<Long, List<AssignedTournament>> tournamentsByUser = new HashMap<>();
        jdbc.query("select a.user_id, t.tournament_id, t.name from organizer_tournament_assignment a join tournament t on t.tournament_id=a.tournament_id order by t.name",
                (RowCallbackHandler)
                row -> tournamentsByUser.computeIfAbsent(row.getLong("user_id"), ignored -> new ArrayList<>())
                    .add(new AssignedTournament(row.getLong("tournament_id"), row.getString("name"))));
        Map<Long, List<AssignedTeam>> teamsByUser = new HashMap<>();
        jdbc.query("select a.user_id, t.team_id, t.team_name, t.tournament_id, tr.name as tournament_name from team_manager_assignment a join team t on t.team_id=a.team_id join tournament tr on tr.tournament_id=t.tournament_id order by tr.name, t.team_name",
                (RowCallbackHandler)
                row -> teamsByUser.computeIfAbsent(row.getLong("user_id"), ignored -> new ArrayList<>())
                    .add(new AssignedTeam(row.getLong("team_id"), row.getString("team_name"),
                            row.getLong("tournament_id"), row.getString("tournament_name"))));

        List<AccountView> accountViews = accounts.stream().map(account -> new AccountView(
                account.getId(), account.getEmail(), account.isEnabled(), account.getCreatedAt(), account.getRoles(),
                tournamentsByUser.getOrDefault(account.getId(), List.of()),
                teamsByUser.getOrDefault(account.getId(), List.of()))).toList();
        Long tournamentCount = jdbc.queryForObject("select count(*) from tournament", Long.class);
        Long teamCount = jdbc.queryForObject("select count(*) from team", Long.class);
        return new DashboardResponse(accounts.size(), usersByRole, tournamentCount, teamCount, accountViews);
    }

    public record DashboardResponse(long totalUsers, Map<AppRole, Long> usersByRole, Long totalTournaments,
            Long totalTeams, List<AccountView> users) { }
    public record AccountView(Long id, String email, boolean enabled, Instant createdAt, java.util.Set<AppRole> roles,
            List<AssignedTournament> tournaments, List<AssignedTeam> teams) { }
    public record AssignedTournament(Long tournamentId, String name) { }
    public record AssignedTeam(Long teamId, String name, Long tournamentId, String tournamentName) { }
}
