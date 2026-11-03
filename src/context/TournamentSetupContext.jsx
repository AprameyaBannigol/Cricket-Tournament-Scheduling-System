/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Tournament Setup Context & State Management
 * ══════════════════════════════════════════════════════════════
 *  Tracks the mandatory 7-stage tournament setup workflow required
 *  before the E1 Scheduling Engine can generate valid match schedules.
 */

import { createContext, useContext, useState, useMemo } from 'react'

const TournamentSetupContext = createContext(null)

export const SETUP_STEPS = [
  {
    id: 'details',
    title: 'Tournament Details',
    description: 'Name, edition, season, host university and dates',
    path: '/setup/details',
    category: 'TOURNAMENT MANAGEMENT',
  },
  {
    id: 'teams',
    title: 'Team Registration',
    description: 'Participating colleges, verified squads and seedings',
    path: '/teams',
    category: 'TOURNAMENT MANAGEMENT',
  },
  {
    id: 'matches',
    title: 'Match Configuration',
    description: 'Format (T20/50-Over), overs, points system and innings rules',
    path: '/setup/match-config',
    category: 'TOURNAMENT MANAGEMENT',
  },
  {
    id: 'stadiums',
    title: 'Stadium Registration',
    description: 'Venues, turf tracks, spectator capacity and floodlight certification',
    path: '/stadiums',
    category: 'RESOURCES',
  },
  {
    id: 'officials',
    title: 'Officials Registration',
    description: 'BCCI-certified umpires, match referees and official scorers',
    path: '/officials',
    category: 'RESOURCES',
  },
  {
    id: 'availability',
    title: 'Availability Configuration',
    description: 'Venue blackout dates, rolling slots and team matchday availability',
    path: '/availability',
    category: 'RESOURCES',
  },
  {
    id: 'constraints',
    title: 'Scheduling Constraints',
    description: 'E2 constraint rules: min rest intervals, double-booking & travel limits',
    path: '/setup/constraints',
    category: 'SCHEDULING',
  },
]

// Preset templates for university presentation and evaluation
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
    stepStatus: {
      details: 'Completed',
      teams: 'Completed',
      matches: 'Completed',
      stadiums: 'Completed',
      officials: 'In Progress',
      availability: 'In Progress',
      constraints: 'Not Started',
    },
    missingItems: [
      { step: 'Officials Registration', issue: 'Minimum 8 certified umpires required (currently 4 assigned)' },
      { step: 'Availability Configuration', issue: 'North Campus Oval pitch maintenance dates not yet locked' },
      { step: 'Scheduling Constraints', issue: 'E2 engine minimum rest interval rule (>24h) needs formal activation' },
    ],
  },
  newEmpty: {
    tournament: {
      name: 'Untitled Tournament',
      edition: '',
      category: 'Inter-Collegiate T20',
      season: '',
      startDate: '',
      endDate: '',
      hostInstitution: '',
      ballType: 'White Kookaburra (Leather)',
    },
    stepStatus: {
      details: 'Not Started',
      teams: 'Not Started',
      matches: 'Not Started',
      stadiums: 'Not Started',
      officials: 'Not Started',
      availability: 'Not Started',
      constraints: 'Not Started',
    },
    missingItems: [
      { step: 'Tournament Details', issue: 'Basic tournament information and sanctioned dates missing' },
      { step: 'Team Registration', issue: 'No collegiate teams registered (minimum 8 required)' },
      { step: 'Match Configuration', issue: 'Overs, points system and tie-breaker rules not configured' },
      { step: 'Stadium Registration', issue: 'At least 2 approved cricket grounds required' },
      { step: 'Officials Registration', issue: 'Certified umpires & match referees required' },
      { step: 'Availability Configuration', issue: 'Ground availability windows not defined' },
      { step: 'Scheduling Constraints', issue: 'Constraint model parameters unconfigured' },
    ],
  },
  fullyReady: {
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
    stepStatus: {
      details: 'Completed',
      teams: 'Completed',
      matches: 'Completed',
      stadiums: 'Completed',
      officials: 'Completed',
      availability: 'Completed',
      constraints: 'Completed',
    },
    missingItems: [],
  },
}

export function TournamentSetupProvider({ children }) {
  const [activePresetKey, setActivePresetKey] = useState('inProgress')
  const [setupState, setSetupState] = useState(PRESETS.inProgress)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Switch preset cleanly (for demos)
  const loadPreset = (key) => {
    if (PRESETS[key]) {
      setActivePresetKey(key)
      setSetupState(JSON.parse(JSON.stringify(PRESETS[key])))
    }
  }

  // Update a single step status
  const updateStepStatus = (stepId, status) => {
    setSetupState((prev) => {
      const nextStatus = { ...prev.stepStatus, [stepId]: status }
      // Recalculate missing items
      const nextMissing = prev.missingItems.filter(
        (item) => !item.step.toLowerCase().includes(stepId)
      )
      return {
        ...prev,
        stepStatus: nextStatus,
        missingItems: status === 'Completed' ? nextMissing : prev.missingItems,
      }
    })
  }

  // Update tournament details
  const updateTournament = (fields) => {
    setSetupState((prev) => ({
      ...prev,
      tournament: { ...prev.tournament, ...fields },
    }))
  }

  // Computed metrics
  const stats = useMemo(() => {
    const total = SETUP_STEPS.length
    const completed = Object.values(setupState.stepStatus).filter((s) => s === 'Completed').length
    const inProgress = Object.values(setupState.stepStatus).filter((s) => s === 'In Progress').length
    const notStarted = Object.values(setupState.stepStatus).filter((s) => s === 'Not Started').length
    const percent = Math.round((completed / total) * 100)
    const isReady = completed === total

    return {
      total,
      completed,
      inProgress,
      notStarted,
      percent,
      isReady,
      missingItems: setupState.missingItems,
    }
  }, [setupState])

  return (
    <TournamentSetupContext.Provider
      value={{
        setupState,
        stats,
        steps: SETUP_STEPS,
        activePresetKey,
        loadPreset,
        updateStepStatus,
        updateTournament,
        createModalOpen,
        setCreateModalOpen,
      }}
    >
      {children}
    </TournamentSetupContext.Provider>
  )
}

export function useTournamentSetup() {
  const context = useContext(TournamentSetupContext)
  if (!context) {
    throw new Error('useTournamentSetup must be used within a TournamentSetupProvider')
  }
  return context
}
