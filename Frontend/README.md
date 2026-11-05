# Cricket Tournament Scheduling System

TournamentHub is a React and Vite frontend for organizing cricket tournaments, teams, venues, officials, fixtures and standings.

## Frontend demonstration

The React/Vite frontend includes a public landing page, tournament setup, tournament and resource management, schedule views, match results, standings, schedule history, and a sample conflict-resolution workflow.

The cricket demo dataset is shared through React context and saved in browser `localStorage`. Organizers can create tournaments, manage teams, grounds and officials, save availability and scheduling preferences, generate round-robin fixtures, enter scores, and restore schedule versions. The initial KLE Cricket Championship includes eight teams, four grounds, four officials, a full 28-match round robin, sample results, and seeded conflicts.

This is a frontend demonstration, not a live service. Fixture assignments and conflict examples are local samples; backend scheduling, availability validation, authentication, and server-side persistence are not connected.

Run `npm run dev` to start the frontend and `npm run build` to create a production bundle.
