# Engine 1 / Engine 2 Integration Contract

## Engine 1 boundary

Engine 1 receives a validated tournament payload, generates single round-robin
fixtures using the Circle Method, and returns candidate pairings. It has no
database, persistence, transaction, date-assignment, stadium-assignment, or
timetable-optimization responsibilities.

## HTTP contract

Engine 2 (or Engine 4 coordinating the engines) sends:

```http
POST /api/schedule/fixtures
Content-Type: application/json
```

```json
{
  "tournamentId": 42,
  "teams": [
    { "id": 10, "name": "Falcons" },
    { "id": 11, "name": "Tigers" },
    { "id": 12, "name": "Owls" }
  ]
}
```

The request is required to contain a positive tournament ID and at least two
teams with unique positive IDs and nonblank names. Engine 1 performs these
basic contract checks; Engine 2 remains responsible for validating tournament
master data and constraints.

Successful response:

```json
{
  "tournamentId": 42,
  "status": "FIXTURES_GENERATED",
  "fixtures": [
    {
      "round": 1,
      "matchNumber": 1,
      "team1Id": 10,
      "team1": "Falcons",
      "team2Id": 12,
      "team2": "Owls"
    }
  ]
}
```

Invalid request data returns HTTP 400. The result is a candidate fixture list,
not a validated or persisted schedule. Engine 1 does not assign dates, slots,
stadiums, officials, or recovery/travel constraints.

## Engine 2 responsibilities not implemented here

Engine 2 must expose validated tournament/team data to the caller, validate
candidate fixtures and constraints (including E3 resource availability),
persist accepted schedules, and manage schedule versions. The existing
tournament/team/stadium/time-slot/availability CRUD routes have been removed
from Engine 1 and must be provided by the owning engine or another approved
application boundary. No Engine 2 client or implementation is included in
this project, so integration is limited to the defined HTTP contract.
