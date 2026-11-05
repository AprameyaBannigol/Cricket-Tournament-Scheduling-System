# Complete tournament scheduling API

`POST /api/schedule/generate` accepts explicit tournament, team, venue, official,
and availability data. It generates fixtures with the existing Circle Method,
allocates all matches in the Java backend, and independently validates the
result. `POST /api/schedule/fixtures` remains unchanged.

## Request

All availability windows are date-specific, local to `timeZone`, and use an
exclusive end time. Team and official availability must be supplied; missing
availability is not treated as unrestricted. Each official's `eligibleRounds`
is the set of fixture rounds they may officiate. When travel checks are enabled,
provide a directed travel-time entry for every pair of different stadiums.
These travel times are supplied inputs; E1 does not perform route estimation.

```json
{
  "tournamentId": 42,
  "tournamentName": "Summer Cup",
  "startDate": "2026-06-01",
  "endDate": "2026-06-02",
  "timeZone": "Asia/Kolkata",
  "teams": [
    {
      "id": 1,
      "name": "Falcons",
      "availability": [
        { "date": "2026-06-01", "startTime": "08:00:00", "endTime": "20:00:00" },
        { "date": "2026-06-02", "startTime": "08:00:00", "endTime": "20:00:00" }
      ]
    },
    {
      "id": 2,
      "name": "Tigers",
      "availability": [
        { "date": "2026-06-01", "startTime": "08:00:00", "endTime": "20:00:00" },
        { "date": "2026-06-02", "startTime": "08:00:00", "endTime": "20:00:00" }
      ]
    }
  ],
  "stadiums": [
    {
      "id": 10,
      "name": "Central Ground",
      "availability": [
        { "date": "2026-06-01", "startTime": "08:00:00", "endTime": "20:00:00" },
        { "date": "2026-06-02", "startTime": "08:00:00", "endTime": "20:00:00" }
      ],
      "supportedMatchDurationsMinutes": [180]
    }
  ],
  "officials": [
    {
      "id": 20,
      "name": "Official One",
      "availability": [
        { "date": "2026-06-01", "startTime": "08:00:00", "endTime": "20:00:00" },
        { "date": "2026-06-02", "startTime": "08:00:00", "endTime": "20:00:00" }
      ],
      "eligibleRounds": [1]
    }
  ],
  "matchDurationMinutes": 180,
  "availableTimeSlots": ["09:00:00", "14:00:00"],
  "bufferMinutes": 30,
  "officialsRequiredPerMatch": 1,
  "constraints": {
    "minimumRecoveryMinutes": 60,
    "travelConstraintEnabled": false,
    "minimumTravelMinutes": null,
    "venueTravelTimes": []
  }
}
```

## Response

Success returns HTTP 200 and `status: "SCHEDULE_GENERATED"`. `matches` contains
every fixture exactly once, with local start/end times and assigned resources.
Failure results contain no partial `matches`:

- `INVALID_INPUT`: HTTP 400
- `NO_FEASIBLE_SCHEDULE`: HTTP 422 after exhausting the candidate search
- `SEARCH_LIMIT_REACHED`: HTTP 503; the search was stopped before proving
  infeasibility

The response includes fixture count, search nodes, backtracks, candidate
assignments considered, elapsed milliseconds, validation summary, and conflicts.

## Successful backtracking example

The ready-to-use Postman JSON body is available at
[successful-backtracking-request.json](../src/test/resources/postman/successful-backtracking-request.json).
In Postman, create a `POST` request to
`http://localhost:8080/api/schedule/generate`, set `Content-Type` to
`application/json`, then paste that file's contents into **Body → raw → JSON**.

This three-team round robin has one fixture per round. Each round's assigned
official is only eligible for that round, so the search has no alternative
official candidates. The chronological first choice puts round 1 on November 10
at 10:00. Round 2 cannot use the same time because a team would be double-booked,
and its November 10 at 12:00 candidate overlaps the three-hour round 1 match.
The first feasible round 2 candidate is November 12 at 10:00. At that point,
round 3's November 10 and November 12 candidates conflict with rounds 1 and 2,
respectively, so the search backtracks. It then moves round 1 to November 11,
allowing rounds 2 and 3 to be assigned on November 10 and November 12.

With the configured default search limits, the expected response is HTTP 200,
`status: "SCHEDULE_GENERATED"`, `totalFixtures: 3`,
`scheduledMatches: 3`, `backtracks` greater than zero, and an empty `conflicts`
array. The resulting round start dates are November 11 for round 1, November 10
for round 2, and November 12 for round 3. With the current deterministic
candidate preference order, their start times are 10:00, 12:00, and 10:00,
respectively (Asia/Kolkata). The
integration test submits this same JSON resource to the endpoint and asserts
these response properties; fixture order within each round does not affect the
expectations.

## Search configuration

The limits can be overridden with Spring properties or environment variables:

| Property | Default |
|---|---:|
| `scheduling.search.maximum-search-nodes` | 100000 |
| `scheduling.search.maximum-duration-millis` | 10000 |
| `scheduling.search.maximum-candidate-assignments` | 500000 |
| `scheduling.search.maximum-generated-candidates` | 1000000 |
