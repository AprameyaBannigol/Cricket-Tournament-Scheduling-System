package com.example.backend.security;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import java.util.List;

@Component("permissions")
public class PermissionService {
    private final AppUserRepository users;
    private final JdbcTemplate jdbc;

    public PermissionService(AppUserRepository users, JdbcTemplate jdbc) {
        this.users = users;
        this.jdbc = jdbc;
    }

    public boolean canManageTournament(Authentication authentication, Long tournamentId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        if (has(authentication, AppRole.ADMIN)) return true;
        if (!has(authentication, AppRole.ORGANIZER)) return false;
        return userId(authentication) != null && Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists(select 1 from organizer_tournament_assignment where user_id=? and tournament_id=?)",
                Boolean.class, userId(authentication), tournamentId));
    }

    public boolean canManageTeam(Authentication authentication, Long teamId) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        if (has(authentication, AppRole.ADMIN)) return true;
        if (has(authentication, AppRole.ORGANIZER)) {
            Long uid = userId(authentication);
            return uid != null && Boolean.TRUE.equals(jdbc.queryForObject(
                    "select exists(select 1 from team t join organizer_tournament_assignment a on a.tournament_id=t.tournament_id where a.user_id=? and t.team_id=?)",
                    Boolean.class, uid, teamId));
        }
        Long uid = userId(authentication);
        return has(authentication, AppRole.TEAM_MANAGER) && uid != null && Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists(select 1 from team_manager_assignment where user_id=? and team_id=?)",
                Boolean.class, uid, teamId));
    }

    public boolean canManageTournamentOrTeam(Authentication authentication, Long tournamentId, Long teamId) {
        return canManageTournament(authentication, tournamentId) || canManageTeam(authentication, teamId)
                && Boolean.TRUE.equals(jdbc.queryForObject("select exists(select 1 from team where team_id=? and tournament_id=?)", Boolean.class, teamId, tournamentId));
    }

    public boolean canManageSchedulingResource(Authentication authentication, Long tournamentId, String resourceType, Long resourceId) {
        if (canManageTournament(authentication, tournamentId)) return true;
        if (!("team".equalsIgnoreCase(resourceType) || "teams".equalsIgnoreCase(resourceType))
                || !has(authentication, AppRole.TEAM_MANAGER)) return false;
        Long uid = userId(authentication);
        return uid != null && Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists(select 1 from team_manager_assignment a join team t on t.team_id=a.team_id where a.user_id=? and a.team_id=? and t.tournament_id=?)",
                Boolean.class, uid, resourceId, tournamentId));
    }

    public boolean canManageFixture(Authentication authentication, Long tournamentId, Long fixtureId) {
        if (canManageTournament(authentication, tournamentId)) return true;
        if (!has(authentication, AppRole.TEAM_MANAGER)) return false;
        Long uid = userId(authentication);
        return uid != null && Boolean.TRUE.equals(jdbc.queryForObject(
                "select exists(select 1 from fixture f join team_manager_assignment a on a.team_id=f.team1_id or a.team_id=f.team2_id where f.fixture_id=? and f.tournament_id=? and a.user_id=?)",
                Boolean.class, fixtureId, tournamentId, uid));
    }

    public void assignOrganizer(Long userId, Long tournamentId) {
        jdbc.update("insert into organizer_tournament_assignment(user_id,tournament_id) values (?,?) on conflict do nothing", userId, tournamentId);
    }

    public Long userIdFor(Authentication authentication) { return userId(authentication); }

    public List<Long> assignedTournamentIds(Authentication authentication) {
        Long id = userId(authentication);
        if (id == null) return List.of();
        return jdbc.queryForList(
                "select tournament_id from organizer_tournament_assignment where user_id=? order by tournament_id",
                Long.class, id);
    }

    public List<Long> assignedTeamIds(Authentication authentication) {
        Long id = userId(authentication);
        if (id == null) return List.of();
        return jdbc.queryForList(
                "select team_id from team_manager_assignment where user_id=? order by team_id",
                Long.class, id);
    }

    public List<Long> assignedFixtureIds(Authentication authentication, Long tournamentId) {
        Long id = userId(authentication);
        if (id == null || tournamentId == null) return List.of();
        return jdbc.queryForList(
                "select distinct f.fixture_id from fixture f join team_manager_assignment a on (a.team_id=f.team1_id or a.team_id=f.team2_id) where a.user_id=? and f.tournament_id=? order by f.fixture_id",
                Long.class, id, tournamentId);
    }

    public boolean hasRole(Authentication authentication, AppRole role) {
        return has(authentication, role);
    }

    private boolean has(Authentication authentication, AppRole role) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role.name()));
    }

    private Long userId(Authentication authentication) {
        return users.findByEmailIgnoreCase(authentication.getName()).map(AppUser::getId).orElse(null);
    }
}
