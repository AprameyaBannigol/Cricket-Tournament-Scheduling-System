package com.example.backend.e2.entity;

import java.math.BigDecimal;

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
    name = "scheduling_constraints",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_scheduling_constraints_tournament",
        columnNames = "tournament_id"
    )
)
public class SchedulingConstraints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "constraint_id")
    private Long constraintId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "minimum_recovery_minutes", nullable = false)
    private Integer minimumRecoveryMinutes = 720;

    @Column(name = "max_matches_per_team_per_day", nullable = false)
    private Integer maxMatchesPerTeamPerDay = 1;

    @Column(name = "max_matches_per_stadium_per_day", nullable = false)
    private Integer maxMatchesPerStadiumPerDay = 3;

    @Column(name = "travel_constraint_enabled", nullable = false)
    private Boolean travelConstraintEnabled = true;

    @Column(name = "minimum_travel_minutes", nullable = false)
    private Integer minimumTravelMinutes = 60;

    @Column(name = "travel_buffer_hours", nullable = false)
    private BigDecimal travelBufferHours = BigDecimal.ONE;

    @Column(name = "avoid_ground_blackouts", nullable = false)
    private Boolean avoidGroundBlackouts = true;

    @Column(name = "avoid_official_blackouts", nullable = false)
    private Boolean avoidOfficialBlackouts = true;

    @Column(name = "night_to_morning_restriction", nullable = false)
    private Boolean nightToMorningRestriction = true;

    @Column(name = "reserve_day_enforced", nullable = false)
    private Boolean reserveDayEnforced = false;

    public SchedulingConstraints() {
    }

    public Long getConstraintId() {
        return constraintId;
    }

    public void setConstraintId(Long constraintId) {
        this.constraintId = constraintId;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public Integer getMinimumRecoveryMinutes() {
        return minimumRecoveryMinutes;
    }

    public void setMinimumRecoveryMinutes(Integer minimumRecoveryMinutes) {
        this.minimumRecoveryMinutes = minimumRecoveryMinutes;
    }

    public Integer getMaxMatchesPerTeamPerDay() {
        return maxMatchesPerTeamPerDay;
    }

    public void setMaxMatchesPerTeamPerDay(Integer maxMatchesPerTeamPerDay) {
        this.maxMatchesPerTeamPerDay = maxMatchesPerTeamPerDay;
    }

    public Integer getMaxMatchesPerStadiumPerDay() {
        return maxMatchesPerStadiumPerDay;
    }

    public void setMaxMatchesPerStadiumPerDay(Integer maxMatchesPerStadiumPerDay) {
        this.maxMatchesPerStadiumPerDay = maxMatchesPerStadiumPerDay;
    }

    public Boolean getTravelConstraintEnabled() {
        return travelConstraintEnabled;
    }

    public void setTravelConstraintEnabled(Boolean travelConstraintEnabled) {
        this.travelConstraintEnabled = travelConstraintEnabled;
    }

    public Integer getMinimumTravelMinutes() {
        return minimumTravelMinutes;
    }

    public void setMinimumTravelMinutes(Integer minimumTravelMinutes) {
        this.minimumTravelMinutes = minimumTravelMinutes;
    }

    public BigDecimal getTravelBufferHours() {
        return travelBufferHours;
    }

    public void setTravelBufferHours(BigDecimal travelBufferHours) {
        this.travelBufferHours = travelBufferHours;
    }

    public Boolean getAvoidGroundBlackouts() {
        return avoidGroundBlackouts;
    }

    public void setAvoidGroundBlackouts(Boolean avoidGroundBlackouts) {
        this.avoidGroundBlackouts = avoidGroundBlackouts;
    }

    public Boolean getAvoidOfficialBlackouts() {
        return avoidOfficialBlackouts;
    }

    public void setAvoidOfficialBlackouts(Boolean avoidOfficialBlackouts) {
        this.avoidOfficialBlackouts = avoidOfficialBlackouts;
    }

    public Boolean getNightToMorningRestriction() {
        return nightToMorningRestriction;
    }

    public void setNightToMorningRestriction(Boolean nightToMorningRestriction) {
        this.nightToMorningRestriction = nightToMorningRestriction;
    }

    public Boolean getReserveDayEnforced() {
        return reserveDayEnforced;
    }

    public void setReserveDayEnforced(Boolean reserveDayEnforced) {
        this.reserveDayEnforced = reserveDayEnforced;
    }
}
