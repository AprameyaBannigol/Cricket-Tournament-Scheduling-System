package com.example.backend.security;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.backend.e2.dto.ScheduleReadiness;
import com.example.backend.e2.dto.ScheduleVersionSummary;
import com.example.backend.e2.dto.TournamentMatchResult;
import com.example.backend.e2.service.MatchResultService;
import com.example.backend.e2.service.TournamentScheduleApiService;
import com.example.backend.e3.dto.OfficialRequest;
import com.example.backend.e3.dto.StadiumRequest;
import com.example.backend.e3.dto.TeamRequest;
import com.example.backend.e3.dto.TournamentRequest;
import com.example.backend.e3.dto.TournamentAnalytics;
import com.example.backend.e3.service.TournamentManagementService;
import com.example.backend.e3.service.TournamentStatisticsService;

@Service
public class OrganizerDashboardService {
    private final PermissionService permissions;
    private final TournamentManagementService management;
    private final TournamentScheduleApiService schedules;
    private final MatchResultService matchResults;
    private final TournamentStatisticsService statistics;

    public OrganizerDashboardService(PermissionService permissions, TournamentManagementService management,
            TournamentScheduleApiService schedules, MatchResultService matchResults,
            TournamentStatisticsService statistics) {
        this.permissions = permissions;
        this.management = management;
        this.schedules = schedules;
        this.matchResults = matchResults;
        this.statistics = statistics;
    }

    public DashboardResponse dashboard(Authentication authentication) {
        boolean admin = permissions.hasRole(authentication, AppRole.ADMIN);
        if (!admin && !permissions.hasRole(authentication, AppRole.ORGANIZER)) {
            throw new AccessDeniedException("Organizer access required");
        }
        List<Long> assignedIds = admin ? management.listTournaments().stream()
                .map(TournamentRequest.Response::tournamentId).toList()
                : permissions.assignedTournamentIds(authentication);
        Set<Long> allowedIds = Set.copyOf(assignedIds);
        List<TournamentDashboard> tournaments = management.listTournaments().stream()
                .filter(tournament -> allowedIds.contains(tournament.tournamentId()))
                .map(this::tournamentDashboard).toList();
        return new DashboardResponse(tournaments);
    }

    private TournamentDashboard tournamentDashboard(TournamentRequest.Response tournament) {
        Long tournamentId = tournament.tournamentId();
        List<TeamRequest.Response> teams = management.listTeams(tournamentId);
        List<StadiumRequest.Response> stadiums = management.listStadiums(tournamentId);
        List<OfficialRequest.Response> officials = management.listOfficials(tournamentId);
        ScheduleReadiness readiness = schedules.readiness(tournamentId);
        List<ScheduleVersionSummary> versions = schedules.listSchedules(tournamentId);
        ScheduleVersionSummary latest = versions.isEmpty() ? null : versions.get(0);
        TournamentAnalytics analytics = statistics.analytics(tournamentId);
        LocalDateTime now = LocalDateTime.now();
        long upcoming = matchResults.list(tournamentId).stream()
                .filter(match -> match.result() == null && match.startTime() != null && match.startTime().isAfter(now))
                .count();
        return new TournamentDashboard(tournamentId, tournament.name(), tournament.startDate(), tournament.endDate(),
                teams.stream().map(team -> new ResourceSummary(team.teamId(), team.teamName())).toList(),
                stadiums.stream().map(stadium -> new ResourceSummary(stadium.stadiumId(), stadium.name())).toList(),
                officials.stream().map(official -> new ResourceSummary(official.officialId(), official.name())).toList(),
                latest == null ? 0 : latest.matchCount(), analytics.completedMatches(), upcoming,
                readiness.ready(), readiness.issues(), latest, analytics.completionPercentage());
    }

    public record DashboardResponse(List<TournamentDashboard> tournaments) { }
    public record TournamentDashboard(Long tournamentId, String name, java.time.LocalDate startDate,
            java.time.LocalDate endDate, List<ResourceSummary> teams, List<ResourceSummary> stadiums,
            List<ResourceSummary> officials, long totalScheduledFixtures, int completedMatches,
            long upcomingMatches, boolean schedulingReady,
            List<com.example.backend.dto.SchedulingConflictDTO> readinessIssues,
            ScheduleVersionSummary latestScheduleVersion, java.math.BigDecimal completionPercentage) { }
    public record ResourceSummary(Long id, String name) { }
}
