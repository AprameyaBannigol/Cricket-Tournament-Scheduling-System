package com.example.backend.security;

import java.io.Serializable;
import java.util.Objects;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class TeamManagerAssignmentId implements Serializable {
    @Column(name = "user_id") private Long userId;
    @Column(name = "team_id") private Long teamId;

    protected TeamManagerAssignmentId() { }
    public TeamManagerAssignmentId(Long userId, Long teamId) { this.userId = userId; this.teamId = teamId; }
    @Override public boolean equals(Object other) {
        return this == other || other instanceof TeamManagerAssignmentId id
                && Objects.equals(userId, id.userId) && Objects.equals(teamId, id.teamId);
    }
    @Override public int hashCode() { return Objects.hash(userId, teamId); }
}
