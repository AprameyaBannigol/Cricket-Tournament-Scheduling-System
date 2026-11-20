/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 3: Match Configuration
 * ══════════════════════════════════════════════════════════════
 *  Dedicated form for cricket match formats, overs, powerplays,
 *  innings break intervals and points systems.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Swords,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Settings2,
  Shield,
} from 'lucide-react'
import { Card, Button, Input, SectionHeader, Badge } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { motionPresets } from '../../design/tokens'

export default function MatchConfigPage() {
  const navigate = useNavigate()
  const { setupState, matchConfig, saveMatchConfig, updateStepStatus } = useTournamentSetup()

  const initial = {
    format: matchConfig.format,
    oversPerInnings: matchConfig.oversPerInnings,
    maxBowlerOvers: matchConfig.maxBowlerOvers,
    powerplayOvers: matchConfig.powerplayOvers || '1 to 6',
    inningsBreakMinutes: matchConfig.inningsBreakMinutes || 15,
    matchDurationMinutes: matchConfig.matchDurationMinutes || 180,
    minOversForDLS: matchConfig.minOversForDLS || 5,
    pointsForWin: matchConfig.pointsForWin,
    pointsForTie: matchConfig.pointsForTie,
    pointsForLoss: matchConfig.pointsForLoss,
    superOver: matchConfig.superOver ?? true,
  }

  return <MatchConfigurationForm initial={initial} status={setupState.stepStatus.matches}
    onBack={() => navigate('/teams')} onSave={(config) => {
      saveMatchConfig(config)
      updateStepStatus('matches', 'Completed')
      navigate('/stadiums')
    }} />
}

export function MatchConfigurationForm({ initial, status, onSave, onBack, live, saving, feedback }) {
  const [config, setConfig] = useState(initial)

  return (
    <motion.div className="space-y-6 max-w-4xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            3/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Step 3
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              Match Rules, Overs & Points Table Configuration
            </h2>
          </div>
        </div>

        <Badge variant={live && status !== 'Completed' ? 'neutral' : 'success'} dot>
          {status}
        </Badge>
      </div>

      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Innings, Overs & Timing Rules"
          subtitle="Define standard playing conditions for schedule slot optimization"
        />

        <form onSubmit={(e) => { e.preventDefault(); onSave(config) }} className="space-y-6 mt-4">
          <fieldset disabled={saving} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cricket Match Format *
              </label>
              <select
                required={live}
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 shadow-xs"
              >
                {live && <option value="" disabled>Select match format</option>}
                {live && config.format && !['T20', 'OneDay', 'T10'].includes(config.format) && <option>{config.format}</option>}
                <option value="T20">Twenty20 (20 Overs)</option>
                <option value="OneDay">One Day (50 Overs)</option>
                <option value="T10">Ten10 (10 Overs - Short)</option>
              </select>
            </div>

            <div>
              <Input
                label="Overs Per Innings"
                min={live ? 1 : undefined}
                type="number"
                value={config.oversPerInnings}
                onChange={(e) => setConfig({ ...config, oversPerInnings: live ? e.target.value : Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <Input
                label="Max Overs Per Bowler"
                min={live ? 1 : undefined}
                type="number"
                value={config.maxBowlerOvers}
                onChange={(e) => setConfig({ ...config, maxBowlerOvers: live ? e.target.value : Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <Input
                label="Powerplay Overs Window"
                value={config.powerplayOvers}
                onChange={(e) => setConfig({ ...config, powerplayOvers: e.target.value })}
                placeholder="e.g. 1 to 6"
              />
            </div>

            <div>
              <Input
                label="Innings Break (Minutes)"
                min={live ? 0 : undefined} required={live}
                type="number"
                value={config.inningsBreakMinutes}
                onChange={(e) => setConfig({ ...config, inningsBreakMinutes: live ? e.target.value : Number(e.target.value) })}
              />
            </div>

            <div>
              <Input
                label="Total Slot Budget (Minutes)"
                min={live ? 1 : undefined} required={live}
                type="number"
                value={config.matchDurationMinutes}
                onChange={(e) => setConfig({ ...config, matchDurationMinutes: live ? e.target.value : Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Points System & Tie-Breaker
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <Input
                  label="Points for Win"
                  min={live ? 0 : undefined} step={live ? 0.01 : undefined} required={live}
                  type="number"
                  value={config.pointsForWin}
                  onChange={(e) => setConfig({ ...config, pointsForWin: live ? e.target.value : Number(e.target.value) })}
                />
              </div>
              <div>
                <Input
                  label="Points for Tie / Washout"
                  min={live ? 0 : undefined} step={live ? 0.01 : undefined} required={live}
                  type="number"
                  value={config.pointsForTie}
                  onChange={(e) => setConfig({ ...config, pointsForTie: live ? e.target.value : Number(e.target.value) })}
                />
              </div>
              <div>
                <Input
                  label="Points for Loss"
                  min={live ? 0 : undefined} step={live ? 0.01 : undefined} required={live}
                  type="number"
                  value={config.pointsForLoss}
                  onChange={(e) => setConfig({ ...config, pointsForLoss: live ? e.target.value : Number(e.target.value) })}
                />
              </div>
              <div>
                <Input
                  label="Min Overs for DLS Rain Rule"
                  min={live ? 0 : undefined}
                  type="number"
                  value={config.minOversForDLS}
                  onChange={(e) => setConfig({ ...config, minOversForDLS: live ? e.target.value : Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {live && <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={config.superOver}
              onChange={(e) => setConfig({ ...config, superOver: e.target.checked })} />
            Enable Super Over
          </label>}
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
              Back to Teams
            </Button>

            <Button
              type="submit"
              disabled={saving}
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              {saving ? 'Saving…' : 'Save & Proceed to Stadium Registration'}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
