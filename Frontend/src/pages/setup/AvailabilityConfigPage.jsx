/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 6: Availability Configuration
 * ══════════════════════════════════════════════════════════════
 *  Dedicated form for venue blackout days, match slot windows,
 *  and pitch rolling intervals.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card, Button, Input, SectionHeader, Badge } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { motionPresets } from '../../design/tokens'

export default function AvailabilityConfigPage() {
  const navigate = useNavigate()
  const { setupState, availability, saveAvailability, updateStepStatus } = useTournamentSetup()

  return <AvailabilityConfigurationForm initial={availability} status={setupState.stepStatus.availability}
    onBack={() => navigate('/officials')} onSave={(slots) => {
      saveAvailability(slots)
      updateStepStatus('availability', 'Completed')
      navigate('/setup/constraints')
    }} />
}

export function AvailabilityConfigurationForm({ initial, status, onSave, onBack, live, saving,
  renderWindows, scopedControls, feedback }) {
  const [slots, setSlots] = useState(initial)

  return (
    <motion.div className="space-y-6 max-w-4xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            6/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Step 6
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              {live ? 'Resource Time Slots & Blackout Windows' : 'Stadium Time Slots & Ground Maintenance Windows'}
            </h2>
          </div>
        </div>

        <Badge
          variant={status === 'Completed' ? 'success' : 'warning'}
          dot
        >
          {status}
        </Badge>
      </div>

      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Daily Match Slot Windows"
          subtitle={live ? 'Save explicit availability and blackout periods for the selected resource.'
            : 'Record preferred time windows and blackout dates; scheduling does not validate or allocate these inputs here.'}
        />

        {scopedControls}
        <form onSubmit={(e) => { e.preventDefault(); onSave(slots, e.nativeEvent.submitter?.value !== 'stay') }}
          className="space-y-6 mt-4">
          <fieldset disabled={saving} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Morning Slot */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Morning Session</span>
                {!live && <Badge variant="success" size="sm">Active</Badge>}
              </div>
              <Input
                label="Start Time"
                type="time"
                value={slots.morningStart}
                onChange={(e) => setSlots({ ...slots, morningStart: e.target.value })}
              />
              <Input
                label="End Cutoff"
                type="time"
                value={slots.morningEnd}
                onChange={(e) => setSlots({ ...slots, morningEnd: e.target.value })}
              />
            </div>

            {/* Afternoon Slot */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Afternoon Session</span>
                {!live && <Badge variant="success" size="sm">Active</Badge>}
              </div>
              <Input
                label="Start Time"
                type="time"
                value={slots.afternoonStart}
                onChange={(e) => setSlots({ ...slots, afternoonStart: e.target.value })}
              />
              <Input
                label="End Cutoff"
                type="time"
                value={slots.afternoonEnd}
                onChange={(e) => setSlots({ ...slots, afternoonEnd: e.target.value })}
              />
            </div>

            {/* Night Slot */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Night Floodlight Session</span>
                {(!live || live.stadium) && <Badge variant="warning" size="sm">Floodlit Only</Badge>}
              </div>
              <Input
                label="Start Time"
                type="time"
                disabled={Boolean(live && !live.allowNight)}
                value={slots.nightStart}
                onChange={(e) => setSlots({ ...slots, nightStart: e.target.value })}
              />
              <Input
                label="End Cutoff"
                type="time"
                value={slots.nightEnd}
                onChange={(e) => setSlots({ ...slots, nightEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Pitch Rest Periods & Blackout Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Minimum Turf Track Rest Interval (Hours)"
                  disabled={Boolean(live)}
                  type="number"
                  value={slots.pitchRestHours}
                  onChange={(e) => setSlots({ ...slots, pitchRestHours: Number(e.target.value) })}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {live ? 'Pitch rest is a demo preference.' : 'Prevents pitch deterioration between heavy consecutive matches'}
                </p>
              </div>

              <div>
                <Input
                  label="Rain Contingency / Reserve Day"
                  disabled={Boolean(live)}
                  value={slots.reserveDay}
                  onChange={(e) => setSlots({ ...slots, reserveDay: e.target.value })}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {live ? 'Use a blackout period below to block assignments on a date.' : 'Reserved for knockout replays in case of inclement Hubballi weather'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <Input
                label={live ? "Apply sessions from" : "Tournament start date"}
                min={live?.startDate} max={live?.endDate}
                type="date"
                value={slots.startDate}
                onChange={(e) => setSlots({ ...slots, startDate: e.target.value })}
                required={!live}
              />
              <Input
                label={live ? "Apply sessions through" : "Tournament end date"}
                max={live?.endDate}
                type="date"
                value={slots.endDate}
                min={slots.startDate}
                onChange={(e) => setSlots({ ...slots, endDate: e.target.value })}
                required={!live}
              />
              <div>
                <Input
                  label="Weekly rest day"
                  disabled={Boolean(live)}
                  value={slots.weeklyRestDay}
                  onChange={(e) => setSlots({ ...slots, weeklyRestDay: e.target.value })}
                  placeholder="Friday"
                />
                <p className="text-[11px] text-slate-500 mt-1">{live ? 'Weekly rest is a demo preference.' : 'The demo fixture generator skips this weekday.'}</p>
              </div>
              <div>
                <Input
                  label="Minimum team recovery (hours)"
                  disabled={Boolean(live)}
                  type="number"
                  min="0"
                  max="168"
                  value={slots.teamRecoveryHours}
                  onChange={(e) => setSlots({ ...slots, teamRecoveryHours: Number(e.target.value) })}
                />
                <p className="text-[11px] text-slate-500 mt-1">{live ? 'Set team recovery in Scheduling Constraints.' : 'Stored as a schedule preference for the demonstration.'}</p>
              </div>
            </div>
          </div>

          {renderWindows?.(slots)}
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
              Back to Officials
            </Button>

            {live && <Button type="submit" variant="secondary" size="sm" value="stay" disabled={saving}>
              Save Availability
            </Button>}
            <Button
              type="submit"
              disabled={saving}
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {saving ? 'Saving…' : 'Save & Proceed to Scheduling Constraints'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
