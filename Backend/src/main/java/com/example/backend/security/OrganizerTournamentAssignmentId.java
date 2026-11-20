package com.example.backend.security;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class OrganizerTournamentAssignmentId implements Serializable {
    @Column(name = "user_id") private Long userId;
    @Column(name = "tournament_id") private Long tournamentId;

    protected OrganizerTournamentAssignmentId() { }
    public OrganizerTournamentAssignmentId(Long userId, Long tournamentId) { this.userId = userId; this.tournamentId = tournamentId; }
    @Override public boolean equals(Object other) {
        return this == other || other instanceof OrganizerTournamentAssignmentId id
                && Objects.equals(userId, id.userId) && Objects.equals(tournamentId, id.tournamentId);
    }
    @Override public int hashCode() { return Objects.hash(userId, tournamentId); }
}
