/**
 * Analytics Page — Visual stats and performance metrics
 */

import { motion } from 'framer-motion'
import {
  TrendingUp, Users, Trophy, Swords, Eye, Timer, Flame,
} from 'lucide-react'
import { Card, SectionHeader, StatCard } from '../components/ui'
import { motionPresets } from '../design/tokens'
import { useTournamentSetup } from '../context/TournamentSetupContext'

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }

function MiniBarChart({ data, max }) {
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, i) => (
        <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div
            className="w-full rounded-t-md bg-gradient-to-t from-arena-600 to-arena-400 relative group cursor-pointer"
            initial={{ height: 0 }}
            animate={{ height: `${(item.matches / max) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-700 text-ink-100 text-[10px] font-mono px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {item.matches} matches
            </div>
          </motion.div>
          <span className="text-[11px] text-ink-500 font-medium">{item.month}</span>
        </div>
      ))}
    </div>
  )
}

function SportDistributionBar({ sport }) {
  const colorMap = {
    arena:   'from-arena-600 to-arena-400',
    torch:   'from-torch-600 to-torch-400',
    pending: 'from-pending to-blue-400',
    forfeit: 'from-forfeit to-purple-400',
    neutral: 'from-ink-600 to-ink-500',
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-ink-300 font-medium truncate">{sport.sport}</span>
      <div className="flex-1 h-2.5 bg-ink-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colorMap[sport.color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${sport.percentage}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="w-10 text-right font-mono text-sm text-ink-200">{sport.percentage}%</span>
      <span className="w-12 text-right text-xs text-ink-500">{sport.matches}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { tournaments, teams, matches, matchConfig } = useTournamentSetup()
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 5 + index, 1))
    return { key: date.toISOString().slice(0, 7), month: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) }
  })
  const monthlyData = months.map(({ key, month }) => ({
    month,
    matches: matches.filter((match) => match.date.startsWith(key)).length,
    tournaments: tournaments.filter((tournament) => tournament.startDate?.startsWith(key)).length,
  }))
  const formats = [...new Set(tournaments.map((tournament) => tournament.format))]
  const formatDistribution = formats.map((format, index) => {
    const count = tournaments.filter((tournament) => tournament.format === format).length
    return {
      sport: format,
      percentage: tournaments.length ? Math.round((count / tournaments.length) * 100) : 0,
      color: ['arena', 'torch', 'pending', 'forfeit', 'neutral'][index % 5],
      matches: matches.filter((match) => tournaments.some((tournament) => tournament.format === format && tournament.id === match.tournamentId)).length,
    }
  })
  const completedMatches = matches.filter((match) => match.status === 'Completed')
  const highestScoringMatch = completedMatches.reduce((highest, match) => {
    const runs = Number(match.scoreA || 0) + Number(match.scoreB || 0)
    return !highest || runs > highest.runs ? { match, runs } : highest
  }, null)
  const teamMatchCounts = teams.map((team) => ({
    team,
    count: matches.filter((match) => match.teamA === team.name || match.teamB === team.name).length,
  })).sort((left, right) => right.count - left.count)
  const venueMatchCounts = [...new Set(matches.map((match) => match.stadium))].map((venue) => ({
    venue,
    count: matches.filter((match) => match.stadium === venue).length,
  })).sort((left, right) => right.count - left.count)
  const officialsCount = [...new Set(matches.flatMap((match) => match.officials || []))].length
  const topStats = [
    { label: 'Highest Scoring Match', value: highestScoringMatch ? `${highestScoringMatch.match.teamA} vs ${highestScoringMatch.match.teamB}` : 'No results entered', detail: highestScoringMatch ? `${highestScoringMatch.match.scoreA} – ${highestScoringMatch.match.scoreB} · ${highestScoringMatch.runs} runs` : 'Enter a result to populate this record', icon: Flame },
    { label: 'Most Active Team', value: teamMatchCounts[0]?.team.name || 'No teams registered', detail: `${teamMatchCounts[0]?.count || 0} scheduled or completed fixtures`, icon: Swords },
    { label: 'Most Used Ground', value: venueMatchCounts[0]?.venue || 'No fixtures assigned', detail: `${venueMatchCounts[0]?.count || 0} assigned fixtures`, icon: TrendingUp },
    { label: 'Officials Assigned', value: String(officialsCount), detail: 'Unique sample officials in fixtures', icon: Eye },
  ]
  const maxMatches = Math.max(1, ...monthlyData.map((item) => item.matches))

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      <SectionHeader
        title="Analytics"
        subtitle="Performance insights from saved cricket demonstration data"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Swords} label="Total Fixtures" value={String(matches.length)} />
        <StatCard icon={Trophy} label="Tournaments" value={String(tournaments.length)} />
        <StatCard icon={Users} label="Registered Teams" value={String(teams.length)} />
        <StatCard icon={Timer} label="Match Slot Budget" value={`${matchConfig.matchDurationMinutes || 180}m`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly matches chart */}
        <Card className="p-6" hover={false}>
          <h3 className="text-base font-bold text-ink-100 mb-1">Monthly Matches</h3>
          <p className="text-xs text-ink-500 mb-6">Match volume over the last 6 months</p>
          <MiniBarChart data={monthlyData} max={maxMatches} />
        </Card>

        {/* Sport Distribution */}
        <Card className="p-6" hover={false}>
          <h3 className="text-base font-bold text-ink-100 mb-1">Tournament Formats</h3>
          <p className="text-xs text-ink-500 mb-6">Fixtures grouped by cricket format</p>
          <div className="space-y-4">
            {formatDistribution.map(sport => (
              <SportDistributionBar key={sport.sport} sport={sport} />
            ))}
          </div>
        </Card>
      </div>

      {/* Notable Stats */}
      <SectionHeader title="Notable Records" subtitle="Standout performances and milestones" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-torch-glow flex items-center justify-center">
                <stat.icon size={16} className="text-torch-400" />
              </div>
              <span className="text-xs text-ink-500 font-medium">{stat.label}</span>
            </div>
            <p className="text-sm font-bold text-ink-100 mb-0.5">{stat.value}</p>
            <p className="text-xs text-ink-400 font-mono">{stat.detail}</p>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}
