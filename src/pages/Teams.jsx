/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 2: Team Registration & Roster Verification
 * ══════════════════════════════════════════════════════════════
 *  Manages collegiate cricket team registrations, verified squads,
 *  player eligibility, and pool allocations.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Plus,
  Trophy,
  Swords,
  TrendingUp,
  Search,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { Card, Badge, Button, SectionHeader, Avatar, ProgressBar, Input } from '../components/ui'
import { useTournamentSetup } from '../context/TournamentSetupContext'
import { motionPresets } from '../design/tokens'

const stagger = { animate: { transition: { staggerChildren: 0.05 } } }

const collegiateCricketTeams = [
  {
    id: 'tm-1',
    name: 'KLE Titans XI',
    college: 'KLE Technological University',
    department: 'Main Campus XI',
    captain: 'Aditya Kulkarni',
    coach: 'P. M. Nadiger',
    squadSize: 15,
    pool: 'Pool A (Seeded #1)',
    color: 'bg-emerald-700',
    initials: 'KT',
    status: 'Verified',
  },
  {
    id: 'tm-2',
    name: 'City Warriors Cricket Club',
    college: 'Hubballi Sports Academy',
    department: 'Affiliated Club',
    captain: 'Rohan Deshpande',
    coach: 'K. S. Patil',
    squadSize: 15,
    pool: 'Pool A',
    color: 'bg-blue-700',
    initials: 'CW',
    status: 'Verified',
  },
  {
    id: 'tm-3',
    name: 'Engineering Strikers',
    college: 'School of Mechanical & Civil',
    department: 'Faculty of Engineering',
    captain: 'Sameer Joshi',
    coach: 'V. B. Hegde',
    squadSize: 15,
    pool: 'Pool B (Seeded #2)',
    color: 'bg-purple-700',
    initials: 'ES',
    status: 'Verified',
  },
  {
    id: 'tm-4',
    name: 'Dharwad Lions XI',
    college: 'Govt. Engineering College',
    department: 'Inter-Collegiate XI',
    captain: 'Praveen Shetty',
    coach: 'R. M. Hiremath',
    squadSize: 14,
    pool: 'Pool B',
    color: 'bg-amber-600',
    initials: 'DL',
    status: 'Verified',
  },
  {
    id: 'tm-5',
    name: 'CS Cyber Knights',
    college: 'School of Computer Science',
    department: 'Dept of CSE & AI',
    captain: 'Nikhil Rao',
    coach: 'Dr. G. K. Hiremath',
    squadSize: 15,
    pool: 'Pool C',
    color: 'bg-indigo-700',
    initials: 'CK',
    status: 'Verified',
  },
  {
    id: 'tm-6',
    name: 'Campus Panthers',
    college: 'Institute of Management Studies',
    department: 'MBA & Commerce XI',
    captain: 'Varun Desai',
    coach: 'S. N. Joshi',
    squadSize: 15,
    pool: 'Pool C',
    color: 'bg-rose-700',
    initials: 'CP',
    status: 'Verified',
  },
  {
    id: 'tm-7',
    name: 'Vidyanagar Blasters',
    college: 'KLE Polytechnic Campus',
    department: 'Polytechnic XI',
    captain: 'Chetan Patil',
    coach: 'A. K. Dharwadkar',
    squadSize: 15,
    pool: 'Pool D',
    color: 'bg-teal-700',
    initials: 'VB',
    status: 'Verified',
  },
  {
    id: 'tm-8',
    name: 'Tech Gladiators XI',
    college: 'Biotech & Robotics Faculty',
    department: 'Applied Sciences XI',
    captain: 'Manish Hegde',
    coach: 'P. R. Shinde',
    squadSize: 14,
    pool: 'Pool D',
    color: 'bg-slate-700',
    initials: 'TG',
    status: 'Verified',
  },
]

