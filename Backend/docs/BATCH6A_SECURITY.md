# Batch 6A security deployment

## Database migration

`src/main/resources/db/migration/V2__authentication_and_ownership.sql` is additive and transaction-wrapped. It creates account, role, organizer-to-tournament, and team-manager-to-team tables. It does not update tournament, schedule, fixture, or result rows. Apply it once to the existing database with the normal database operator account before starting the new application build:

```sh
psql "$CRICCRAFT_DATABASE_URL" -v ON_ERROR_STOP=1 -f src/main/resources/db/migration/V2__authentication_and_ownership.sql
```

Keep `spring.jpa.hibernate.ddl-auto=validate`; Hibernate must not create or change production tables. The current repository does not have an automated Flyway/Liquibase runner, so this migration is intentionally a reviewed/manual deployment step. Supply `SPRING_DATASOURCE_URL`, `DB_USERNAME` and `DB_PASSWORD` through the deployment secret/configuration environment; the application no longer embeds a database URL.

## Initial administrator

Provision the first administrator through environment variables for the first startup after migration. Use a unique, managed secret of at least 12 characters; do not put it in source control or a checked-in `.env` file.

```sh
export SPRING_DATASOURCE_URL='<configured PostgreSQL JDBC URL>'
export DB_USERNAME='...'
export DB_PASSWORD='...'
export BOOTSTRAP_ADMIN_EMAIL='admin@example.org'
export BOOTSTRAP_ADMIN_PASSWORD='...'
```

The startup provisioner stores only a BCrypt hash and creates an administrator only when there is no existing ADMIN and the supplied email is unused. It does not log the credentials. Remove `BOOTSTRAP_ADMIN_PASSWORD` from the process environment after provisioning. If the bootstrap variables are absent, no account is created and there is no default password. Additional accounts and resource assignments are managed by an authenticated ADMIN through `/api/admin/accounts` endpoints.

For the React development server, `FRONTEND_ORIGIN` defaults to `http://localhost:5174`. Set it to the exact production frontend origin. Set `SESSION_COOKIE_SECURE=true` behind HTTPS; keep it false only for local HTTP development. Browser sessions use HTTP-only, SameSite=Lax cookies, and mutating requests require the XSRF-TOKEN cookie/header pair.

## Existing tournaments

The migration deliberately leaves existing tournaments unassigned. An administrator can create an ORGANIZER account and assign its user ID to an existing tournament through the Admin Dashboard or `POST /api/admin/accounts/organizer-assignment`. Team ownership is similarly assigned through the dashboard or `POST /api/admin/accounts/team-manager-assignment`. No ownership is inferred from tournament names or existing data.

## API

- `GET /api/auth/csrf` — issue/read the CSRF token.
- `POST /api/auth/login` — authenticate email/password and create a session.
- `POST /api/auth/logout` — invalidate the session.
- `GET /api/auth/me` — current account and roles, or 401.
- `GET /api/admin/dashboard` — ADMIN-only totals, role counts, account status, and ownership assignments.
- `GET /api/organizer/dashboard` — ORGANIZER-only assigned-tournament status and readiness; ADMIN can view all tournaments.
- `POST /api/admin/accounts` — create a user with one or more of ADMIN, ORGANIZER, TEAM_MANAGER, VIEWER.
- `PUT /api/admin/accounts/{userId}/roles` — replace an account's roles; the final ADMIN account cannot be demoted.
- `POST /api/admin/accounts/organizer-assignment` — associate organizer and tournament.
- `POST /api/admin/accounts/team-manager-assignment` — associate team manager and team.

The React ADMIN dashboard is available at `/admin`. It reads the dashboard data and existing tournament/team GET APIs. Account creation, role replacement, and assignment changes use the session cookie and CSRF token; dashboard responses never include password hashes. Batch 6B-1 adds no database migration.

The React organizer dashboard is available at `/organizer`. Organizer accounts receive only their assigned tournaments from the tournament list and are denied organizer management-resource reads for unassigned tournament IDs. Dashboard scheduling readiness and completion values come from the existing scheduling and statistics services. Batch 6B-2 adds no database migration.

Public tournament, saved schedule, fixture/result, standings and analytics GET routes remain read-only. All mutations require a session. Tournament configuration/schedule/stadium/official changes require ADMIN or the assigned ORGANIZER; a team manager can update only an assigned team and save a result only for a fixture involving that assigned team. Account provisioning is ADMIN-only.
