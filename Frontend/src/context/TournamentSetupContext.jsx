import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { tournaments as initialTournaments } from '../data/mockData'
import {
  demoAvailability,
  demoConflicts,
  demoConstraints,
  demoOfficials,
  demoScheduleVersions,
  demoStadiums,
  demoTeams,
  demoMatches,
} from '../data/demoData'

const STORAGE_KEY = 'tournamenthub-demo-v2'
const TournamentSetupContext = createContext(null)

export const SETUP_STEPS = [
  { id: 'details', title: 'Tournament Details', description: 'Name, edition, season, host and dates', path: '/setup/details', category: 'TOURNAMENT MANAGEMENT' },
  { id: 'teams', title: 'Team Registration', description: 'Participating teams, squads and groups', path: '/teams', category: 'TOURNAMENT MANAGEMENT' },
  { id: 'matches', title: 'Match Configuration', description: 'Overs, format and points rules', path: '/setup/match-config', category: 'TOURNAMENT MANAGEMENT' },
  { id: 'stadiums', title: 'Stadium Registration', description: 'Grounds, pitches and availability', path: '/stadiums', category: 'RESOURCES' },
  { id: 'officials', title: 'Officials Registration', description: 'Umpires, referees and availability', path: '/officials', category: 'RESOURCES' },
  { id: 'availability', title: 'Availability Configuration', description: 'Match windows, dates and rest intervals', path: '/availability', category: 'RESOURCES' },
  { id: 'constraints', title: 'Scheduling Constraints', description: 'Scheduling preferences and limits', path: '/setup/constraints', category: 'SCHEDULING' },
]

export const PRESETS = {
  inProgress: {
    tournament: {
      name: 'KLE Cricket Championship 2026',
      edition: 'Season 12',
      category: 'Inter-Collegiate T20',
      season: '2026 Spring-Summer',
      startDate: '2026-11-01',
      endDate: '2026-11-18',
      hostInstitution: 'KLE Technological University, Hubballi',
      ballType: 'White Kookaburra (Leather)',
    },
    stepStatus: { details: 'Completed', teams: 'Completed', matches: 'Completed', stadiums: 'Completed', officials: 'In Progress', availability: 'In Progress', constraints: 'Not Started' },
    missingItems: [
      { step: 'Officials Registration', issue: 'Review the demonstration officials and availability' },
      { step: 'Availability Configuration', issue: 'Review the example ground availability windows' },
      { step: 'Scheduling Constraints', issue: 'Review demonstration schedule preferences' },
    ],
  },
  newEmpty: {
    tournament: { name: 'Untitled Tournament', edition: '', category: 'Inter-Collegiate T20', season: '', startDate: '', endDate: '', hostInstitution: '', ballType: 'White Kookaburra (Leather)' },
    stepStatus: { details: 'Not Started', teams: 'Not Started', matches: 'Not Started', stadiums: 'Not Started', officials: 'Not Started', availability: 'Not Started', constraints: 'Not Started' },
    missingItems: [
      { step: 'Tournament Details', issue: 'Tournament information and dates are not configured' },
      { step: 'Team Registration', issue: 'Register participating teams' },
      { step: 'Match Configuration', issue: 'Configure match format and points' },
      { step: 'Stadium Registration', issue: 'Register tournament grounds' },
      { step: 'Officials Registration', issue: 'Register match officials' },
      { step: 'Availability Configuration', issue: 'Set availability windows' },
      { step: 'Scheduling Constraints', issue: 'Set schedule preferences' },
    ],
  },
  fullyReady: {
    tournament: { name: 'KLE Cricket Championship 2026', edition: 'Season 12', category: 'Inter-Collegiate T20', season: '2026 Spring-Summer', startDate: '2026-11-01', endDate: '2026-11-18', hostInstitution: 'KLE Technological University, Hubballi', ballType: 'White Kookaburra (Leather)' },
    stepStatus: { details: 'Completed', teams: 'Completed', matches: 'Completed', stadiums: 'Completed', officials: 'Completed', availability: 'Completed', constraints: 'Completed' },
    missingItems: [],
  },
}

