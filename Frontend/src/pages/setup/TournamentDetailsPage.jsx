/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 1: Tournament Details
 * ══════════════════════════════════════════════════════════════
 *  Dedicated form for tournament identity, sanctioning and rules.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building,
  Award,
  Sparkles,
} from 'lucide-react'
import { Card, Button, Input, SectionHeader, Badge } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { motionPresets } from '../../design/tokens'

export default function TournamentDetailsPage() {
  const navigate = useNavigate()
  const { setupState, updateTournament, updateStepStatus } = useTournamentSetup()

  const [form, setForm] = useState(setupState.tournament)
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    updateTournament(form)
    updateStepStatus('details', 'Completed')
    setSaved(true)
    setTimeout(() => {
      navigate('/teams')
    }, 600)
  }

  return (
    <motion.div className="space-y-6 max-w-4xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            1/7
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Tournament Setup Workflow · Step 1
            </p>
            <h2 className="text-sm font-bold text-emerald-950">
              Tournament Details & Sanctioning Profile
            </h2>
          </div>
        </div>

        <Badge variant="success" dot>
          {setupState.stepStatus.details}
        </Badge>
      </div>

      {/* Main Form Card */}
      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title="Tournament Sanctioning & Profile"
          subtitle="Provide official title, season edition, and sanctioning body before registering teams"
        />

        <form onSubmit={handleSave} className="space-y-5 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Input
                label="Tournament Official Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. KLE Cricket Championship 2026"
                required
              />
            </div>

            <div>
              <Input
                label="Edition / Season Code *"
                value={form.edition}
                onChange={(e) => setForm({ ...form, edition: e.target.value })}
                placeholder="e.g. Season 12 (Spring 2026)"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tournament Category / Format *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
              >
                <option value="Inter-Collegiate T20">Inter-Collegiate T20 (20 Overs)</option>
                <option value="University One-Day Cup">University One-Day Trophy (50 Overs)</option>
                <option value="Zonal Leather Ball League">Zonal Leather Ball League</option>
                <option value="Inter-Departmental Knockout">Inter-Departmental Knockout</option>
              </select>
            </div>

            <div>
              <Input
                label="Tournament Start Date *"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Input
                label="Tournament Concluding Date *"
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Sanctioning Authority / Host Institution *"
                value={form.hostInstitution}
                onChange={(e) => setForm({ ...form, hostInstitution: e.target.value })}
                placeholder="e.g. KLE Technological University Sports Council"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Match Ball
              </label>
              <select
                value={form.ballType}
                onChange={(e) => setForm({ ...form, ballType: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
              >
                <option value="White Kookaburra (Leather)">White Kookaburra (Leather - D/N Standard)</option>
                <option value="Red SG Club (Leather)">Red SG Club (Leather - Day Matches)</option>
                <option value="Pink Kookaburra (Day/Night)">Pink Kookaburra (Day/Night Tests)</option>
              </select>
            </div>

            <div>
              <Input
                label="Championship Trophy / Prize Title"
                defaultValue="Vice-Chancellor's Rolling Cup"
                placeholder="e.g. Chancellor Rolling Trophy"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                {saved ? 'Saved!' : 'Save & Proceed to Team Registration'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
