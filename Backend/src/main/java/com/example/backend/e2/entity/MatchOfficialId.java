package com.example.backend.e2.entity;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class MatchOfficialId implements Serializable {

    private static final long serialVersionUID = 1L;

    @Column(name = "match_id")
    private Long matchId;

    @Column(name = "official_id")
    private Long officialId;

    public MatchOfficialId() {
    }

    public MatchOfficialId(Long matchId, Long officialId) {
        this.matchId = matchId;
        this.officialId = officialId;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public Long getOfficialId() {
        return officialId;
    }

    public void setOfficialId(Long officialId) {
        this.officialId = officialId;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof MatchOfficialId that)) {
            return false;
        }
        return Objects.equals(matchId, that.matchId)
            && Objects.equals(officialId, that.officialId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(matchId, officialId);
    }
}
