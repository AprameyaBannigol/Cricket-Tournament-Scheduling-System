/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 7: Scheduling Constraints
 * ══════════════════════════════════════════════════════════════
 *  Mathematical constraint parameters for E1 Optimizer &
 *  E2 Constraint Solver (rest periods, stadium clash limits).
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Cpu,
} from 'lucide-react'
import { Card, Button, Input, SectionHeader, Badge } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { motionPresets } from '../../design/tokens'

export default function ConstraintsPage() {
  const navigate = useNavigate()
  const { setupState, updateStepStatus } = useTournamentSetup()

  const [rules, setRules] = useState({
    minRestHours: 24,
    maxMatchesPerDayPerTeam: 1,
    maxMatchesPerGroundPerDay: 2,
    noBackToBackNightMorning: true,
    balancedHomeAway: true,
    fairVenueDistribution: true,
    umpireClashPrevention: true,
    reserveDayEnforcement: true,
  })

  const [saving, setSaving] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      updateStepStatus('constraints', 'Completed')
      setSaving(false)
      navigate('/')
    }, 500)
  }

  return (
    <motion.div className="space-y-6 max-w-4xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            7/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Final Step 7
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              Mathematical Scheduling Constraints ($E1$ & $E2$ Engine Rules)
            </h2>
          </div>
        </div>

        <Badge
          variant={setupState.stepStatus.constraints === 'Completed' ? 'success' : 'neutral'}
          dot
        >
          {setupState.stepStatus.constraints}
        </Badge>
      </div>

      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Optimization Rules & Hard Constraints"
          subtitle="The E2 constraint solver enforces these rules to ensure athlete recovery, fair travel, and pitch integrity"
        />

        <form onSubmit={handleSave} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <Input
                label="Min Team Rest Interval (Hours) *"
                type="number"
                min="12"
                max="72"
                value={rules.minRestHours}
                onChange={(e) => setRules({ ...rules, minRestHours: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Standard: &ge;24 hours between consecutive matches for any team
              </p>
            </div>

            <div>
              <Input
                label="Max Matches / Team / Day *"
                type="number"
                min="1"
                max="2"
                value={rules.maxMatchesPerDayPerTeam}
                onChange={(e) => setRules({ ...rules, maxMatchesPerDayPerTeam: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Collegiate athlete safety limit
              </p>
            </div>

            <div>
              <Input
                label="Max Matches / Stadium / Day *"
                type="number"
                min="1"
                max="3"
                value={rules.maxMatchesPerGroundPerDay}
                onChange={(e) => setRules({ ...rules, maxMatchesPerGroundPerDay: Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maintains turf pitch wear & tear limits
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Automated Solver Constraint Checks
            </h3>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={rules.noBackToBackNightMorning}
                  onChange={(e) => setRules({ ...rules, noBackToBackNightMorning: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Prevent Night-to-Morning Turnaround
                  </span>
                  <span className="text-[11px] text-slate-500">
                    A team concluding a 22:00 floodlit match cannot be scheduled for a 09:30 morning fixture next day.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={rules.balancedHomeAway}
                  onChange={(e) => setRules({ ...rules, balancedHomeAway: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Equitable Stadium & Pitch Track Allocation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Distribute premier pavilion MCG turf fixtures equally across all qualifying teams.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={rules.umpireClashPrevention}
                  onChange={(e) => setRules({ ...rules, umpireClashPrevention: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    BCCI Official Conflict of Interest Avoidance
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ensure officials never officiate matches featuring their parent college/department.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/availability')}
            >
              Back to Availability
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              iconRight={CheckCircle2}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {saving ? 'Validating Constraints...' : 'Complete Setup & Unlock Schedule Generation'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
