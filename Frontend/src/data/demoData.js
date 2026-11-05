export const demoTeams = [
  { id: 'team-kle', tournamentId: 'tn-001', name: 'KLE Titans XI', college: 'KLE Technological University', department: 'Main Campus XI', captain: 'Aditya Kulkarni', coach: 'P. M. Nadiger', squadSize: 15, pool: 'Pool A', status: 'Verified' },
  { id: 'team-city', tournamentId: 'tn-001', name: 'City Warriors CC', college: 'Hubballi Sports Academy', department: 'Club XI', captain: 'Rohan Deshpande', coach: 'K. S. Patil', squadSize: 15, pool: 'Pool A', status: 'Verified' },
  { id: 'team-engineering', tournamentId: 'tn-001', name: 'Engineering Strikers', college: 'KLE Technological University', department: 'Engineering XI', captain: 'Sameer Joshi', coach: 'V. B. Hegde', squadSize: 15, pool: 'Pool B', status: 'Verified' },
  { id: 'team-dharwad', tournamentId: 'tn-001', name: 'Dharwad Lions XI', college: 'Government Engineering College, Dharwad', department: 'College XI', captain: 'Praveen Shetty', coach: 'R. M. Hiremath', squadSize: 14, pool: 'Pool B', status: 'Verified' },
  { id: 'team-cyber', tournamentId: 'tn-001', name: 'CS Cyber Knights', college: 'KLE Technological University', department: 'Computer Science XI', captain: 'Nikhil Rao', coach: 'G. K. Hiremath', squadSize: 15, pool: 'Pool C', status: 'Verified' },
  { id: 'team-hubli', tournamentId: 'tn-001', name: 'Hubli Super Kings', college: 'Hubli Cricket Association', department: 'Senior XI', captain: 'Vikram Hegde', coach: 'S. B. Patil', squadSize: 15, pool: 'Pool C', status: 'Verified' },
  { id: 'team-belgaum', tournamentId: 'tn-001', name: 'Belgaum Blasters', college: 'Belgaum District Cricket Association', department: 'Premier XI', captain: 'Akshay Naik', coach: 'M. R. Kulkarni', squadSize: 15, pool: 'Pool D', status: 'Verified' },
  { id: 'team-north', tournamentId: 'tn-001', name: 'North Karnataka XI', college: 'North Karnataka Cricket Academy', department: 'Academy XI', captain: 'Siddharth Rao', coach: 'A. S. Desai', squadSize: 14, pool: 'Pool D', status: 'Verified' },
]

export const demoStadiums = [
  { id: 'ground-kle', name: 'KLE University Ground', shortName: 'KLE Ground', type: 'Natural Turf', capacity: '8,000', floodlights: true, pitches: 2, curator: 'Basavaraj Kori', availabilityStatus: 'available', status: 'Available', availability: '09:00–20:00', blackoutDates: '2026-11-07' },
  { id: 'ground-hubli', name: 'Hubli Cricket Stadium', shortName: 'Hubli Stadium', type: 'Pavilion Turf', capacity: '15,000', floodlights: true, pitches: 3, curator: 'R. G. Patil', availabilityStatus: 'available', status: 'Available', availability: '09:00–22:00', blackoutDates: '' },
  { id: 'ground-oval', name: 'University Oval', shortName: 'University Oval', type: 'Bermuda Grass Turf', capacity: '5,500', floodlights: true, pitches: 1, curator: 'Mahesh Bhat', availabilityStatus: 'available', status: 'Available', availability: '09:00–19:00', blackoutDates: '' },
  { id: 'ground-dharwad', name: 'Dharwad Sports Complex', shortName: 'Dharwad Complex', type: 'Red Soil Turf', capacity: '4,200', floodlights: false, pitches: 2, curator: 'S. M. Joshi', availabilityStatus: 'maintenance', status: 'Maintenance · 7 Nov', availability: '09:00–17:00', blackoutDates: '2026-11-07' },
]

export const demoOfficials = [
  { id: 'official-rahul', name: 'Rahul Desai', role: 'On-field Umpire', cert: 'BCCI Level 2', available: true, matches: 4, blackoutDates: '' },
  { id: 'official-pranav', name: 'Pranav Kulkarni', role: 'On-field Umpire', cert: 'State Panel', available: true, matches: 3, blackoutDates: '' },
  { id: 'official-akash', name: 'Akash Patil', role: 'Third Umpire', cert: 'BCCI Level 1', available: true, matches: 2, blackoutDates: '2026-11-03' },
  { id: 'official-sandeep', name: 'Sandeep Rao', role: 'Match Referee', cert: 'State Panel', available: true, matches: 5, blackoutDates: '' },
]

