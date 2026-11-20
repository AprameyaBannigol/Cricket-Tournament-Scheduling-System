package com.example.backend.e3.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.e2.entity.Official;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.Team;
import com.example.backend.e2.entity.Tournament;
import com.example.backend.e2.repository.OfficialRepository;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TeamRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e3.dto.OfficialRequest;
import com.example.backend.e3.dto.StadiumRequest;
import com.example.backend.e3.dto.TeamRequest;
import com.example.backend.e3.dto.TournamentRequest;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional(readOnly = true)
public class TournamentManagementService {

    private final TournamentRepository tournaments;
    private final TeamRepository teams;
    private final StadiumRepository stadiums;
    private final OfficialRepository officials;

    public TournamentManagementService(TournamentRepository tournaments, TeamRepository teams,
            StadiumRepository stadiums, OfficialRepository officials) {
        this.tournaments = tournaments;
        this.teams = teams;
        this.stadiums = stadiums;
        this.officials = officials;
    }

    @Transactional
    public TournamentRequest.Response createTournament(TournamentRequest request) {
        Tournament tournament = new Tournament();
        apply(tournament, request);
        return toResponse(tournaments.save(tournament));
    }

    public List<TournamentRequest.Response> listTournaments() {
        return tournaments.findAll(Sort.by("tournamentId")).stream().map(this::toResponse).toList();
    }

    public TournamentRequest.Response getTournament(Long tournamentId) {
        return toResponse(requireTournament(tournamentId));
    }

    @Transactional
    public TournamentRequest.Response updateTournament(Long tournamentId, TournamentRequest request) {
        Tournament tournament = requireTournament(tournamentId);
        apply(tournament, request);
        return toResponse(tournament);
    }

    @Transactional
    public TeamRequest.Response createTeam(Long tournamentId, TeamRequest request) {
        Team team = new Team();
        team.setTournament(requireTournament(tournamentId));
        apply(team, request);
        return toResponse(teams.save(team));
    }

