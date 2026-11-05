import { demoMatches, demoStadiums, demoTeams } from './demoData'

export const tournaments = [
  {
    id: 'tn-001',
    name: 'KLE Cricket Championship 2026',
    sport: 'Cricket',
    status: 'live',
    startDate: '2026-11-01',
    endDate: '2026-11-18',
    teams: demoTeams.length,
    matchesPlayed: demoMatches.filter((match) => match.status === 'Completed').length,
    totalMatches: demoTeams.length * (demoTeams.length - 1) / 2,
    prize: 'KLE Championship Trophy',
    format: 'T20 Round Robin',
    location: 'KLE University Ground',
    hostInstitution: 'KLE Technological University, Hubballi',
  },
  {
    id: 'tn-002',
    name: 'University Cricket League (One-Day)',
    sport: 'Cricket',
    status: 'upcoming',
    startDate: '2026-11-22',
    endDate: '2026-12-05',
    teams: 8,
    matchesPlayed: 0,
    totalMatches: 28,
    prize: 'Vice-Chancellor Shield',
    format: '50-Over Round Robin',
    location: 'University Oval',
  },
  {
    id: 'tn-003',
    name: 'Inter-Departmental Leather Ball Cup',
    sport: 'Cricket',
    status: 'completed',
    startDate: '2026-10-10',
    endDate: '2026-10-25',
    teams: 8,
    matchesPlayed: 28,
    totalMatches: 28,
    prize: 'Silver Jubilee Cup',
    format: 'T20 Knockout',
    location: 'Dharwad Sports Complex',
  },
  {
    id: 'tn-004',
    name: 'All-India Inter-University Zonal',
    sport: 'Cricket',
    status: 'upcoming',
    startDate: '2026-12-10',
    endDate: '2026-12-24',
    teams: 16,
    matchesPlayed: 0,
    totalMatches: 28,
    prize: 'AIU Gold Cup',
    format: 'Zonal Knockouts',
    location: 'Hubli Cricket Stadium',
  },
]

export const activeTournament = {
  id: 'crick-tn-2026-01',
  name: 'KLE Cricket Championship 2026',
  edition: 'Season 12',
  category: 'Inter-Collegiate T20',
  dates: 'Nov 01 – Nov 18, 2026',
  hostInstitution: 'KLE Technological University, Hubballi',
  venuesCount: demoStadiums.length,
}

export const tournamentOptions = tournaments.map((tournament) => ({
  id: tournament.id,
  name: tournament.name,
  badge: `${tournament.status === 'live' ? 'In progress' : tournament.status} · Cricket`,
}))

export const kpiMetrics = [
  { id: 'kpi-tournaments', label: 'Active Tournaments', value: '1', helper: 'KLE Cricket Championship 2026' },
  { id: 'kpi-teams', label: 'Registered Teams', value: String(demoTeams.length), helper: 'Four groups · two teams each' },
  { id: 'kpi-matches', label: 'League Fixtures', value: String(demoTeams.length * (demoTeams.length - 1) / 2), helper: 'Single round robin' },
  { id: 'kpi-scheduled', label: 'Sample Results', value: `${demoMatches.filter((match) => match.status === 'Completed').length}`, helper: 'Demo scores entered' },
]

export const upcomingFixtures = demoMatches.map((match) => ({
  id: match.id,
  matchNumber: `Match #${match.matchNumber}`,
  teamA: match.teamA,
  teamB: match.teamB,
  date: new Date(`${match.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }),
  time: `${match.time} IST`,
  stadium: match.stadium,
  pitch: match.pitch,
  officials: match.officials,
  status: match.status,
  statusVariant: match.status === 'Completed' ? 'success' : 'info',
  scoreA: match.scoreA,
  scoreB: match.scoreB,
}))

export const stadiumSummaries = demoStadiums.map((stadium) => ({
  ...stadium,
  statusVariant: stadium.availabilityStatus === 'maintenance' ? 'warning' : 'success',
  nextAvailable: stadium.availabilityStatus === 'maintenance' ? 'After 7 Nov' : 'Available',
}))

export const stadiums = stadiumSummaries
