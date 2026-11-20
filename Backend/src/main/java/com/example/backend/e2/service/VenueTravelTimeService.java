package com.example.backend.e2.service;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.dto.VenueTravelTimeDTO;
import com.example.backend.e2.entity.Stadium;
import com.example.backend.e2.entity.VenueTravelTime;
import com.example.backend.e2.repository.StadiumRepository;
import com.example.backend.e2.repository.TournamentRepository;
import com.example.backend.e2.repository.VenueTravelTimeRepository;

import jakarta.persistence.EntityNotFoundException;

@Service
@Transactional(readOnly = true)
public class VenueTravelTimeService {

    private final TournamentRepository tournaments;
    private final StadiumRepository stadiums;
    private final VenueTravelTimeRepository travelTimes;

    public VenueTravelTimeService(TournamentRepository tournaments, StadiumRepository stadiums,
            VenueTravelTimeRepository travelTimes) {
        this.tournaments = tournaments;
        this.stadiums = stadiums;
        this.travelTimes = travelTimes;
    }

    public List<VenueTravelTimeDTO> list(Long tournamentId) {
        tournaments.findById(tournamentId).orElseThrow(() -> missingTournament(tournamentId));
        Set<Long> ids = stadiums.findAllByTournament_TournamentId(tournamentId).stream()
            .map(Stadium::getStadiumId).collect(Collectors.toSet());
        if (ids.isEmpty()) return List.of();

        return travelTimes.findAllByFromStadium_StadiumIdIn(ids).stream()
            .filter(row -> ids.contains(row.getToStadium().getStadiumId()))
            .map(VenueTravelTimeService::toDto)
            .sorted(Comparator.comparing(VenueTravelTimeDTO::fromStadiumId)
                .thenComparing(VenueTravelTimeDTO::toStadiumId))
            .toList();
    }

    @Transactional
    public VenueTravelTimeDTO save(Long tournamentId, Long fromId, Long toId, int minutes) {
        tournaments.findForConfigurationUpdate(tournamentId)
            .orElseThrow(() -> missingTournament(tournamentId));
        if (fromId.equals(toId)) {
            throw new IllegalArgumentException("Choose two different stadiums");
        }
        Stadium from = findStadium(tournamentId, fromId);
        Stadium to = findStadium(tournamentId, toId);
        VenueTravelTime row = travelTimes.findByFromStadium_StadiumIdAndToStadium_StadiumId(fromId, toId)
            .orElseGet(VenueTravelTime::new);
        row.setFromStadium(from);
        row.setToStadium(to);
        row.setTravelMinutes(minutes);
        return toDto(travelTimes.save(row));
    }

    private Stadium findStadium(Long tournamentId, Long stadiumId) {
        return stadiums.findByTournament_TournamentIdAndStadiumId(tournamentId, stadiumId)
            .orElseThrow(() -> new EntityNotFoundException("Stadium not found in tournament: " + stadiumId));
    }

    private static EntityNotFoundException missingTournament(Long id) {
        return new EntityNotFoundException("Tournament not found: " + id);
    }

    private static VenueTravelTimeDTO toDto(VenueTravelTime row) {
        return new VenueTravelTimeDTO(row.getFromStadium().getStadiumId(), row.getToStadium().getStadiumId(),
            row.getTravelMinutes());
    }
}
