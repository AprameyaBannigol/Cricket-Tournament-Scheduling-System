/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Layout Architecture (Light Theme)
 * ══════════════════════════════════════════════════════════════
 *  Refined Enterprise Layout: Grouped Navigation, Tournament Selector,
 *  Breadcrumbs, Search, Organizer Profile, and Collapsible Sidebar.
 */

import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Trophy,
  Users,
  Swords,
  Landmark,
  ShieldAlert,
  CalendarDays,
  Sparkles,
  CalendarRange,
  GitBranch,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  CheckCircle2,
  Clock,
  LogOut,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { Avatar, Badge, Button } from './ui'
import { activeTournament, tournamentOptions } from '../data/mockData'
import { useTournamentSetup } from '../context/TournamentSetupContext'

/* ─── Navigation Structure ─────────────────────────────────── */
const navGroups = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    ],
  },
  {
    group: 'TOURNAMENT MANAGEMENT',
    items: [
      { name: 'Tournaments', icon: Trophy, path: '/tournaments' },
      { name: 'Teams', icon: Users, path: '/teams' },
      { name: 'Matches', icon: Swords, path: '/matches' },
    ],
  },
  {
    group: 'RESOURCES',
    items: [
      { name: 'Stadiums', icon: Landmark, path: '/stadiums' },
      { name: 'Officials', icon: ShieldAlert, path: '/officials' },
      { name: 'Availability', icon: CalendarDays, path: '/availability' },
    ],
  },
  {
    group: 'SCHEDULING',
    items: [
      { name: 'Schedule Generator', icon: Sparkles, path: '/generator', badge: 'E1' },
      { name: 'Schedule Viewer', icon: CalendarRange, path: '/schedule' },
      { name: 'Schedule Versions', icon: GitBranch, path: '/versions', badge: 'v1.4' },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Settings', icon: Settings, path: '/settings' },
    ],
  },
]

/* ─── Sidebar Component ────────────────────────────────────── */
function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const { setupState, setCreateModalOpen } = useTournamentSetup()

  return (
    <motion.aside
      className={clsx(
        'fixed left-0 top-0 h-screen z-40 flex flex-col',
        'bg-slate-900 border-r border-slate-800 text-slate-300 shadow-xl',
        'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] select-none'
      )}
      style={{ width: collapsed ? 76 : 260 }}
    >
      {/* ── Brand Header ── */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/90 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/40">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="4" x2="17" y2="4" />
              <line x1="8" y1="4" x2="8" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
              <line x1="16" y1="4" x2="16" y2="20" />
            </svg>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-tight text-base">Tournament</span>
                  <span className="font-bold text-emerald-400 tracking-tight text-base">Hub</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                  Cricket Scheduling
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* ── Active Tournament Context Pill (When Expanded) ── */}
      {!collapsed && (
        <div className="mx-3 mt-3.5 mb-1 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-0.5">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ACTIVE TOURNAMENT
            </span>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 text-[10px] font-bold"
              title="Create new tournament setup"
            >
              <Plus size={12} /> New
            </button>
          </div>
          <p className="text-xs font-semibold text-white truncate" title={setupState.tournament.name}>
            {setupState.tournament.name}
          </p>
        </div>
      )}

      {/* ── Navigation List ── */}
      <nav className="flex-1 py-3 px-3 space-y-4 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {group.group}
              </p>
            )}
            {group.items.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  title={collapsed ? item.name : undefined}
                  className={clsx(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                    isActive
                      ? 'bg-emerald-600/90 text-white shadow-xs font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon
                      size={18}
                      className={clsx(
                        'shrink-0 transition-colors',
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                  </div>

                  {!collapsed && item.badge && (
                    <span
                      className={clsx(
                        'text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold',
                        isActive
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Organizer Profile Footer ── */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-900/95 shrink-0">
        <div
          className={clsx(
            'flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer',
            collapsed && 'justify-center p-1'
          )}
        >
          <Avatar
            name="Dr. R. Sharma"
            initials="RS"
            size="sm"
            color="bg-emerald-700"
          />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">Dr. R. Sharma</p>
              <p className="text-[11px] text-slate-400 truncate">KLE Sports Council</p>
            </div>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full mt-2 flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </motion.aside>
  )
}

/* ─── Top Navigation Bar ───────────────────────────────────── */
function TopBar({ sidebarCollapsed }) {
  const [tournamentOpen, setTournamentOpen] = useState(false)
  const { setupState, setCreateModalOpen, stats } = useTournamentSetup()

  return (
    <header
      className="fixed top-0 right-0 h-16 z-30 flex items-center justify-between px-6 border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs transition-all duration-300"
      style={{ left: sidebarCollapsed ? 76 : 260 }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>TournamentHub</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">Dashboard</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 leading-tight">
            Cricket Ops Management
          </h1>
        </div>

        <div className="h-7 w-[1px] bg-slate-200 hidden md:block" />

        {/* Tournament Switcher */}
        <div className="relative hidden md:block">
          <button
            onClick={() => setTournamentOpen(!tournamentOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 transition-all cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate max-w-[200px]">{setupState.tournament.name}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {tournamentOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-76 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Tournament
                </span>
                <button
                  onClick={() => {
                    setTournamentOpen(false)
                    setCreateModalOpen(true)
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <Plus size={12} /> New
                </button>
              </div>

              {tournamentOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTournamentOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer text-slate-700 hover:bg-slate-50"
                >
                  <span className="truncate">{opt.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden lg:block w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search matches, teams, venues..."
            className="w-full pl-8 pr-12 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 bg-white border border-slate-200 px-1 rounded font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Engine status indicator */}
        <div
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
            stats.isReady
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
              : 'bg-amber-50 text-amber-800 border-amber-200/80'
          }`}
        >
          {stats.isReady ? (
            <>
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>E1 Engine: Ready</span>
            </>
          ) : (
            <>
              <Clock size={13} className="text-amber-600" />
              <span>Setup: {stats.completed}/7 Done</span>
            </>
          )}
        </div>

        {/* Create Tournament Top Bar Button */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setCreateModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold shadow-xs hidden sm:inline-flex"
        >
          New Tournament
        </Button>

        <button
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <Avatar name="Dr. R. Sharma" initials="RS" size="sm" color="bg-slate-800" />
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-none">Dr. R. Sharma</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-none">Head of Scheduling</p>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─── Main Layout Wrapper ──────────────────────────────────── */
export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <TopBar sidebarCollapsed={collapsed} />
      <main
        className="flex-1 min-h-screen pt-16 transition-[margin-left] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: collapsed ? 76 : 260 }}
      >
        <div className="p-6 lg:p-8 max-w-[1560px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