function initialDemoData() {
  return {
    tournaments: initialTournaments.map((tournament, index) => index === 0
      ? { ...tournament, name: 'KLE Cricket Championship 2026', teams: demoTeams.length, format: 'T20 Round Robin', startDate: '2026-11-01', endDate: '2026-11-18' }
      : tournament),
    teams: demoTeams,
    stadiums: demoStadiums,
    officials: demoOfficials,
    availability: demoAvailability,
    constraints: demoConstraints,
    matchConfig: { format: 'T20', oversPerInnings: 20, maxBowlerOvers: 4, pointsForWin: 2, pointsForTie: 1, pointsForLoss: 0 },
    matches: demoMatches,
    scheduleVersions: demoScheduleVersions,
    conflicts: demoConflicts,
    activeTournamentId: 'tn-001',
  }
}

function readStoredData() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialDemoData()
    const value = JSON.parse(stored)
    const defaults = initialDemoData()
    const storedData = Object.fromEntries(Object.keys(defaults).map((key) => [key, value[key] ?? defaults[key]]))
    const legacyInitialSchedule = Array.isArray(value.matches)
      && value.matches.length < defaults.matches.length
      && value.matches.every((match) => match.tournamentId === 'tn-001' && /^match-\d+$/.test(match.id))
    if (!legacyInitialSchedule) return storedData

    const storedMatches = new Map(value.matches.map((match) => [match.id, match]))
    const migratedMatches = defaults.matches.map((match) => storedMatches.get(match.id) || match)
    return {
      ...storedData,
      matches: migratedMatches,
      scheduleVersions: storedData.scheduleVersions.map((version) => {
        const versionTournamentId = version.tournamentId || version.matches[0]?.tournamentId
        if (versionTournamentId !== 'tn-001' || version.matchCount >= defaults.matches.length) return version
        return { ...version, tournamentId: 'tn-001', matchCount: migratedMatches.length, matches: migratedMatches }
      }),
    }
  } catch (error) {
    console.error('Unable to load TournamentHub demo data from local storage.', error)
    return initialDemoData()
  }
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function formatForCategory(category) {
  if (category === 'University One-Day Cup') return '50-Over Round Robin'
  if (category === 'Inter-Departmental Knockout') return 'T20 Knockout'
  if (category === 'Zonal Leather Ball League') return 'Zonal Round Robin'
  return 'T20 Round Robin'
}

function addDays(date, count) {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + count)
  return result.toISOString().slice(0, 10)
}

function createRoundRobin(teams, startDate, stadiums, officials, weeklyRestDay) {
  if (teams.length < 2) throw new Error('Register at least two teams before generating fixtures.')
  if (stadiums.length < 2) throw new Error('Register at least two stadiums before generating fixtures.')
  if (officials.length < 2) throw new Error('Register at least two officials before generating fixtures.')

  const rounds = []
  const rotation = [...teams]
  if (rotation.length % 2) rotation.push(null)
  for (let round = 0; round < rotation.length - 1; round += 1) {
    const games = []
    for (let game = 0; game < rotation.length / 2; game += 1) {
      const first = rotation[game]
      const second = rotation[rotation.length - 1 - game]
      if (first && second) games.push([first, second])
    }
    rounds.push(games)
    rotation.splice(1, 0, rotation.pop())
  }

  let date = startDate || '2026-11-01'
  let matchNumber = 1
  const matches = []
  rounds.forEach((games, roundIndex) => {
    while (new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }) === weeklyRestDay) {
      date = addDays(date, 1)
    }
    games.forEach(([teamA, teamB], gameIndex) => {
      const time = gameIndex < 2 ? '09:30' : '14:30'
      const resourceIndex = roundIndex === 0 && gameIndex < 2 ? 0 : gameIndex % stadiums.length
      const officialStart = (roundIndex + gameIndex * 2) % officials.length
      matches.push({
        id: makeId('match'),
        matchNumber,
        round: `League · Round ${roundIndex + 1}`,
        date,
        time,
        teamA: teamA.name,
        teamB: teamB.name,
        stadium: stadiums[resourceIndex].name,
        pitch: `${stadiums[resourceIndex].type} · Pitch ${resourceIndex + 1}`,
        officials: [officials[officialStart].name, officials[(officialStart + 1) % officials.length].name],
        status: 'Scheduled',
      })
      matchNumber += 1
    })
    date = addDays(date, 1)
  })
  return matches
}

