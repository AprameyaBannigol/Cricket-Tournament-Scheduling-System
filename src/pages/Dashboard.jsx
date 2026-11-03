/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Refactored Clean Dashboard
 * ══════════════════════════════════════════════════════════════
 *  Clean, balanced, commercial sports-tech SaaS interface.
 *  Structured header, 4 uniform KPI cards, compact 7-step setup
 *  checklist, next 4 upcoming fixtures, and compact venue overview.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Trophy,
  Users,
  Swords,
  CalendarRange,
  Landmark,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  ChevronRight,
  Plus,
  Lock,
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
import {
  activeTournament,
  kpiMetrics,
  upcomingFixtures,
  stadiumSummaries,
} from '../data/mockData'
import { useTournamentSetup } from '../context/TournamentSetupContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    setupState,
    stats,
    steps,
    setCreateModalOpen,
    activePresetKey,
    loadPreset,
  } = useTournamentSetup()

  const [generating, setGenerating] = useState(false)
  const [scheduleSuccess, setScheduleSuccess] = useState(false)

  // Mode: 'existing' (standard demonstration) vs 'firstTime' (brand-new setup)
  const isFirstTime = activePresetKey === 'newEmpty'

  const handleGenerate = () => {
    if (!stats.isReady) return
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setScheduleSuccess(true)
      setTimeout(() => setScheduleSuccess(false), 3500)
    }, 1200)
  }

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
              {isFirstTime ? 'First-Time Setup Mode' : 'Active Tournament'}
            </Badge>
          </div>

          <p className="text-xs text-slate-500">
            {isFirstTime ? (
              <span>No tournament data entered yet. Complete the 7 setup categories below to enable automated scheduling.</span>
            ) : (
              <span>
                Active: <strong className="text-slate-800">{activeTournament.name}</strong> · {activeTournament.category} ({activeTournament.edition}) · {activeTournament.dates}
              </span>
            )}
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
            onClick={() => setCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            Create Tournament
          </Button>

          {/* Generate Schedule Button */}
          <div className="relative group">
            <Button
              variant={stats.isReady ? 'primary' : 'secondary'}
              size="sm"
              icon={stats.isReady ? Sparkles : Lock}
              disabled={!stats.isReady || generating}
              onClick={handleGenerate}
              className={
                stats.isReady
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }
            >
              {generating ? 'Optimizing...' : 'Generate Schedule'}
            </Button>

            {!stats.isReady && (
              <div className="absolute right-0 top-full mt-1.5 w-60 p-2 bg-slate-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-50">
                Setup incomplete. Complete all 7 categories below before scheduling can be generated.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {scheduleSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Schedule generated successfully. All matches assigned across available grounds without conflict.</span>
          </div>
          <Link to="/schedule" className="font-bold underline text-emerald-800 hover:text-emerald-950">
            View Schedule
          </Link>
        </div>
      )}

      {/* ── 2. Simplified 4 KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Active Tournaments"
          value={isFirstTime ? '0' : kpiMetrics[0].value}
          helper={isFirstTime ? 'No tournaments created' : kpiMetrics[0].helper}
        />
        <StatCard
          icon={Users}
          label="Total Teams"
          value={isFirstTime ? '0' : kpiMetrics[1].value}
          helper={isFirstTime ? 'Pending team registration' : kpiMetrics[1].helper}
        />
        <StatCard
          icon={Swords}
          label="Total Matches"
          value={isFirstTime ? '0' : kpiMetrics[2].value}
          helper={isFirstTime ? 'Awaiting format rules' : kpiMetrics[2].helper}
        />
        <StatCard
          icon={CalendarRange}
          label="Scheduled Matches"
          value={isFirstTime ? '0 / 0' : kpiMetrics[3].value}
          helper={isFirstTime ? 'Schedule not yet generated' : kpiMetrics[3].helper}
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
              !isFirstTime && (
                <Link
                  to="/schedule"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  View Full Schedule <ChevronRight size={13} />
                </Link>
              )
            }
          />

          {isFirstTime ? (
            <EmptyState
              icon={Calendar}
              title="No fixtures scheduled yet"
              description="Complete the tournament setup workflow above to generate and publish your first match schedule."
              action={
                <Button variant="primary" size="sm" onClick={() => navigate('/setup/details')}>
                  Start Guided Setup
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {upcomingFixtures.map((fixture) => (
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
              !isFirstTime && (
                <Link
                  to="/stadiums"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  Manage <ChevronRight size={13} />
                </Link>
              )
            }
          />

          {isFirstTime ? (
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
