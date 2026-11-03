/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 5: Officials Registration
 * ══════════════════════════════════════════════════════════════
 *  Dedicated form for BCCI/University-certified Umpires,
 *  Match Referees, and Official Scorers.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldAlert,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Award,
  AlertCircle,
} from 'lucide-react'
import { Card, Button, Input, SectionHeader, Badge, Avatar } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { motionPresets } from '../../design/tokens'

const initialOfficials = [
  { id: 'off-1', name: 'R. Kulkarni', role: 'Lead On-field Umpire', cert: 'BCCI Level-2 Certified', matches: 12 },
  { id: 'off-2', name: 'S. Patil', role: 'Square Leg Umpire', cert: 'State Panel Certified', matches: 8 },
  { id: 'off-3', name: 'M. V. Joshi', role: 'Senior Match Referee', cert: 'Former First-Class Cricketer', matches: 24 },
  { id: 'off-4', name: 'A. Rao', role: 'On-field Umpire', cert: 'BCCI Level-1 Certified', matches: 6 },
  { id: 'off-5', name: 'V. Hegde', role: 'Third TV / Reserve Umpire', cert: 'State Panel Certified', matches: 9 },
  { id: 'off-6', name: 'G. Deshpande', role: 'Match Referee', cert: 'University Panel Chief', matches: 15 },
]

export default function OfficialsRegistrationPage() {
  const navigate = useNavigate()
  const { setupState, updateStepStatus } = useTournamentSetup()

  const [officials, setOfficials] = useState(initialOfficials)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newOfficial, setNewOfficial] = useState({
    name: '',
    role: 'On-field Umpire',
    cert: 'State Panel Certified',
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newOfficial.name) return
    setOfficials([
      ...officials,
      { ...newOfficial, id: `off-${Date.now()}`, matches: 0 },
    ])
    setShowAddForm(false)
    setNewOfficial({ name: '', role: 'On-field Umpire', cert: 'State Panel Certified' })
  }

  const handleComplete = () => {
    updateStepStatus('officials', 'Completed')
    navigate('/availability')
  }

  return (
    <motion.div className="space-y-6 max-w-5xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            5/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Step 5
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              Match Officials & Umpire Panel Accreditation
            </h2>
          </div>
        </div>

        <Badge
          variant={setupState.stepStatus.officials === 'Completed' ? 'success' : 'warning'}
          dot
        >
          {setupState.stepStatus.officials}
        </Badge>
      </div>

      {/* Requirement Notice Box */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">E2 Engine Roster Requirement:</span>
          <p className="mt-0.5 leading-relaxed text-amber-800">
            For a tournament running across 4 stadiums simultaneously, the scheduling engine requires at least <strong>8 certified on-field umpires</strong> and <strong>2 accredited match referees</strong> to avoid fatigue clashes. Currently registered: <strong>{officials.length} officials</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Registered Panel of Officials</h2>
          <p className="text-xs text-slate-500">
            Certified personnel assigned for match officiating and dispute resolution
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Close Form' : 'Register Official'}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="p-6 bg-slate-50 border-emerald-200" hover={false}>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Register Umpire / Referee
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Full Name *"
                value={newOfficial.name}
                onChange={(e) => setNewOfficial({ ...newOfficial, name: e.target.value })}
                placeholder="e.g. K. Prasad"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Role
                </label>
                <select
                  value={newOfficial.role}
                  onChange={(e) => setNewOfficial({ ...newOfficial, role: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg shadow-xs"
                >
                  <option value="Lead On-field Umpire">Lead On-field Umpire</option>
                  <option value="Square Leg Umpire">Square Leg Umpire</option>
                  <option value="Senior Match Referee">Senior Match Referee</option>
                  <option value="Third TV / Reserve Umpire">Third TV / Reserve Umpire</option>
                  <option value="Official Scorer">Official Scorer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Certification Level
                </label>
                <select
                  value={newOfficial.cert}
                  onChange={(e) => setNewOfficial({ ...newOfficial, cert: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg shadow-xs"
                >
                  <option value="BCCI Level-2 Certified">BCCI Level-2 Certified</option>
                  <option value="BCCI Level-1 Certified">BCCI Level-1 Certified</option>
                  <option value="State Panel Certified">State Panel Certified</option>
                  <option value="University Panel Certified">University Panel Certified</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="xs" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="xs">
                Add Official
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Grid of Officials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {officials.map((official) => (
          <Card key={official.id} className="p-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={official.name} size="md" color="bg-slate-800" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{official.name}</p>
                <p className="text-xs text-emerald-700 font-medium truncate">{official.role}</p>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {official.cert}
                </span>
              </div>
            </div>

            <button
              onClick={() => setOfficials(officials.filter((o) => o.id !== official.id))}
              className="text-slate-400 hover:text-red-600 transition-colors p-1"
              title="Remove Official"
            >
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/stadiums')}
        >
          Back to Stadiums
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          iconRight={ArrowRight}
          onClick={handleComplete}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          Save & Proceed to Availability Configuration
        </Button>
      </div>
    </motion.div>
  )
}
