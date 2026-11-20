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
    name = "match_result",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_match_result_match",
        columnNames = "match_id"
    )
)
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "result_id")
    private Long resultId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fixture_id", nullable = false)
    private Fixture fixture;

    @Column(name = "team1_wickets")
    private Integer team1Wickets;

    @Column(name = "team2_wickets")
    private Integer team2Wickets;

    @Column(name = "winning_margin")
    private Integer winningMargin;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Column(name = "team1_score", nullable = false)
    private Integer team1Score;

    @Column(name = "team1_overs", nullable = false)
    private BigDecimal team1Overs;

    @Column(name = "team2_score", nullable = false)
    private Integer team2Score;

    @Column(name = "team2_overs", nullable = false)
    private BigDecimal team2Overs;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_team_id")
    private Team winnerTeam;

    @Column(name = "result_type", nullable = false)
    private String resultType;

    public MatchResult() {
    }

    public Long getResultId() {
        return resultId;
    }

    public void setResultId(Long resultId) {
        this.resultId = resultId;
    }

    public Fixture getFixture() { return fixture; }
    public void setFixture(Fixture fixture) { this.fixture = fixture; }
    public Integer getTeam1Wickets() { return team1Wickets; }
    public void setTeam1Wickets(Integer value) { team1Wickets = value; }
    public Integer getTeam2Wickets() { return team2Wickets; }
    public void setTeam2Wickets(Integer value) { team2Wickets = value; }
    public Integer getWinningMargin() { return winningMargin; }
    public void setWinningMargin(Integer value) { winningMargin = value; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String value) { remarks = value; }

    public Match getMatch() {
        return match;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public Integer getTeam1Score() {
        return team1Score;
    }

    public void setTeam1Score(Integer team1Score) {
        this.team1Score = team1Score;
    }

    public BigDecimal getTeam1Overs() {
        return team1Overs;
    }

    public void setTeam1Overs(BigDecimal team1Overs) {
        this.team1Overs = team1Overs;
    }

    public Integer getTeam2Score() {
        return team2Score;
    }

    public void setTeam2Score(Integer team2Score) {
        this.team2Score = team2Score;
    }

    public BigDecimal getTeam2Overs() {
        return team2Overs;
    }

    public void setTeam2Overs(BigDecimal team2Overs) {
        this.team2Overs = team2Overs;
    }

    public Team getWinnerTeam() {
        return winnerTeam;
    }

    public void setWinnerTeam(Team winnerTeam) {
        this.winnerTeam = winnerTeam;
    }

    public String getResultType() {
        return resultType;
    }

    public void setResultType(String resultType) {
        this.resultType = resultType;
    }
}
