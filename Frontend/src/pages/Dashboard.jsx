/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Refactored Clean Dashboard
 * ══════════════════════════════════════════════════════════════
 *  Clean, balanced, commercial sports-tech SaaS interface.
 *  Structured header, 4 uniform KPI cards, compact 7-step setup
 *  checklist, next 4 upcoming fixtures, and compact venue overview.
 */

import { Link, useNavigate } from 'react-router-dom'
import {
  Trophy,
  Users,
  Swords,
  CalendarRange,
  Landmark,
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  ChevronRight,
  Plus,
  AlertCircle,
  Calendar,
  FileCheck,
} from 'lucide-react'
import {
  Card,
  Badge,
  StatCard,
  SectionHeader,
  Button,
  ProgressBar,
  EmptyState,
} from '../components/ui'
import { useTournamentSetup } from '../context/TournamentSetupContext'

function formatDemoDate(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    setupState,
    stats,
    steps,
    activePresetKey,
    loadPreset,
    activeTournament,
    tournaments,
    teams,
    matches,
    stadiums,
  } = useTournamentSetup()

  // Mode: 'existing' (standard demonstration) vs 'firstTime' (brand-new setup)
  const isFirstTime = activePresetKey === 'newEmpty'
  const tournamentTeams = teams.filter((team) => team.tournamentId === activeTournament?.id)
  const tournamentMatches = matches.filter((match) => match.tournamentId === activeTournament?.id)
  const scheduledMatches = tournamentMatches.filter((match) => match.status !== 'Completed').slice(0, 4)
  const fixtures = (scheduledMatches.length ? scheduledMatches : tournamentMatches.slice(0, 4)).map((match) => ({
    ...match,
    date: formatDemoDate(match.date),
    statusVariant: match.status === 'Completed' ? 'success' : 'info',
  }))
  const stadiumSummaries = stadiums.map((stadium) => ({
    ...stadium,
    status: stadium.availabilityStatus === 'maintenance' ? 'Maintenance' : 'Available',
    statusVariant: stadium.availabilityStatus === 'maintenance' ? 'warning' : 'success',
  }))

  return (
    <div className="space-y-6">
      {/* ── 1. Compact Dashboard Header ── */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Welcome back, Organizer
            </h1>
            <Badge variant={isFirstTime ? 'neutral' : 'success'} size="sm">
              {isFirstTime ? 'Setup Preview' : 'Active Tournament'}
            </Badge>
          </div>

          <p className="text-xs text-slate-500">
            {isFirstTime ? 'Setup checklist preview · your sample tournament data remains available below.' : 'Active: '}
            {!isFirstTime && <><strong className="text-slate-800">{activeTournament?.name}</strong> · {activeTournament?.format} · {activeTournament?.startDate} — {activeTournament?.endDate}</>}
          </p>
        </div>

        {/* Actions & State Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70 text-xs">
            <button
              onClick={() => loadPreset('inProgress')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                !isFirstTime
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Existing Tournament
            </button>
            <button
              onClick={() => loadPreset('newEmpty')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                isFirstTime
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              First-Time Setup
            </button>
          </div>

          {/* Primary Create Tournament */}
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/tournaments/create')}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            Create Tournament
          </Button>

          {/* Generate Schedule Button */}
          <div className="relative group">
            <Button
              variant="secondary"
              size="sm"
              icon={Sparkles}
              onClick={() => navigate('/schedule/generate')}
            >
              Review Schedule Inputs
            </Button>
          </div>
        </div>
      </div>

      <div className="demo-notice"><span>Demonstration data is saved in this browser. Schedule allocation and availability validation are not connected to a backend.</span></div>

      {/* ── 2. Simplified 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Active Tournaments"
          value={String(tournaments.length)}
          helper="Saved demo tournaments"
        />
        <StatCard
          icon={Users}
          label="Total Teams"
          value={String(tournamentTeams.length)}
          helper="Registered for the selected tournament"
        />
        <StatCard
          icon={Swords}
          label="Total Matches"
          value={String(tournamentMatches.length)}
          helper="Fixtures in the selected tournament"
        />
        <StatCard
          icon={CalendarRange}
          label="Scheduled Matches"
          value={String(tournamentMatches.filter((match) => match.status !== 'Completed').length)}
          helper="Scheduled or in-progress fixtures"
        />
      </div>

      {/* ── 3. Compact Tournament Setup Progress ── */}
      <Card className="p-5" hover={false}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Tournament Setup Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input required data across each category before generating match schedules.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">
              {stats.completed} of {stats.total} Completed
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {stats.percent}%
            </span>
          </div>
        </div>

        {/* Clean Slender Progress Bar */}
        <div className="py-3">
          <ProgressBar
            value={stats.completed}
            max={stats.total}
            color={stats.isReady ? 'emerald' : 'emerald'}
            height="h-2"
          />
        </div>

        {/* Compact 7-Step Horizontal Checklist / Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1">
          {steps.map((step, idx) => {
            const status = setupState.stepStatus[step.id] || 'Not Started'
            const isDone = status === 'Completed'
            const isInProg = status === 'In Progress'

            return (
              <div
                key={step.id}
                className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {idx + 1}
                    </span>
                    <Badge
                      variant={isDone ? 'success' : isInProg ? 'warning' : 'neutral'}
                      size="sm"
                    >
                      {status}
                    </Badge>
                  </div>
                  <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1">
                    {step.title}
                  </h3>
                </div>

                <div className="mt-2.5 pt-1.5 border-t border-slate-200/60">
                  <Link
                    to={step.path}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center justify-between"
                  >
                    <span>{isDone ? 'Edit' : isInProg ? 'Resume' : 'Configure'}</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Concise Missing Info Note (only when incomplete) */}
        {!stats.isReady && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-800">Required before schedule generation:</strong>{' '}
              {isFirstTime
                ? 'Complete all 7 setup categories above starting with Tournament Details.'
                : 'Officials registration (4 umpires needed) · Pitch rolling blackout dates · Minimum rest rule.'}
            </span>
          </div>
        )}
      </Card>

      {/* ── 4 & 5. Main Content: Upcoming Fixtures (Left) + Stadium Availability (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left 2 Columns: Upcoming Fixtures (Next 4 matches) ── */}
        <div className="lg:col-span-2 space-y-3.5">
          <SectionHeader
            title="Upcoming Fixtures"
            subtitle="Next scheduled cricket matches in the championship"
            action={
              (
                <Link
                  to="/schedule"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  View Full Schedule <ChevronRight size={13} />
                </Link>
              )
            }
          />

          {!fixtures.length ? (
            <EmptyState
              icon={Calendar}
              title="No fixtures scheduled yet"
              description="Complete the setup workflow to prepare tournament details. Schedule generation and publishing are not connected in this frontend."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/setup/details')}>
                  Start Guided Setup
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {fixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shrink-0">
                      {fixture.matchNumber}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {fixture.teamA} <span className="text-slate-400 font-normal">vs</span> {fixture.teamB}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock size={11} className="text-slate-400" />
                          {fixture.date} · {fixture.time}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-600 truncate">
                          <MapPin size={11} className="text-slate-400" />
                          {fixture.stadium}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant={fixture.statusVariant} size="sm">
                      {fixture.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right 1 Column: Stadium Availability Summary ── */}
        <div className="space-y-3.5">
          <SectionHeader
            title="Stadium Availability"
            subtitle="Ground status & capacity overview"
            action={
              (
                <Link
                  to="/stadiums"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  Manage <ChevronRight size={13} />
                </Link>
              )
            }
          />

          {!stadiumSummaries.length ? (
            <EmptyState
              icon={Landmark}
              title="No stadiums registered"
              description="Register approved cricket grounds and turf wickets in Step 4 of the setup workflow."
            />
          ) : (
            <Card className="p-0 overflow-hidden divide-y divide-slate-100" hover={false}>
              {stadiumSummaries.map((stadium) => (
                <div key={stadium.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {stadium.name}
                      </h3>
                      {stadium.floodlights && (
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1 py-0.2 rounded border border-amber-200/50">
                          D/N
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {stadium.type} · {stadium.capacity} seats
                    </p>
                  </div>

                  <Badge variant={stadium.statusVariant} size="sm">
                    {stadium.status}
                  </Badge>
                </div>
              ))}

              <div className="p-3 bg-slate-50/70 text-center">
                <Link
                  to="/stadiums"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                >
                  Configure Ground Blackouts <ArrowRight size={12} />
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