    public List<TeamRequest.Response> listTeams(Long tournamentId) {
        requireTournamentExists(tournamentId);
        return teams.findAllByTournament_TournamentId(tournamentId).stream()
            .sorted(Comparator.comparing(Team::getTeamId))
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public TeamRequest.Response updateTeam(Long tournamentId, Long teamId, TeamRequest request) {
        requirePositiveId(tournamentId, "Tournament");
        requirePositiveId(teamId, "Team");
        Team team = teams.findByTournament_TournamentIdAndTeamId(tournamentId, teamId)
            .orElseThrow(() -> new EntityNotFoundException("Team not found in this tournament: " + teamId));
        apply(team, request);
        return toResponse(team);
    }

    @Transactional
    public StadiumRequest.Response createStadium(Long tournamentId, StadiumRequest request) {
        Stadium stadium = new Stadium();
        stadium.setTournament(requireTournament(tournamentId));
        apply(stadium, request);
        return toResponse(stadiums.save(stadium));
    }

    public List<StadiumRequest.Response> listStadiums(Long tournamentId) {
        requireTournamentExists(tournamentId);
        return stadiums.findAllByTournament_TournamentId(tournamentId).stream()
            .sorted(Comparator.comparing(Stadium::getStadiumId))
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public StadiumRequest.Response updateStadium(Long tournamentId, Long stadiumId, StadiumRequest request) {
        requirePositiveId(tournamentId, "Tournament");
        requirePositiveId(stadiumId, "Stadium");
        Stadium stadium = stadiums.findByTournament_TournamentIdAndStadiumId(tournamentId, stadiumId)
            .orElseThrow(() -> new EntityNotFoundException("Stadium not found in this tournament: " + stadiumId));
        apply(stadium, request);
        return toResponse(stadium);
    }

    @Transactional
    public OfficialRequest.Response createOfficial(Long tournamentId, OfficialRequest request) {
        Official official = new Official();
        official.setTournament(requireTournament(tournamentId));
        apply(official, request);
        return toResponse(officials.save(official));
    }

    public List<OfficialRequest.Response> listOfficials(Long tournamentId) {
        requireTournamentExists(tournamentId);
        return officials.findAllByTournament_TournamentId(tournamentId).stream()
            .sorted(Comparator.comparing(Official::getOfficialId))
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public OfficialRequest.Response updateOfficial(Long tournamentId, Long officialId, OfficialRequest request) {
        requirePositiveId(tournamentId, "Tournament");
        requirePositiveId(officialId, "Official");
        Official official = officials.findByTournament_TournamentIdAndOfficialId(tournamentId, officialId)
            .orElseThrow(() -> new EntityNotFoundException("Official not found in this tournament: " + officialId));
        apply(official, request);
        return toResponse(official);
    }

    private Tournament requireTournament(Long tournamentId) {
        requirePositiveId(tournamentId, "Tournament");
        return tournaments.findById(tournamentId)
            .orElseThrow(() -> new EntityNotFoundException("Tournament not found: " + tournamentId));
    }

    private void requireTournamentExists(Long tournamentId) {
        requirePositiveId(tournamentId, "Tournament");
        if (!tournaments.existsById(tournamentId)) {
            throw new EntityNotFoundException("Tournament not found: " + tournamentId);
        }
    }

    private void requirePositiveId(Long id, String resource) {
        if (id <= 0) {
            throw new IllegalArgumentException(resource + " ID must be positive");
        }
    }

    private void apply(Tournament tournament, TournamentRequest request) {
        if (request.startDate() != null && request.endDate() != null
                && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("End date must be on or after the start date");
        }
        tournament.setName(request.name().strip());
        tournament.setEdition(request.edition());
        tournament.setCategory(request.category());
        tournament.setSeason(request.season());
        tournament.setStartDate(request.startDate());
        tournament.setEndDate(request.endDate());
        tournament.setHostInstitution(request.hostInstitution());
        tournament.setBallType(request.ballType());
        tournament.setStatus(codeOrDefault(request.status(), "UPCOMING"));
    }

    private void apply(Team team, TeamRequest request) {
        team.setTeamName(request.teamName().strip());
        team.setCollege(request.college());
        team.setDepartment(request.department());
        team.setCaptain(request.captain());
        team.setCoach(request.coach());
        team.setSquadSize(request.squadSize());
        team.setPool(request.pool());
        team.setStatus(codeOrDefault(request.status(), "ACTIVE"));
    }

    private void apply(Stadium stadium, StadiumRequest request) {
        stadium.setName(request.name().strip());
        stadium.setShortName(request.shortName());
        stadium.setGroundType(request.groundType());
        stadium.setCapacity(request.capacity());
        stadium.setNumberOfPitches(request.numberOfPitches());
        stadium.setFloodlights(Boolean.TRUE.equals(request.floodlights()));
        stadium.setCurator(request.curator());
        stadium.setAvailabilityStatus(codeOrDefault(request.availabilityStatus(), "AVAILABLE"));
    }

    private void apply(Official official, OfficialRequest request) {
        official.setName(request.name().strip());
        official.setRole(request.role().strip().toUpperCase(Locale.ROOT));
        official.setQualification(request.qualification());
        official.setStatus(codeOrDefault(request.status(), "ACTIVE"));
    }

    private String codeOrDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.strip().toUpperCase(Locale.ROOT);
    }

    private TournamentRequest.Response toResponse(Tournament tournament) {
        return new TournamentRequest.Response(tournament.getTournamentId(), tournament.getName(),
            tournament.getEdition(), tournament.getCategory(), tournament.getSeason(),
            tournament.getStartDate(), tournament.getEndDate(), tournament.getHostInstitution(),
            tournament.getBallType(), tournament.getStatus());
    }

    private TeamRequest.Response toResponse(Team team) {
        return new TeamRequest.Response(team.getTeamId(), team.getTournament().getTournamentId(),
            team.getTeamName(), team.getCollege(), team.getDepartment(), team.getCaptain(),
            team.getCoach(), team.getSquadSize(), team.getPool(), team.getStatus());
    }

    private StadiumRequest.Response toResponse(Stadium stadium) {
        return new StadiumRequest.Response(stadium.getStadiumId(), stadium.getTournament().getTournamentId(),
            stadium.getName(), stadium.getShortName(), stadium.getGroundType(), stadium.getCapacity(),
            stadium.getNumberOfPitches(), stadium.getFloodlights(), stadium.getCurator(),
            stadium.getAvailabilityStatus());
    }

    private OfficialRequest.Response toResponse(Official official) {
        return new OfficialRequest.Response(official.getOfficialId(), official.getTournament().getTournamentId(),
            official.getName(), official.getRole(), official.getQualification(), official.getStatus());
    }
}
