package com.example.backend.e2.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "venue_travel_time",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_venue_travel_pair",
        columnNames = {"from_stadium_id", "to_stadium_id"}
    )
)
public class VenueTravelTime {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "travel_id")
    private Long travelId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "from_stadium_id", nullable = false)
    private Stadium fromStadium;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "to_stadium_id", nullable = false)
    private Stadium toStadium;

    @Column(name = "travel_minutes", nullable = false)
    private Integer travelMinutes;

    public VenueTravelTime() {
    }

    public Long getTravelId() {
        return travelId;
    }

    public void setTravelId(Long travelId) {
        this.travelId = travelId;
    }

    public Stadium getFromStadium() {
        return fromStadium;
    }

    public void setFromStadium(Stadium fromStadium) {
        this.fromStadium = fromStadium;
    }

    public Stadium getToStadium() {
        return toStadium;
    }

    public void setToStadium(Stadium toStadium) {
        this.toStadium = toStadium;
    }

    public Integer getTravelMinutes() {
        return travelMinutes;
    }

    public void setTravelMinutes(Integer travelMinutes) {
        this.travelMinutes = travelMinutes;
    }
}
