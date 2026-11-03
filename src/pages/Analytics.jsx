/**
 * Analytics Page — Visual stats and performance metrics
 */

import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, Trophy, Target,
  ArrowUpRight, ArrowDownRight, Swords, Eye, Timer, Flame,
} from 'lucide-react'
import { Card, Badge, SectionHeader, StatCard, ProgressBar, Divider } from '../components/ui'
import { motionPresets } from '../design/tokens'

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }

const monthlyData = [
  { month: 'Jun', matches: 22, tournaments: 2 },
  { month: 'Jul', matches: 31, tournaments: 3 },
  { month: 'Aug', matches: 28, tournaments: 2 },
  { month: 'Sep', matches: 45, tournaments: 4 },
  { month: 'Oct', matches: 52, tournaments: 5 },
  { month: 'Nov', matches: 38, tournaments: 4 },
]

const sportDistribution = [
  { sport: 'Football', percentage: 40, color: 'arena', matches: 86 },
  { sport: 'E-Sports', percentage: 28, color: 'torch', matches: 60 },
  { sport: 'Cricket', percentage: 18, color: 'pending', matches: 39 },
  { sport: 'Tennis', percentage: 9, color: 'forfeit', matches: 19 },
  { sport: 'Others', percentage: 5, color: 'neutral', matches: 12 },
]

const topStats = [
  { label: 'Highest Scoring Match', value: 'Thunder FC vs City Wolves', detail: '7 – 5', icon: Flame },
  { label: 'Most Active Team', value: 'Thunder FC', detail: '18 matches played', icon: Swords },
  { label: 'Longest Win Streak', value: 'Phantom X', detail: '9 consecutive', icon: TrendingUp },
  { label: 'Most Spectated', value: 'Premier League Final', detail: '24,500 viewers', icon: Eye },
]

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
  const maxMatches = Math.max(...monthlyData.map(d => d.matches))

  return (
    <motion.div
      className="space-y-6"
      initial="initial"
      animate="animate"
      variants={stagger}
    >
      <SectionHeader
        title="Analytics"
        subtitle="Performance insights across all tournaments"
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Swords} label="Total Matches" value="216" change={18} trend="up" />
        <StatCard icon={Trophy} label="Tournaments Run" value="14" change={8} trend="up" />
        <StatCard icon={Users} label="Total Teams" value="92" change={12} trend="up" />
        <StatCard icon={Timer} label="Avg Match Duration" value="47m" change={5} trend="down" />
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
          <h3 className="text-base font-bold text-ink-100 mb-1">Sport Distribution</h3>
          <p className="text-xs text-ink-500 mb-6">Matches by sport category</p>
          <div className="space-y-4">
            {sportDistribution.map(sport => (
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