function findConflicts(matches, officials) {
  const conflicts = []
  const venueSlots = new Map()
  matches.forEach((match) => {
    const key = `${match.date}|${match.time}|${match.stadium}`
    const previous = venueSlots.get(key)
    if (previous) {
      conflicts.push({
        id: `ground-${previous.id}-${match.id}`,
        matchId: match.id,
        type: 'Ground double-booking',
        severity: 'High',
        message: `${match.stadium} has two matches at ${match.time} on ${match.date}.`,
        suggestion: 'Move one fixture to an available ground or time.',
        resolved: false,
      })
    } else venueSlots.set(key, match)

    match.officials.forEach((name) => {
      const official = officials.find((item) => item.name === name)
      const blackoutDates = (official?.blackoutDates || '').split(',').map((date) => date.trim())
      if (official && (!official.available || blackoutDates.includes(match.date))) {
        conflicts.push({
          id: `official-${match.id}-${official.id}`,
          matchId: match.id,
          type: 'Official unavailable',
          severity: 'Medium',
          message: `${official.name} is marked unavailable for ${match.date}.`,
          suggestion: 'Assign another available official.',
          resolved: false,
          officialName: official.name,
        })
      }
    })
  })
  return conflicts
}

export function TournamentSetupProvider({ children }) {
  const [demo, setDemo] = useState(readStoredData)
  const [activePresetKey, setActivePresetKey] = useState('inProgress')
  const [setupState, setSetupState] = useState(PRESETS.inProgress)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo))
    } catch (error) {
      console.error('Unable to persist TournamentHub demo data in local storage.', error)
    }
  }, [demo])

  const loadPreset = (key) => {
    if (!PRESETS[key]) return
    setActivePresetKey(key)
    setSetupState(JSON.parse(JSON.stringify(PRESETS[key])))
  }

  const updateStepStatus = (stepId, status) => {
    setSetupState((previous) => ({
      ...previous,
      stepStatus: { ...previous.stepStatus, [stepId]: status },
      missingItems: status === 'Completed'
        ? previous.missingItems.filter((item) => !item.step.toLowerCase().includes(stepId))
        : previous.missingItems,
    }))
  }

  const updateTournament = (fields) => {
    setSetupState((previous) => ({ ...previous, tournament: { ...previous.tournament, ...fields } }))
    const activeId = demo.activeTournamentId
    setDemo((previous) => ({
      ...previous,
      tournaments: previous.tournaments.map((tournament) => {
        if (tournament.id !== activeId) return tournament
        return {
          ...tournament,
          ...fields,
          format: fields.category ? formatForCategory(fields.category) : tournament.format,
          startDate: fields.startDate || tournament.startDate,
          endDate: fields.endDate || tournament.endDate,
        }
      }),
    }))
  }

  const updateDemo = (field, id, updates) => setDemo((previous) => ({
    ...previous,
    [field]: previous[field].map((item) => item.id === id ? { ...item, ...updates } : item),
  }))

  const addTeam = (team) => {
    const created = { ...team, tournamentId: team.tournamentId || demo.activeTournamentId, id: team.id || makeId('team'), status: team.status || 'Registered', squadSize: Number(team.squadSize || 15) }
    setDemo((previous) => ({ ...previous, teams: [...previous.teams, created] }))
    return created
  }

  const addStadium = (stadium) => {
    const created = { ...stadium, id: stadium.id || makeId('ground'), availabilityStatus: stadium.availabilityStatus || 'available' }
    setDemo((previous) => ({ ...previous, stadiums: [...previous.stadiums, created] }))
    return created
  }

  const addOfficial = (official) => {
    const created = { ...official, id: official.id || makeId('official'), available: official.available ?? true, matches: Number(official.matches || 0) }
    setDemo((previous) => ({ ...previous, officials: [...previous.officials, created] }))
    return created
  }

  const createTournament = (form) => {
    const id = makeId('tn')
    const teamNames = (form.teams || []).filter(Boolean)
    const tournament = {
      id,
      name: form.name,
      sport: 'Cricket',
      status: 'upcoming',
      startDate: form.startDate || '2026-11-01',
      endDate: form.endDate || '2026-11-18',
      teams: teamNames.length,
      matchesPlayed: 0,
      totalMatches: teamNames.length > 1 ? teamNames.length * (teamNames.length - 1) / 2 : 0,
      prize: form.prize || 'Championship Trophy',
      format: form.format || 'T20 Round Robin',
      location: form.location || 'KLE University Ground',
      hostInstitution: form.hostInstitution || 'KLE Technological University, Hubballi',
    }
    const newTeams = teamNames.map((name, index) => ({
      id: makeId('team'),
      tournamentId: id,
      name,
      college: form.hostInstitution || 'Participating Cricket Club',
      department: `Squad ${index + 1}`,
      captain: 'Captain to be confirmed',
      coach: 'Coach to be confirmed',
      squadSize: 15,
      pool: `Pool ${String.fromCharCode(65 + (index % 4))}`,
      status: 'Registered',
    }))
    const newStadiums = (form.stadiums || []).map((name) => ({
      id: makeId('ground'),
      name,
      shortName: name,
      type: 'Natural Turf',
      capacity: '5,000',
      pitches: 1,
      floodlights: true,
      availabilityStatus: 'available',
      availability: '09:00–18:00',
      blackoutDates: '',
    }))
    const newOfficials = (form.officials || []).map((name) => ({
      id: makeId('official'),
      name,
      role: 'On-field Umpire',
      cert: 'State Panel',
      available: true,
      matches: 0,
      blackoutDates: '',
    }))
    const matchDurationHours = Number(form.matchDuration)
    const minimumRecoveryHours = Number(form.recoveryHours)
    setDemo((previous) => ({
      ...previous,
      tournaments: [tournament, ...previous.tournaments],
      teams: [...previous.teams, ...newTeams],
      stadiums: [...previous.stadiums, ...newStadiums],
      officials: [...previous.officials, ...newOfficials],
      availability: {
        ...previous.availability,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        matchDurationHours: Number.isFinite(matchDurationHours) && matchDurationHours > 0 ? matchDurationHours : previous.availability.matchDurationHours,
      },
      constraints: {
        ...previous.constraints,
        minimumRecoveryHours: Number.isFinite(minimumRecoveryHours) && minimumRecoveryHours >= 0 ? minimumRecoveryHours : previous.constraints.minimumRecoveryHours,
      },
      activeTournamentId: id,
    }))
    setSetupState((previous) => ({ ...previous, tournament: { ...previous.tournament, ...form, name: form.name } }))
    setActivePresetKey('custom')
    return id
  }

  const saveAvailability = (availability) => setDemo((previous) => ({ ...previous, availability }))
  const saveConstraints = (constraints) => setDemo((previous) => ({ ...previous, constraints }))
  const saveMatchConfig = (matchConfig) => setDemo((previous) => ({ ...previous, matchConfig }))
  const setActiveTournament = useCallback((id) => {
    setDemo((previous) => previous.activeTournamentId === id ? previous : { ...previous, activeTournamentId: id })
  }, [])

  const generateSchedule = (tournamentId = demo.activeTournamentId, options = {}) => {
    const tournament = demo.tournaments.find((item) => item.id === tournamentId)
    if (!tournament) throw new Error('Select an existing tournament before generating fixtures.')
    if (!tournament.format?.toLowerCase().includes('round robin')) {
      throw new Error('The local sample generator currently supports round-robin formats only.')
    }
    const tournamentTeams = demo.teams.filter((team) => team.tournamentId === tournamentId)
    if (tournamentTeams.length < 2) throw new Error('Register at least two teams for this tournament before generating fixtures.')
    const startDate = options.startDate || tournament?.startDate || demo.availability.startDate
    const endDate = options.endDate || tournament?.endDate || demo.availability.endDate
    if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      throw new Error('The schedule end date must be on or after the start date.')
    }
    const savedAvailability = {
      ...demo.availability,
      startDate,
      endDate,
      matchDurationHours: Number(options.duration) || demo.availability.matchDurationHours,
    }
    const matches = createRoundRobin(
      tournamentTeams,
      startDate,
      demo.stadiums.filter((stadium) => stadium.availabilityStatus !== 'maintenance'),
      demo.officials.filter((official) => official.available),
      savedAvailability.weeklyRestDay,
    ).map((match) => ({ ...match, tournamentId }))
    const scheduleEndDate = matches.at(-1)?.date
    if (scheduleEndDate && scheduleEndDate > endDate) {
      throw new Error(`The available date range ends on ${endDate}; the round-robin draft would finish on ${scheduleEndDate}.`)
    }
    const versionNumber = demo.scheduleVersions.length + 1
    const version = {
      id: makeId('version'),
      tournamentId,
      label: `Generated schedule v${versionNumber}`,
      createdAt: new Date().toISOString(),
      matchCount: matches.length,
      matches,
    }
    const activeMatchIds = new Set(demo.matches.filter((match) => match.tournamentId === tournamentId).map((match) => match.id))
    const newConflicts = findConflicts(matches, demo.officials).map((conflict) => ({ ...conflict, tournamentId }))
    setDemo((previous) => ({
      ...previous,
      activeTournamentId: tournamentId,
      availability: savedAvailability,
      matches: [...previous.matches.filter((match) => match.tournamentId !== tournamentId), ...matches],
      scheduleVersions: [version, ...previous.scheduleVersions],
      conflicts: [...previous.conflicts.filter((conflict) => !activeMatchIds.has(conflict.matchId)), ...newConflicts],
      tournaments: previous.tournaments.map((item) => item.id === tournamentId
        ? { ...item, totalMatches: matches.length, teams: tournamentTeams.length }
        : item),
    }))
    return matches.length
  }

  const enterMatchResult = (matchId, scoreA, scoreB, oversA = '20.0', oversB = '20.0') => {
    const first = Number(scoreA)
    const second = Number(scoreB)
    if (!Number.isFinite(first) || first < 0 || !Number.isFinite(second) || second < 0) {
      throw new Error('Enter valid non-negative scores for both teams.')
    }
    const match = demo.matches.find((item) => item.id === matchId)
    if (!match) throw new Error('This fixture is no longer available in the active demo schedule.')
    const maxOvers = Number(demo.matchConfig.oversPerInnings) || 20
    for (const [label, value] of [['first innings', oversA], ['second innings', oversB]]) {
      if (!/^\d+(\.[0-5])?$/.test(String(value))) {
        throw new Error(`Enter ${label} overs in cricket notation, for example 19.4.`)
      }
      const [overs, balls = 0] = String(value).split('.').map(Number)
      if ((overs === 0 && balls === 0) || overs > maxOvers || (overs === maxOvers && balls > 0)) {
        throw new Error(`Overs for the ${label} must be greater than zero and no more than ${maxOvers}.`)
      }
    }
    setDemo((previous) => {
      const nextMatches = previous.matches.map((match) => {
        if (match.id !== matchId) return match
        const winner = first === second ? 'Tie' : first > second ? match.teamA : match.teamB
        return { ...match, scoreA: first, scoreB: second, oversA, oversB, winner, status: 'Completed' }
      })
      const tournamentId = nextMatches.find((match) => match.id === matchId)?.tournamentId
      return {
        ...previous,
        matches: nextMatches,
        tournaments: previous.tournaments.map((tournament) => tournament.id === tournamentId
          ? { ...tournament, matchesPlayed: nextMatches.filter((match) => match.tournamentId === tournamentId && match.status === 'Completed').length }
          : tournament),
      }
    })
  }

  const resolveConflict = (conflictId) => setDemo((previous) => {
    const conflict = previous.conflicts.find((item) => item.id === conflictId)
    if (!conflict) return previous
    const match = previous.matches.find((item) => item.id === conflict.matchId)
    if (!match) return previous
    const updatedMatches = previous.matches.map((item) => {
      if (item.id !== conflict.matchId) return item
      if (conflict.type === 'Official unavailable') {
        const replacement = previous.officials.find((official) => {
          const blackouts = (official.blackoutDates || '').split(',').map((date) => date.trim())
          return official.available && !blackouts.includes(item.date) && !item.officials.includes(official.name)
        })
        return { ...item, officials: item.officials.map((name) => name === conflict.officialName ? replacement?.name || name : name) }
      }
      const replacement = previous.stadiums.find((stadium) => {
        if (stadium.name === item.stadium || stadium.availabilityStatus === 'maintenance') return false
        return !previous.matches.some((other) => other.id !== item.id && other.date === item.date && other.time === item.time && other.stadium === stadium.name)
      })
      return { ...item, stadium: replacement?.name || item.stadium, time: replacement ? item.time : '14:30' }
    })
    return {
      ...previous,
      matches: updatedMatches,
      conflicts: previous.conflicts.map((item) => item.id === conflictId
        ? { ...item, resolved: true, resolution: conflict.type === 'Official unavailable' ? 'Assigned an available official.' : `Moved match to ${updatedMatches.find((matchItem) => matchItem.id === match.id)?.stadium}.` }
        : item),
    }
  })

  const restoreScheduleVersion = (versionId) => {
    const version = demo.scheduleVersions.find((item) => item.id === versionId)
    if (!version) return
    const tournamentId = version.tournamentId || version.matches[0]?.tournamentId || demo.activeTournamentId
    const restoredMatches = version.matches.map((match) => ({ ...match, tournamentId }))
    const replacedIds = new Set(demo.matches.filter((match) => match.tournamentId === tournamentId).map((match) => match.id))
    const restoredConflicts = findConflicts(restoredMatches, demo.officials).map((conflict) => ({ ...conflict, tournamentId }))
    setDemo((previous) => ({
      ...previous,
      activeTournamentId: tournamentId,
      matches: [...previous.matches.filter((match) => match.tournamentId !== tournamentId), ...restoredMatches],
      conflicts: [...previous.conflicts.filter((conflict) => !replacedIds.has(conflict.matchId)), ...restoredConflicts],
    }))
  }

  const stats = useMemo(() => {
    const total = SETUP_STEPS.length
    const completed = Object.values(setupState.stepStatus).filter((status) => status === 'Completed').length
    const inProgress = Object.values(setupState.stepStatus).filter((status) => status === 'In Progress').length
    const notStarted = total - completed - inProgress
    return {
      total,
      completed,
      inProgress,
      notStarted,
      percent: Math.round((completed / total) * 100),
      isReady: completed === total,
      missingItems: setupState.missingItems,
    }
  }, [setupState])

  const value = {
    setupState,
    stats,
    steps: SETUP_STEPS,
    activePresetKey,
    loadPreset,
    updateStepStatus,
    updateTournament,
    createModalOpen,
    setCreateModalOpen,
    demo,
    tournaments: demo.tournaments,
    teams: demo.teams,
    stadiums: demo.stadiums,
    officials: demo.officials,
    availability: demo.availability,
    constraints: demo.constraints,
    matchConfig: demo.matchConfig,
    matches: demo.matches,
    scheduleVersions: demo.scheduleVersions,
    conflicts: demo.conflicts,
    activeTournament: demo.tournaments.find((item) => item.id === demo.activeTournamentId) || demo.tournaments[0],
    addTeam,
    updateTeam: (id, fields) => updateDemo('teams', id, fields),
    removeTeam: (id) => setDemo((previous) => ({ ...previous, teams: previous.teams.filter((team) => team.id !== id) })),
    addStadium,
    updateStadium: (id, fields) => updateDemo('stadiums', id, fields),
    removeStadium: (id) => setDemo((previous) => ({ ...previous, stadiums: previous.stadiums.filter((stadium) => stadium.id !== id) })),
    addOfficial,
    updateOfficial: (id, fields) => updateDemo('officials', id, fields),
    removeOfficial: (id) => setDemo((previous) => ({ ...previous, officials: previous.officials.filter((official) => official.id !== id) })),
    saveAvailability,
    saveConstraints,
    saveMatchConfig,
    createTournament,
    generateSchedule,
    enterMatchResult,
    resolveConflict,
    restoreScheduleVersion,
    setActiveTournament,
    updateMatch: (id, fields) => updateDemo('matches', id, fields),
  }

  return <TournamentSetupContext.Provider value={value}>{children}</TournamentSetupContext.Provider>
}

export function useTournamentSetup() {
  const context = useContext(TournamentSetupContext)
  if (!context) throw new Error('useTournamentSetup must be used within a TournamentSetupProvider')
  return context
}