export default function TeamsPage() {
  const navigate = useNavigate()
  const { setupState, updateStepStatus } = useTournamentSetup()

  const [teams, setTeams] = useState(collegiateCricketTeams)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: '',
    college: '',
    department: '',
    captain: '',
    squadSize: 15,
    pool: 'Pool A',
  })

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.college.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddTeam = (e) => {
    e.preventDefault()
    if (!newTeam.name) return
    const teamObj = {
      ...newTeam,
      id: `tm-${Date.now()}`,
      coach: 'Assigned',
      color: 'bg-slate-800',
      initials: newTeam.name.slice(0, 2).toUpperCase(),
      status: 'Verified',
    }
    setTeams([...teams, teamObj])
    setShowAddForm(false)
    setNewTeam({ name: '', college: '', department: '', captain: '', squadSize: 15, pool: 'Pool A' })
  }

  const handleProceed = () => {
    updateStepStatus('teams', 'Completed')
    navigate('/setup/match-config')
  }

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
      {/* Top Setup Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            2/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Step 2
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              Collegiate Team Registration & Eligibility Verification
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" dot>
            {setupState.stepStatus.teams}
          </Badge>
          <Button
            variant="primary"
            size="sm"
            onClick={handleProceed}
            iconRight={ArrowRight}
            className="hidden sm:inline-flex bg-emerald-700 hover:bg-emerald-800"
          >
            Save & Proceed to Match Rules
          </Button>
        </div>
      </div>

      {/* Header */}
      <SectionHeader
        title="Registered Cricket Teams"
        subtitle={`${teams.length} verified collegiate squads ready for schedule allocation (minimum 8 required)`}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Close Form' : 'Register College Team'}
          </Button>
        }
      />

      {/* Add Team Modal/Form */}
      {showAddForm && (
        <Card className="p-6 bg-slate-50 border-emerald-200" hover={false}>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Register New Participating College Team
          </h3>
          <form onSubmit={handleAddTeam} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Team Official Title *"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g. BVB Cricket Titans"
                required
              />
              <Input
                label="College / Institution *"
                value={newTeam.college}
                onChange={(e) => setNewTeam({ ...newTeam, college: e.target.value })}
                placeholder="e.g. KLE Tech University"
                required
              />
              <Input
                label="Department"
                value={newTeam.department}
                onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
                placeholder="e.g. School of Architecture"
              />
              <Input
                label="Captain Name"
                value={newTeam.captain}
                onChange={(e) => setNewTeam({ ...newTeam, captain: e.target.value })}
                placeholder="e.g. R. Sharma"
              />
              <Input
                label="Verified Squad Size"
                type="number"
                min="11"
                max="20"
                value={newTeam.squadSize}
                onChange={(e) => setNewTeam({ ...newTeam, squadSize: Number(e.target.value) })}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seeded Pool
                </label>
                <select
                  value={newTeam.pool}
                  onChange={(e) => setNewTeam({ ...newTeam, pool: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg shadow-xs"
                >
                  <option value="Pool A">Pool A</option>
                  <option value="Pool B">Pool B</option>
                  <option value="Pool C">Pool C</option>
                  <option value="Pool D">Pool D</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="xs" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="xs">
                Save & Verify Team
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter / Search Bar */}
      <Card className="p-3.5" hover={false}>
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name, college, or captain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-xs"
          />
        </div>
      </Card>

      {/* Teams Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={stagger}>
        {filteredTeams.map((team) => (
          <Card key={team.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3 mb-3">
                <Avatar
                  name={team.name}
                  initials={team.initials}
                  size="md"
                  color={team.color}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{team.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{team.college}</p>
                </div>
              </div>

              <div className="space-y-1.5 py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Captain</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                    {team.captain}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Squad</span>
                  <span className="font-semibold text-slate-800">{team.squadSize} Players</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allocation</span>
                  <span className="font-semibold text-emerald-700">{team.pool}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck size={13} className="text-emerald-600" />
                Verified
              </span>
              <span className="text-[11px] text-slate-400">Roster Locked</span>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Bottom Navigation Step Bar */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/setup/details')}
        >
          Back to Tournament Details
        </Button>

        <Button
          variant="primary"
          size="md"
          iconRight={ArrowRight}
          onClick={handleProceed}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          Save & Proceed to Match Rules (Step 3)
        </Button>
      </div>
    </motion.div>
  )
}
