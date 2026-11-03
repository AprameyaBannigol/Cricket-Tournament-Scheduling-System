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
  const { setupState, updateStepStatus } = useTournamentSetup()

  const [config, setConfig] = useState({
    format: 'T20',
    oversPerInnings: 20,
    maxBowlerOvers: 4,
    powerplayOvers: '1 to 6',
    inningsBreakMinutes: 15,
    matchDurationMinutes: 180,
    minOversForDLS: 5,
    pointsForWin: 2,
    pointsForTie: 1,
    pointsForLoss: 0,
    superOver: true,
  })

  const handleSave = (e) => {
    e.preventDefault()
    updateStepStatus('matches', 'Completed')
    navigate('/stadiums')
  }

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

        <Badge variant="success" dot>
          {setupState.stepStatus.matches}
        </Badge>
      </div>

      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Innings, Overs & Timing Rules"
          subtitle="Define standard playing conditions for schedule slot optimization"
        />

        <form onSubmit={handleSave} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cricket Match Format *
              </label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 shadow-xs"
              >
                <option value="T20">Twenty20 (20 Overs)</option>
                <option value="OneDay">One Day (50 Overs)</option>
                <option value="T10">Ten10 (10 Overs - Short)</option>
              </select>
            </div>

            <div>
              <Input
                label="Overs Per Innings"
                type="number"
                value={config.oversPerInnings}
                onChange={(e) => setConfig({ ...config, oversPerInnings: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <Input
                label="Max Overs Per Bowler"
                type="number"
                value={config.maxBowlerOvers}
                onChange={(e) => setConfig({ ...config, maxBowlerOvers: Number(e.target.value) })}
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
                type="number"
                value={config.inningsBreakMinutes}
                onChange={(e) => setConfig({ ...config, inningsBreakMinutes: Number(e.target.value) })}
              />
            </div>

            <div>
              <Input
                label="Total Slot Budget (Minutes)"
                type="number"
                value={config.matchDurationMinutes}
                onChange={(e) => setConfig({ ...config, matchDurationMinutes: Number(e.target.value) })}
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
                  type="number"
                  value={config.pointsForWin}
                  onChange={(e) => setConfig({ ...config, pointsForWin: Number(e.target.value) })}
                />
              </div>
              <div>
                <Input
                  label="Points for Tie / Washout"
                  type="number"
                  value={config.pointsForTie}
                  onChange={(e) => setConfig({ ...config, pointsForTie: Number(e.target.value) })}
                />
              </div>
              <div>
                <Input
                  label="Points for Loss"
                  type="number"
                  value={config.pointsForLoss}
                  onChange={(e) => setConfig({ ...config, pointsForLoss: Number(e.target.value) })}
                />
              </div>
              <div>
                <Input
                  label="Min Overs for DLS Rain Rule"
                  type="number"
                  value={config.minOversForDLS}
                  onChange={(e) => setConfig({ ...config, minOversForDLS: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/teams')}
            >
              Back to Teams
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Save & Proceed to Stadium Registration
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
