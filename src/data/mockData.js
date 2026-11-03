/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Cricket Operations Mock Data
 * ══════════════════════════════════════════════════════════════
 *  Consistent collegiate cricket data for demonstration.
 */

export const activeTournament = {
  id: 'crick-tn-2026-01',
  name: 'KLE Cricket Championship 2026',
  edition: 'Season 12',
  category: 'Inter-Collegiate T20',
  dates: 'Nov 01 – Nov 18, 2026',
  hostInstitution: 'KLE Technological University, Hubballi',
  venuesCount: 4,
}

export const tournamentOptions = [
  { id: 'crick-tn-2026-01', name: 'KLE Cricket Championship 2026', badge: 'Active · T20' },
  { id: 'crick-tn-2026-02', name: 'University Cricket League (One-Day)', badge: 'Drafting' },
  { id: 'crick-tn-2026-03', name: 'Inter-Departmental Leather Ball Cup', badge: 'Upcoming' },
  { id: 'crick-tn-2025-04', name: 'All-India Inter-University Zonal', badge: 'Archived' },
]

export const kpiMetrics = [
  {
    id: 'kpi-tournaments',
    label: 'Active Tournaments',
    value: '4',
    helper: '2 collegiate, 2 regional',
  },
  {
    id: 'kpi-teams',
    label: 'Total Teams',
    value: '32',
    helper: '4 pools registered',
  },
  {
    id: 'kpi-matches',
    label: 'Total Matches',
    value: '76',
    helper: 'Across 4 stadiums',
  },
  {
    id: 'kpi-scheduled',
    label: 'Scheduled Matches',
    value: '68 / 76',
    helper: '89% allocated (8 pending)',
  },
]

// 4 Clean, consistent upcoming cricket fixtures (no fake score tickers)
export const upcomingFixtures = [
  {
    id: 'mt-15',
    matchNumber: 'Match #15',
    teamA: 'KLE Titans XI',
    teamB: 'City Warriors CC',
    date: 'Today, 03 Nov 2026',
    time: '14:30 IST',
    stadium: 'Main Cricket Ground',
    pitch: 'Center Turf Track',
    status: 'Scheduled',
    statusVariant: 'success',
  },
  {
    id: 'mt-16',
    matchNumber: 'Match #16',
    teamA: 'Engineering Strikers',
    teamB: 'Dharwad Lions XI',
    date: 'Today, 03 Nov 2026',
    time: '18:30 IST',
    stadium: 'University Oval Arena',
    pitch: 'Bermuda Grass',
    status: 'Scheduled',
    statusVariant: 'success',
  },
  {
    id: 'mt-17',
    matchNumber: 'Match #17',
    teamA: 'CS Cyber Knights',
    teamB: 'Campus Panthers',
    date: 'Tomorrow, 04 Nov 2026',
    time: '09:30 IST',
    stadium: 'Sir MV Memorial Ground',
    pitch: 'Natural Turf',
    status: 'Scheduled',
    statusVariant: 'success',
  },
  {
    id: 'mt-18',
    matchNumber: 'Match #18',
    teamA: 'Vidyanagar Blasters',
    teamB: 'Tech Gladiators XI',
    date: 'Tomorrow, 04 Nov 2026',
    time: '14:00 IST',
    stadium: 'North Campus Oval',
    pitch: 'Practice Turf',
    status: 'Pitch Inspection',
    statusVariant: 'warning',
  },
]

// 4 Clean Stadium overview summaries
export const stadiumSummaries = [
  {
    id: 'std-1',
    name: 'Main Cricket Ground',
    type: 'Pavilion Turf (BCCI Standard)',
    capacity: '12,000',
    floodlights: true,
    status: 'Occupied',
    statusVariant: 'warning',
    nextAvailable: '18:00 IST Today',
  },
  {
    id: 'std-2',
    name: 'University Oval Arena',
    type: 'Bermuda Grass Turf',
    capacity: '6,500',
    floodlights: true,
    status: 'Available',
    statusVariant: 'success',
    nextAvailable: 'Immediate',
  },
  {
    id: 'std-3',
    name: 'Sir MV Memorial Ground',
    type: 'Clay & Loam Natural Track',
    capacity: '4,200',
    floodlights: false,
    status: 'Maintenance',
    statusVariant: 'neutral',
    nextAvailable: 'Tomorrow 08:00 IST',
  },
  {
    id: 'std-4',
    name: 'North Campus Oval',
    type: 'Multi-use Cricket Ground',
    capacity: '3,000',
    floodlights: false,
    status: 'Available',
    statusVariant: 'success',
    nextAvailable: 'Immediate',
  },
]

// Compatibility export
export const stadiums = stadiumSummaries

export const tournaments = [
  {
    id: 'tn-001',
    name: 'KLE Cricket Championship 2026',
    sport: 'Cricket',
    status: 'live',
    startDate: '2026-11-01',
    endDate: '2026-11-18',
    teams: 16,
    matchesPlayed: 14,
    totalMatches: 31,
    prize: 'Championship Trophy',
    format: 'T20 Group Stage + Knockouts',
    location: 'Main Cricket Ground',
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
    totalMatches: 15,
    prize: 'Vice-Chancellor Shield',
    format: '50-Over Round Robin',
    location: 'University Oval Arena',
  },
  {
    id: 'tn-003',
    name: 'Inter-Departmental Leather Ball Cup',
    sport: 'Cricket',
    status: 'completed',
    startDate: '2026-10-10',
    endDate: '2026-10-25',
    teams: 12,
    matchesPlayed: 23,
    totalMatches: 23,
    prize: 'Silver Jubilee Cup',
    format: 'T20 Knockout',
    location: 'Sir MV Memorial Ground',
  },
  {
    id: 'tn-004',
    name: 'All-India Inter-University Zonal',
    sport: 'Cricket',
    status: 'upcoming',
    startDate: '2026-12-10',
    endDate: '2026-12-24',
    teams: 24,
    matchesPlayed: 0,
    totalMatches: 45,
    prize: 'AIU Gold Cup',
    format: 'Zonal Knockouts',
    location: 'MCG & University Oval',
  },
]
