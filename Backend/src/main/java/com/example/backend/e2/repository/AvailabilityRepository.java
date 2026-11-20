package com.example.backend.e2.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.Availability;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

    List<Availability> findAllByTeam_TeamIdIn(Collection<Long> teamIds);

    List<Availability> findAllByStadium_StadiumIdIn(Collection<Long> stadiumIds);

    List<Availability> findAllByOfficial_OfficialIdIn(Collection<Long> officialIds);
}
