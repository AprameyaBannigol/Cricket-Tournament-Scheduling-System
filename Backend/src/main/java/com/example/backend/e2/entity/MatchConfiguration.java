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
    name = "match_configuration",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_match_configuration_tournament",
        columnNames = "tournament_id"
    )
)
public class MatchConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "configuration_id")
    private Long configurationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "match_format", nullable = false)
    private String matchFormat;

    @Column(name = "overs_per_innings", nullable = false)
    private Integer oversPerInnings;

    @Column(name = "max_bowler_overs", nullable = false)
    private Integer maxBowlerOvers;

    @Column(name = "powerplay_overs")
    private Integer powerplayOvers;

    @Column(name = "innings_break_minutes", nullable = false)
    private Integer inningsBreakMinutes = 15;

    @Column(name = "match_duration_minutes", nullable = false)
    private Integer matchDurationMinutes;

    @Column(name = "min_overs_for_dls")
    private Integer minOversForDls;

    @Column(name = "points_for_win", nullable = false)
    private BigDecimal pointsForWin = BigDecimal.valueOf(2);

    @Column(name = "points_for_tie", nullable = false)
    private BigDecimal pointsForTie = BigDecimal.ONE;

    @Column(name = "points_for_loss", nullable = false)
    private BigDecimal pointsForLoss = BigDecimal.ZERO;

    @Column(name = "super_over_enabled", nullable = false)
    private Boolean superOverEnabled = true;

    public MatchConfiguration() {
    }

    public Long getConfigurationId() {
        return configurationId;
    }

    public void setConfigurationId(Long configurationId) {
        this.configurationId = configurationId;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public String getMatchFormat() {
        return matchFormat;
    }

    public void setMatchFormat(String matchFormat) {
        this.matchFormat = matchFormat;
    }

    public Integer getOversPerInnings() {
        return oversPerInnings;
    }

    public void setOversPerInnings(Integer oversPerInnings) {
        this.oversPerInnings = oversPerInnings;
    }

    public Integer getMaxBowlerOvers() {
        return maxBowlerOvers;
    }

    public void setMaxBowlerOvers(Integer maxBowlerOvers) {
        this.maxBowlerOvers = maxBowlerOvers;
    }

    public Integer getPowerplayOvers() {
        return powerplayOvers;
    }

    public void setPowerplayOvers(Integer powerplayOvers) {
        this.powerplayOvers = powerplayOvers;
    }

    public Integer getInningsBreakMinutes() {
        return inningsBreakMinutes;
    }

    public void setInningsBreakMinutes(Integer inningsBreakMinutes) {
        this.inningsBreakMinutes = inningsBreakMinutes;
    }

    public Integer getMatchDurationMinutes() {
        return matchDurationMinutes;
    }

    public void setMatchDurationMinutes(Integer matchDurationMinutes) {
        this.matchDurationMinutes = matchDurationMinutes;
    }

    public Integer getMinOversForDls() {
        return minOversForDls;
    }

    public void setMinOversForDls(Integer minOversForDls) {
        this.minOversForDls = minOversForDls;
    }

    public BigDecimal getPointsForWin() {
        return pointsForWin;
    }

    public void setPointsForWin(BigDecimal pointsForWin) {
        this.pointsForWin = pointsForWin;
    }

    public BigDecimal getPointsForTie() {
        return pointsForTie;
    }

    public void setPointsForTie(BigDecimal pointsForTie) {
        this.pointsForTie = pointsForTie;
    }

    public BigDecimal getPointsForLoss() {
        return pointsForLoss;
    }

    public void setPointsForLoss(BigDecimal pointsForLoss) {
        this.pointsForLoss = pointsForLoss;
    }

    public Boolean getSuperOverEnabled() {
        return superOverEnabled;
    }

    public void setSuperOverEnabled(Boolean superOverEnabled) {
        this.superOverEnabled = superOverEnabled;
    }
}
