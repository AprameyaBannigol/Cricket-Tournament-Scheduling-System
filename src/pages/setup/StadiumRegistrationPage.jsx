/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 4: Stadium Registration
 * ══════════════════════════════════════════════════════════════
 *  Dedicated form and list for cricket grounds, pitch types,
 *  floodlights, and pavilion capacity.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Landmark,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Card, Button, Input, SectionHeader, Badge, ProgressBar } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { stadiums as defaultStadiums } from '../../data/mockData'
import { motionPresets } from '../../design/tokens'

export default function StadiumRegistrationPage() {
  const navigate = useNavigate()
  const { setupState, updateStepStatus } = useTournamentSetup()

  const [stadiumList, setStadiumList] = useState(defaultStadiums)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStadium, setNewStadium] = useState({
    name: '',
    shortName: '',
    type: 'Pavilion Turf (BCCI Standard)',
    capacity: '5,000 Capacity',
    floodlights: true,
    pitches: 2,
    curator: '',
    availabilityStatus: 'available',
    utilization: 0,
    statusDetail: 'Newly Registered Ground',
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newStadium.name) return
    const created = {
      ...newStadium,
      id: `std-${Date.now()}`,
    }
    setStadiumList([...stadiumList, created])
    setShowAddForm(false)
    setNewStadium({
      name: '',
      shortName: '',
      type: 'Pavilion Turf (BCCI Standard)',
      capacity: '5,000 Capacity',
      floodlights: true,
      pitches: 2,
      curator: '',
      availabilityStatus: 'available',
      utilization: 0,
      statusDetail: 'Newly Registered Ground',
    })
  }

  const handleComplete = () => {
    updateStepStatus('stadiums', 'Completed')
    navigate('/officials')
  }

  return (
    <motion.div className="space-y-6 max-w-5xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            4/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Step 4
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              Stadium Registration & Turf Pitch Certification
            </h2>
          </div>
        </div>

        <Badge variant="success" dot>
          {setupState.stepStatus.stadiums}
        </Badge>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Approved Cricket Venues</h2>
          <p className="text-xs text-slate-500">
            {stadiumList.length} Grounds currently certified for official tournament fixtures
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Close Form' : 'Register New Stadium'}
        </Button>
      </div>

      {/* Add Stadium Form */}
      {showAddForm && (
        <Card className="p-6 bg-slate-50/70 border-emerald-200" hover={false}>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Register Ground / Oval Specifications
          </h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Stadium Official Name *"
                value={newStadium.name}
                onChange={(e) => setNewStadium({ ...newStadium, name: e.target.value })}
                placeholder="e.g. South Campus Cricket Ground"
                required
              />
              <Input
                label="Abbreviation / Code"
                value={newStadium.shortName}
                onChange={(e) => setNewStadium({ ...newStadium, shortName: e.target.value })}
                placeholder="e.g. SCG"
              />
              <Input
                label="Spectator Capacity"
                value={newStadium.capacity}
                onChange={(e) => setNewStadium({ ...newStadium, capacity: e.target.value })}
                placeholder="e.g. 5,000"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wicket Track Type
                </label>
                <select
                  value={newStadium.type}
                  onChange={(e) => setNewStadium({ ...newStadium, type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg shadow-xs"
                >
                  <option value="Pavilion Turf (BCCI Standard)">Pavilion Turf (BCCI Standard)</option>
                  <option value="Bermuda Grass Turf Wicket">Bermuda Grass Turf Wicket</option>
                  <option value="Clay & Loam Natural Track">Clay & Loam Natural Track</option>
                  <option value="Coir Matting Surface">Coir Matting Surface</option>
                </select>
              </div>
              <Input
                label="Pitch Tracks Count"
                type="number"
                value={newStadium.pitches}
                onChange={(e) => setNewStadium({ ...newStadium, pitches: Number(e.target.value) })}
              />
              <Input
                label="Head Pitch Curator"
                value={newStadium.curator}
                onChange={(e) => setNewStadium({ ...newStadium, curator: e.target.value })}
                placeholder="e.g. R. Patil"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="floodlights"
                checked={newStadium.floodlights}
                onChange={(e) => setNewStadium({ ...newStadium, floodlights: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="floodlights" className="text-xs font-medium text-slate-700">
                Ground equipped with certified floodlights for Day/Night matches
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/60">
              <Button type="button" variant="secondary" size="xs" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="xs">
                Save Ground
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Registered Stadiums Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stadiumList.map((stadium) => (
          <Card key={stadium.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{stadium.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{stadium.type}</p>
                </div>
                <Badge variant={stadium.floodlights ? 'warning' : 'neutral'} size="sm">
                  {stadium.floodlights ? 'Floodlit D/N' : 'Day Only'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg my-3 border border-slate-100 text-xs text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Capacity</span>
                  <span className="font-bold text-slate-800">{stadium.capacity}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Pitches</span>
                  <span className="font-bold text-slate-800">{stadium.pitches} Tracks</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Curator</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {stadium.curator || 'Assigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>BCCI Certified Venue</span>
              </span>
              <button
                onClick={() => setStadiumList(stadiumList.filter((s) => s.id !== stadium.id))}
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                title="Remove Stadium"
              >
                <Trash2 size={14} />
              </button>
            </div>
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
          onClick={() => navigate('/setup/match-config')}
        >
          Back to Match Rules
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          iconRight={ArrowRight}
          onClick={handleComplete}
          className="bg-emerald-700 hover:bg-emerald-800"
        >
          Save & Proceed to Officials Registration
        </Button>
      </div>
    </motion.div>
  )
}
