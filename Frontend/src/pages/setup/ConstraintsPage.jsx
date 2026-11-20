/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 7: Scheduling Constraints
 * ══════════════════════════════════════════════════════════════
 *  Scheduling preferences used in the local setup demonstration.
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
  const { setupState, constraints, saveConstraints, updateStepStatus } = useTournamentSetup()

  const initial = {
    minRestHours: constraints.minimumRecoveryHours,
    maxMatchesPerDayPerTeam: constraints.maxMatchesPerTeamPerDay,
    maxMatchesPerGroundPerDay: 2,
    noBackToBackNightMorning: true,
    balancedHomeAway: true,
    fairVenueDistribution: true,
    umpireClashPrevention: constraints.avoidOfficialBlackouts,
    reserveDayEnforcement: true,
    travelBufferHours: constraints.travelBufferHours,
  }

  return <SchedulingConstraintsForm initial={initial} status={setupState.stepStatus.constraints}
    onBack={() => navigate('/availability')} onSave={(rules) => {
      saveConstraints({
        ...rules,
        minimumRecoveryHours: rules.minRestHours,
        maxMatchesPerTeamPerDay: rules.maxMatchesPerDayPerTeam,
        avoidOfficialBlackouts: rules.umpireClashPrevention,
      })
      updateStepStatus('constraints', 'Completed')
      navigate('/schedule/generate')
    }} />
}

export function SchedulingConstraintsForm({ initial, status, onSave, onBack, live, saving, feedback }) {
  const [rules, setRules] = useState(initial)

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
              Scheduling Preferences
            </h2>
          </div>
        </div>

        <fieldset disabled={saving} className="max-w-xs">
          <Input
            label="Minimum team travel buffer (hours)"
            type="number"
            min="0"
            max={live ? undefined : 24}
            step={live ? "any" : undefined}
            form={live ? "scheduling-constraints-form" : undefined}
            required={live}
            value={rules.travelBufferHours}
            onChange={(e) => setRules({ ...rules, travelBufferHours: live ? e.target.value : Number(e.target.value) })}
          />
          <p className="text-[11px] text-slate-500 mt-1">{live
            ? 'When travel checks are enabled, every directed stadium pair needs a saved travel time. The larger of that time and this minimum applies.'
            : 'Stored as a local demo preference; travel times are not mapped.'}</p>
        </fieldset>

        <Badge
          variant={status === 'Completed' ? 'success' : 'neutral'}
          dot
        >
          {status}
        </Badge>
      </div>

      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Scheduling Preferences"
          subtitle="Record scheduling preferences for review. Constraint enforcement is not connected in this frontend."
        />

        <form id={live ? 'scheduling-constraints-form' : undefined}
          onSubmit={(e) => { e.preventDefault(); onSave(rules) }} className="space-y-6 mt-4">
          <fieldset disabled={saving} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <Input
                label="Min Team Rest Interval (Hours) *"
                type="number"
                min={live ? 0 : 12}
                max={live ? undefined : 72}
                step={live ? "any" : undefined}
                value={rules.minRestHours}
                onChange={(e) => setRules({ ...rules, minRestHours: live ? e.target.value : Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {live ? 'Minimum time from one match ending to the next match starting for the same team.'
                  : 'Preference only; no recovery validation is performed here.'}
              </p>
            </div>

            <div>
              <Input
                label="Max Matches / Team / Day *"
                type="number"
                min="1"
                max={live ? undefined : 2}
                value={rules.maxMatchesPerDayPerTeam}
                onChange={(e) => setRules({ ...rules, maxMatchesPerDayPerTeam: live ? e.target.value : Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Preference only; not enforced by an allocation engine here.
              </p>
            </div>

            <div>
              <Input
                label="Max Matches / Stadium / Day *"
                type="number"
                min="1"
                max={live ? undefined : 3}
                value={rules.maxMatchesPerGroundPerDay}
                onChange={(e) => setRules({ ...rules, maxMatchesPerGroundPerDay: live ? e.target.value : Number(e.target.value) })}
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Preference only; ground allocations are not generated here.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Scheduling Preferences
            </h3>

            <div className="space-y-3">
              {live && <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <input type="checkbox" checked={rules.travelConstraintEnabled}
                  onChange={(e) => setRules({ ...rules, travelConstraintEnabled: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span className="text-xs font-bold text-slate-800">Enable Team Travel Checks</span>
              </label>}
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
                    Record this preference for future schedule validation; it is not checked here.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  disabled={live}
                  checked={rules.balancedHomeAway}
                  onChange={(e) => setRules({ ...rules, balancedHomeAway: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Equitable Stadium & Pitch Track Allocation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {live ? 'Venue balancing is a demo preference.'
                      : 'This preference is not checked or applied to fixture allocation here.'}
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
                    {live ? 'Official Blackout Avoidance Preference' : 'BCCI Official Conflict of Interest Avoidance'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {live ? 'Saved as a preference. Explicit blackout windows always block assignments.'
                      : 'This preference is not checked or applied to officials here.'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          </fieldset>
          {feedback}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={onBack}
            >
              Back to Availability
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="primary"
              size="md"
              iconRight={CheckCircle2}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {saving ? 'Saving preferences...' : live ? 'Save & Proceed to Schedule Generation' : 'Save & generate sample fixtures'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
