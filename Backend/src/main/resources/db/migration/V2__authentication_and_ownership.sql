BEGIN;

CREATE TABLE app_user (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app_user_role (
    user_id BIGINT NOT NULL REFERENCES app_user(user_id),
    role VARCHAR(24) NOT NULL CHECK (role IN ('ADMIN', 'ORGANIZER', 'TEAM_MANAGER', 'VIEWER')),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE organizer_tournament_assignment (
    user_id BIGINT NOT NULL REFERENCES app_user(user_id),
    tournament_id BIGINT NOT NULL REFERENCES tournament(tournament_id),
    PRIMARY KEY (user_id, tournament_id)
);

CREATE TABLE team_manager_assignment (
    user_id BIGINT NOT NULL REFERENCES app_user(user_id),
    team_id BIGINT NOT NULL REFERENCES team(team_id),
    PRIMARY KEY (user_id, team_id)
);

CREATE INDEX idx_organizer_tournament_tournament ON organizer_tournament_assignment(tournament_id);
CREATE INDEX idx_team_manager_team ON team_manager_assignment(team_id);

COMMIT;
