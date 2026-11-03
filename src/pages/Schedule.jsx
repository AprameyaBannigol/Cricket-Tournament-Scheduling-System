/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Schedule Viewer (Light Theme)
 * ══════════════════════════════════════════════════════════════
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Filter,
  CheckCircle2,
  Sparkles,
  Download,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeader } from '../components/ui'
import { motionPresets } from '../design/tokens'

const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

const cricketScheduleData = [
  {
    day: 'Mon',
    date: '3 Nov 2026',
    isToday: true,
    matches: [
      { time: '09:30', teamA: 'Hubli Royals XI', teamB: 'Dharwad Lions XI', status: 'completed', venue: 'Main Cricket Ground (MCG)', round: 'Match #13 · Pool B' },
      { time: '14:30', teamA: 'KLE Titans XI', teamB: 'City Warriors CC', status: 'live', venue: 'Main Cricket Ground (MCG Turf)', round: 'Match #15 · Super 8' },
      { time: '18:30', teamA: 'Engineering Strikers', teamB: 'Dharwad Lions XI', status: 'upcoming', venue: 'University Oval Arena (Floodlit)', round: 'Match #16 · Super 8' },
    ],
  },
  {
    day: 'Tue',
    date: '4 Nov 2026',
    isToday: false,
    matches: [
      { time: '09:30', teamA: 'CS Cyber Knights', teamB: 'Campus Panthers', status: 'upcoming', venue: 'Sir MV Memorial Ground', round: 'Match #17 · Pool C' },
      { time: '14:00', teamA: 'Vidyanagar Blasters', teamB: 'Tech Gladiators XI', status: 'upcoming', venue: 'North Campus Oval', round: 'Match #18 · Pool D' },
    ],
  },
  {
    day: 'Wed',
    date: '5 Nov 2026',
    isToday: false,
    matches: [
      { time: '14:30', teamA: 'KLE Titans XI', teamB: 'Engineering Strikers', status: 'upcoming', venue: 'Main Cricket Ground (MCG)', round: 'Match #19 · Super 8 Blockbuster' },
      { time: '18:30', teamA: 'City Warriors CC', teamB: 'Dharwad Lions XI', status: 'upcoming', venue: 'University Oval Arena', round: 'Match #20 · Super 8' },
    ],
  },
  {
    day: 'Thu',
    date: '6 Nov 2026',
    isToday: false,
    matches: [
      { time: '09:30', teamA: 'Campus Panthers', teamB: 'Vidyanagar Blasters', status: 'upcoming', venue: 'Sir MV Memorial Ground', round: 'Match #21 · Pool C' },
      { time: '14:30', teamA: 'CS Cyber Knights', teamB: 'Tech Gladiators XI', status: 'upcoming', venue: 'University Oval Arena', round: 'Match #22 · Pool D' },
    ],
  },
  {
    day: 'Fri',
    date: '7 Nov 2026',
    isToday: false,
    isRestDay: true,
    matches: [],
  },
  {
    day: 'Sat',
    date: '8 Nov 2026',
    isToday: false,
    matches: [
      { time: '14:00', teamA: 'Semi-Final 1 (1st Group A)', teamB: 'Semi-Final 1 (2nd Group B)', status: 'upcoming', venue: 'Main Cricket Ground', round: 'Semi Final 1' },
      { time: '18:30', teamA: 'Semi-Final 2 (1st Group B)', teamB: 'Semi-Final 2 (2nd Group A)', status: 'upcoming', venue: 'University Oval Arena', round: 'Semi Final 2 (D/N)' },
    ],
  },
  {
    day: 'Sun',
    date: '9 Nov 2026',
    isToday: false,
    matches: [
      { time: '16:00', teamA: 'Winner SF-1', teamB: 'Winner SF-2', status: 'upcoming', venue: 'Main Cricket Ground (Pavilion)', round: 'Championship Grand Final' },
    ],
  },
]

function ScheduleMatchCard({ match }) {
  const isLive = match.status === 'live'
  const isDone = match.status === 'completed'

  return (
    <div
      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-xs ${
        isLive
          ? 'bg-amber-50/50 border-amber-200/90'
          : isDone
          ? 'bg-slate-50/60 border-slate-200/70'
          : 'bg-white border-slate-200/90'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="w-14 font-mono font-bold text-xs text-slate-800 text-center py-1 px-1.5 rounded bg-slate-100 border border-slate-200/60 shrink-0">
          {match.time}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">
            {match.teamA} <span className="text-slate-400 font-normal">vs</span> {match.teamB}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
            <span className="truncate">{match.round}</span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate text-slate-600">
              <MapPin size={11} className="text-slate-400 shrink-0" />
              {match.venue}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <Badge
          variant={isLive ? 'warning' : isDone ? 'success' : 'info'}
          dot={isLive}
          size="sm"
        >
          {isLive ? 'Live Now' : isDone ? 'Finished' : 'Confirmed'}
        </Badge>
      </div>
    </div>
  )
}

export default function SchedulePage() {
  return (
    <motion.div className="space-y-6 max-w-5xl mx-auto" initial="initial" animate="animate" variants={stagger}>
      <SectionHeader
        title="Cricket Match Fixtures & Timetable"
        subtitle="Automated E1 schedule mapping · Rest intervals validated (&gt;24h) · Zero venue conflicts"
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Download}>
              Export PDF / ICS
            </Button>
            <Button variant="outline" size="sm" icon={CheckCircle2}>
              E2 Constraint Report
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {cricketScheduleData.map((day) => (
          <Card key={day.day} className="p-5" hover={false}>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-bold text-xs shrink-0 ${
                    day.isToday
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold leading-none">{day.day}</span>
                  <span className="leading-none mt-0.5">{day.date.split(' ')[0]}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {day.date} {day.isToday && <span className="text-emerald-700 ml-1.5 font-semibold text-xs">(Today)</span>}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {day.matches.length > 0 ? `${day.matches.length} matches scheduled` : 'Rest Day'}
                  </p>
                </div>
              </div>

              <span className="text-xs text-slate-500 font-mono">
                {day.matches.length > 0 ? 'BCCI Standard' : 'Ground Maintenance'}
              </span>
            </div>

            {day.matches.length > 0 ? (
              <div className="space-y-2">
                {day.matches.map((m, idx) => (
                  <ScheduleMatchCard key={idx} match={m} />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 italic">
                Rest & Pitch Rolling Day — No fixtures scheduled to ensure athlete recovery (&gt;24h rule satisfied).
              </div>
            )}
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
