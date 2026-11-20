package com.example.backend.security;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.e2.dto.TournamentMatchResult;
import com.example.backend.e2.service.MatchResultService;
import com.example.backend.e3.dto.StandingsRow;
import com.example.backend.e3.dto.TeamRequest;
import com.example.backend.e3.dto.TournamentRequest;
import com.example.backend.e3.service.TournamentManagementService;
import com.example.backend.e3.service.TournamentStatisticsService;

@Service
public class TeamManagerDashboardService {
    private final PermissionService permissions;
    private final JdbcTemplate jdbc;
    private final TournamentManagementService tournaments;
    private final MatchResultService matches;
    private final TournamentStatisticsService statistics;

    public TeamManagerDashboardService(PermissionService permissions, JdbcTemplate jdbc,
            TournamentManagementService tournaments, MatchResultService matches,
            TournamentStatisticsService statistics) {
        this.permissions = permissions;
        this.jdbc = jdbc;
        this.tournaments = tournaments;
        this.matches = matches;
        this.statistics = statistics;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard(Authentication authentication) {
        if (!permissions.hasRole(authentication, AppRole.TEAM_MANAGER)) {
            throw new AccessDeniedException("Team Manager access required");
        }
        List<Long> assignedIds = permissions.assignedTeamIds(authentication);
        if (assignedIds.isEmpty()) return new DashboardResponse(List.of());
        Set<Long> allowedTeams = Set.copyOf(assignedIds);
        Map<Long, TournamentRequest.Response> tournamentById = tournaments.listTournaments().stream()
                .collect(Collectors.toMap(TournamentRequest.Response::tournamentId, item -> item));
        List<AssignedTeam> assignedTeams = jdbc.query(
                "select t.team_id, t.tournament_id from team t where t.team_id in (" + placeholders(assignedIds.size()) + ") order by t.tournament_id, t.team_id",
                (row, index) -> new AssignedTeam(row.getLong("team_id"), row.getLong("tournament_id")),
                assignedIds.toArray());
        Map<Long, List<TournamentMatchResult>> matchesByTournament = assignedTeams.stream()
                .map(AssignedTeam::tournamentId).distinct()
                .collect(Collectors.toMap(id -> id, matches::list));
        Map<Long, List<StandingsRow>> standingsByTournament = assignedTeams.stream()
                .map(AssignedTeam::tournamentId).distinct()
                .collect(Collectors.toMap(id -> id, statistics::standings));

        List<TeamDashboard> teamRows = assignedTeams.stream().map(assigned -> {
            TournamentRequest.Response tournament = tournamentById.get(assigned.tournamentId());
            if (tournament == null) return null;
            TeamRequest.Response team = tournaments.listTeams(assigned.tournamentId()).stream()
                    .filter(item -> item.teamId().equals(assigned.teamId()) && allowedTeams.contains(item.teamId()))
                    .findFirst().orElse(null);
            if (team == null) return null;
            Set<Long> fixtureIds = Set.copyOf(permissions.assignedFixtureIds(authentication, assigned.tournamentId()));
            List<TournamentMatchResult> teamMatches = matchesByTournament.getOrDefault(assigned.tournamentId(), List.of())
                    .stream().filter(match -> fixtureIds.contains(match.fixtureId())).toList();
            StandingsRow performance = standingsByTournament.getOrDefault(assigned.tournamentId(), List.of())
                    .stream().filter(row -> row.teamId().equals(assigned.teamId())).findFirst().orElse(null);
            return new TeamDashboard(team.teamId(), assigned.tournamentId(), tournament.name(), tournament.startDate(),
                    tournament.endDate(), team.teamName(), team.college(), team.department(), team.captain(),
                    team.coach(), team.status(), teamMatches, performance);
        }).filter(java.util.Objects::nonNull).toList();
        return new DashboardResponse(teamRows);
    }

    private static String placeholders(int size) {
        return String.join(",", java.util.Collections.nCopies(size, "?"));
    }

    private record AssignedTeam(Long teamId, Long tournamentId) { }
    public record DashboardResponse(List<TeamDashboard> teams) { }
    public record TeamDashboard(Long teamId, Long tournamentId, String tournamentName,
            java.time.LocalDate tournamentStartDate, java.time.LocalDate tournamentEndDate,
            String teamName, String college, String department, String captain, String coach, String status,
            List<TournamentMatchResult> matches, StandingsRow performance) { }
}
