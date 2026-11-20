ALTER TABLE match_result
    ADD COLUMN fixture_id BIGINT;

UPDATE match_result result
SET fixture_id = scheduled_match.fixture_id
FROM "match" scheduled_match
WHERE result.match_id = scheduled_match.match_id
  AND result.fixture_id IS NULL;

ALTER TABLE match_result
    ADD CONSTRAINT fk_match_result_fixture
    FOREIGN KEY (fixture_id) REFERENCES fixture (fixture_id);

CREATE UNIQUE INDEX uq_match_result_fixture
    ON match_result (fixture_id)
    WHERE fixture_id IS NOT NULL;

ALTER TABLE match_result
    ADD COLUMN team1_wickets INTEGER,
    ADD COLUMN team2_wickets INTEGER,
    ADD COLUMN winning_margin INTEGER,
    ADD COLUMN remarks VARCHAR(1000);

ALTER TABLE match_result
    ALTER COLUMN match_id DROP NOT NULL;
