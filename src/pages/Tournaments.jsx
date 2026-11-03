/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Tournaments Catalog Page (Light Theme)
 * ══════════════════════════════════════════════════════════════
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy,
  Search,
  Plus,
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  Grid3X3,
  List,
  Swords,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeader, ProgressBar, EmptyState } from '../components/ui'
import { tournaments } from '../data/mockData'
import { useTournamentSetup } from '../context/TournamentSetupContext'
import { motionPresets } from '../design/tokens'

const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

function TournamentCard({ tournament }) {
  const navigate = useNavigate()
  const statusConfig = {
    live:      { variant: 'warning', label: 'In Progress', dot: true },
    upcoming:  { variant: 'info', label: 'Upcoming', dot: false },
    completed: { variant: 'success', label: 'Completed', dot: false },
  }
  const { variant, label, dot } = statusConfig[tournament.status] || statusConfig.upcoming
  const progress = tournament.totalMatches > 0
    ? Math.round((tournament.matchesPlayed / tournament.totalMatches) * 100)
    : 0

  return (
    <Card className="p-0 overflow-hidden flex flex-col justify-between">
      <div>
        <div className={`h-1.5 ${
          tournament.status === 'live'
            ? 'bg-emerald-600'
            : tournament.status === 'upcoming'
            ? 'bg-blue-600'
            : 'bg-slate-300'
        }`} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                <Trophy size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {tournament.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {tournament.format}
                </p>
              </div>
            </div>

            <Badge variant={variant} dot={dot} size="sm">
              {label}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg my-3.5 border border-slate-100 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Teams</span>
              <span className="font-bold text-slate-900">{tournament.teams}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Matches</span>
              <span className="font-bold text-slate-900">
                {tournament.matchesPlayed}/{tournament.totalMatches}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Trophy</span>
              <span className="font-bold text-emerald-700 truncate block">
                {tournament.prize}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Fixture Progress</span>
              <span className="font-mono font-bold text-slate-800">{progress}%</span>
            </div>
            <ProgressBar value={tournament.matchesPlayed} max={tournament.totalMatches} color="emerald" height="h-1.5" />
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin size={12} className="text-slate-400 shrink-0" />
          <span className="truncate">{tournament.location}</span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
        >
          Manage <ChevronRight size={13} />
        </button>
      </div>
    </Card>
  )
}

export default function TournamentsPage() {
  const navigate = useNavigate()
  const { setCreateModalOpen } = useTournamentSetup()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = tournaments.filter((t) => {
    const matchesFilter = filter === 'all' || t.status === filter
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
      <SectionHeader
        title="Cricket Tournaments"
        subtitle="Manage ongoing tournaments and launch new championship setup workflows"
        action={
          <Button
            variant="primary"
            icon={Plus}
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            Create Tournament
          </Button>
        }
      />

      <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3" hover={false}>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tournaments by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {['all', 'live', 'upcoming', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === status
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((t) => (
          <TournamentCard key={t.id} tournament={t} />
        ))}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={Trophy}
          title="No tournaments found"
          description="Try adjusting your search criteria or initialize a new championship setup."
          action={
            <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
              Create Tournament
            </Button>
          }
        />
      )}
    </motion.div>
  )
}
