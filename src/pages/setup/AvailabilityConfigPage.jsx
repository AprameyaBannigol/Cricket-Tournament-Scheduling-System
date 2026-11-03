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
  const { setupState, updateStepStatus } = useTournamentSetup()

  const [slots, setSlots] = useState({
    morningSlot: true,
    morningStart: '09:30',
    morningEnd: '13:00',
    afternoonSlot: true,
    afternoonStart: '14:00',
    afternoonEnd: '17:30',
    nightSlot: true,
    nightStart: '18:30',
    nightEnd: '22:00',
    pitchRestHours: 24,
    mcgBlackoutDay: 'Friday (Weekly Rolling)',
    reserveDay: '2026-11-19 (Post Final Reserve)',
  })

  const handleSave = (e) => {
    e.preventDefault()
    updateStepStatus('availability', 'Completed')
    navigate('/setup/constraints')
  }

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
              Stadium Time Slots & Ground Maintenance Windows
            </h2>
          </div>
        </div>

        <Badge
          variant={setupState.stepStatus.availability === 'Completed' ? 'success' : 'warning'}
          dot
        >
          {setupState.stepStatus.availability}
        </Badge>
      </div>

      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Daily Match Slot Windows"
          subtitle="Define time boundaries for E1 Engine to schedule fixtures without overlapping twilight"
        />

        <form onSubmit={handleSave} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Morning Slot */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Morning Session</span>
                <Badge variant="success" size="sm">Active</Badge>
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
                <Badge variant="success" size="sm">Active</Badge>
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
                <Badge variant="warning" size="sm">Floodlit Only</Badge>
              </div>
              <Input
                label="Start Time"
                type="time"
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
                  type="number"
                  value={slots.pitchRestHours}
                  onChange={(e) => setSlots({ ...slots, pitchRestHours: Number(e.target.value) })}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Prevents pitch deterioration between heavy consecutive matches
                </p>
              </div>

              <div>
                <Input
                  label="Rain Contingency / Reserve Day"
                  value={slots.reserveDay}
                  onChange={(e) => setSlots({ ...slots, reserveDay: e.target.value })}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Reserved for knockout replays in case of inclement Hubballi weather
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/officials')}
            >
              Back to Officials
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Save & Proceed to Scheduling Constraints
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
