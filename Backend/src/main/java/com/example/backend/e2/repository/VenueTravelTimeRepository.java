package com.example.backend.e2.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.e2.entity.VenueTravelTime;

public interface VenueTravelTimeRepository extends JpaRepository<VenueTravelTime, Long> {

    Optional<VenueTravelTime> findByFromStadium_StadiumIdAndToStadium_StadiumId(Long fromId, Long toId);

    List<VenueTravelTime> findAllByFromStadium_StadiumIdIn(Collection<Long> stadiumIds);
}
