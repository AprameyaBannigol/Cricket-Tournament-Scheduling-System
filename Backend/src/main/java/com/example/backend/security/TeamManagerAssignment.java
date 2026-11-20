package com.example.backend.security;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_manager_assignment")
public class TeamManagerAssignment {
    @EmbeddedId private TeamManagerAssignmentId id;
    protected TeamManagerAssignment() { }
    public TeamManagerAssignment(TeamManagerAssignmentId id) { this.id = id; }
}
