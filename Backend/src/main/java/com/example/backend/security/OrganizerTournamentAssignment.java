package com.example.backend.security;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "organizer_tournament_assignment")
public class OrganizerTournamentAssignment {
    @EmbeddedId private OrganizerTournamentAssignmentId id;
    protected OrganizerTournamentAssignment() { }
    public OrganizerTournamentAssignment(OrganizerTournamentAssignmentId id) { this.id = id; }
}
