# Cricket Tournament Scheduling System

TournamentHub is the React and Vite frontend for CricCraft.

## Live tournament workspace

Run `npm run dev` and open `http://localhost:5174`. Vite forwards `/api` to Spring Boot on `http://127.0.0.1:8080`. Start the backend with its PostgreSQL connection configured. A production host should serve the SPA with a history fallback and forward same-origin `/api` requests to Spring Boot.

The live workspace lists, creates, opens, and edits tournaments. The create wizard sends its selected format in the backend's `category` field. The editor carries the current status forward when saving. Resource counts are unavailable from the tournament list API.

Open a tournament to manage its teams, stadiums, and officials. Each page lists, registers, and edits records for the selected tournament. Availability windows, blackout dates, and official match counts can be explored in Demo Mode.

## Demo workspace

Use **Demo mode** in the navigation or open `/demo`. Demo data and changes are saved in this browser. The sample workspace includes the tournament and resource management demo, setup preferences, allocation, fixtures, conflict resolution, results, standings, versions, and analytics. The demo does not call the tournament API.

Run `npm run build` to create the production bundle.