export const demoAvailability = {
  startDate: '2026-11-01',
  endDate: '2026-11-18',
  morningStart: '09:30',
  morningEnd: '13:00',
  afternoonStart: '14:30',
  afternoonEnd: '17:30',
  nightStart: '18:30',
  nightEnd: '22:00',
  matchDurationHours: 4,
  teamRecoveryHours: 24,
  weeklyRestDay: 'Friday',
  reserveDay: '2026-11-19',
  pitchRestHours: 24,
}

export const demoConstraints = {
  maxMatchesPerTeamPerDay: 1,
  minimumRecoveryHours: 24,
  preferFloodlitGroundsForEvening: true,
  avoidGroundBlackouts: true,
  avoidOfficialBlackouts: true,
  travelBufferHours: 3,
}

function addDemoDays(date, count) {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + count)
  return next.toISOString().slice(0, 10)
}

function buildDemoMatches() {
  const rotation = [
    demoTeams[0],
    demoTeams[2],
    demoTeams[4],
    demoTeams[6],
    demoTeams[7],
    demoTeams[5],
    demoTeams[3],
    demoTeams[1],
  ]
  const matches = []
  let date = '2026-11-03'
  let matchNumber = 1

  for (let roundIndex = 0; roundIndex < rotation.length - 1; roundIndex += 1) {
    while (new Date(`${date}T00:00:00Z`).getUTCDay() === 5) date = addDemoDays(date, 1)
    for (let gameIndex = 0; gameIndex < rotation.length / 2; gameIndex += 1) {
      const teamA = rotation[gameIndex]
      const teamB = rotation[rotation.length - 1 - gameIndex]
      const stadiumIndex = roundIndex === 0 && gameIndex < 2 ? 0 : gameIndex
      const stadium = demoStadiums[stadiumIndex]
      const officialIndex = (roundIndex + gameIndex * 2) % demoOfficials.length
      const isFirstResult = matchNumber === 1
      const isSecondResult = matchNumber === 3
      matches.push({
        id: `match-${String(matchNumber).padStart(2, '0')}`,
        tournamentId: 'tn-001',
        matchNumber,
        round: `League · Round ${roundIndex + 1}`,
        date,
        time: gameIndex < 2 ? '09:30' : '14:30',
        teamA: teamA.name,
        teamB: teamB.name,
        stadium: stadium.name,
        pitch: `${stadium.type} · Pitch ${stadiumIndex + 1}`,
        officials: [demoOfficials[officialIndex].name, demoOfficials[(officialIndex + 1) % demoOfficials.length].name],
        status: isFirstResult || isSecondResult ? 'Completed' : 'Scheduled',
        ...(isFirstResult ? { scoreA: 168, oversA: '20.0', scoreB: 154, oversB: '20.0' } : {}),
        ...(isSecondResult ? { scoreA: 142, oversA: '19.2', scoreB: 145, oversB: '18.4' } : {}),
        ...(matchNumber === 2 ? { conflictDemo: true } : {}),
      })
      matchNumber += 1
    }
    rotation.splice(1, 0, rotation.pop())
    date = addDemoDays(date, 1)
  }
  return matches
}

export const demoMatches = buildDemoMatches()

export const demoScheduleVersions = [
  { id: 'version-1', label: 'Initial fixture draft', createdAt: '2026-11-01T10:00:00.000Z', matchCount: demoMatches.length, matches: demoMatches },
]

export const demoConflicts = [
  { id: 'conflict-ground-1', matchId: 'match-02', type: 'Ground double-booking', severity: 'High', message: 'KLE University Ground has two matches scheduled at 09:30 on 3 Nov.', suggestion: 'Move Match 2 to an available ground or time.', resolved: false },
  { id: 'conflict-official-1', matchId: 'match-04', type: 'Official unavailable', officialName: 'Akash Patil', severity: 'Medium', message: 'Akash Patil is marked unavailable on 3 Nov.', suggestion: 'Replace the unavailable umpire with Rahul Desai.', resolved: false },
]
