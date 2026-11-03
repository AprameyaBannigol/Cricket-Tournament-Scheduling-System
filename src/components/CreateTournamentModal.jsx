/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Create Tournament Modal
 * ══════════════════════════════════════════════════════════════
 *  Initializes a fresh tournament setup workflow in the system.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  X,
  Calendar,
  Sparkles,
  ArrowRight,
  Landmark,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Button, Input } from './ui'
import { useTournamentSetup } from '../context/TournamentSetupContext'

export default function CreateTournamentModal() {
  const { createModalOpen, setCreateModalOpen, updateTournament, loadPreset } =
    useTournamentSetup()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: 'KLE Cricket Championship 2026',
    edition: 'Season 12',
    category: 'Inter-Collegiate T20',
    season: '2026 Spring-Summer',
    startDate: '2026-11-01',
    endDate: '2026-11-18',
    hostInstitution: 'KLE Technological University, Hubballi',
    ballType: 'White Kookaburra (Leather)',
    targetTeams: '16',
  })

  if (!createModalOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    updateTournament(form)
    setCreateModalOpen(false)
    navigate('/setup/details')
  }

  const handleStartFresh = () => {
    loadPreset('newEmpty')
    setCreateModalOpen(false)
    navigate('/setup/details')
  }

  const handleLoadCollegiateDemo = () => {
    loadPreset('inProgress')
    setCreateModalOpen(false)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shadow-xs">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Create Cricket Tournament
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Initialize tournament profile and unlock the 7-stage setup workflow
                </p>
              </div>
            </div>

            <button
              onClick={() => setCreateModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Tournament Official Title *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. All-University T20 Championship 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Format / Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs"
                >
                  <option value="Inter-Collegiate T20">Inter-Collegiate T20 (20 Overs)</option>
                  <option value="University One-Day Cup">University One-Day Trophy (50 Overs)</option>
                  <option value="Zonal Leather Ball League">Zonal Leather Ball League</option>
                  <option value="Inter-Departmental Knockout">Inter-Departmental Knockout</option>
                </select>
              </div>

              <div>
                <Input
                  label="Edition / Season"
                  value={form.edition}
                  onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  placeholder="e.g. Season 12 or 2026 Spring"
                />
              </div>

              <div>
                <Input
                  label="Start Date *"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>

              <div>
                <Input
                  label="End Date *"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="Sanctioning Host Institution *"
                  value={form.hostInstitution}
                  onChange={(e) => setForm({ ...form, hostInstitution: e.target.value })}
                  placeholder="e.g. KLE Technological University Sports Council"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ball Specifications
                </label>
                <select
                  value={form.ballType}
                  onChange={(e) => setForm({ ...form, ballType: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs"
                >
                  <option value="White Kookaburra (Leather)">White Kookaburra (Leather - D/N Standard)</option>
                  <option value="Red SG Club (Leather)">Red SG Club (Leather - Day Matches)</option>
                  <option value="Pink Kookaburra (Day/Night)">Pink Kookaburra (Day/Night Tests)</option>
                </select>
              </div>

              <div>
                <Input
                  label="Target Participating Teams"
                  type="number"
                  min="4"
                  max="64"
                  value={form.targetTeams}
                  onChange={(e) => setForm({ ...form, targetTeams: e.target.value })}
                />
              </div>
            </div>

            {/* Quick Presets Info Box */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800">Setup Workflow Guarantee:</span>
                <p className="mt-0.5 leading-relaxed text-slate-500">
                  Creating a tournament will automatically establish the 7 mandatory checklist categories. Schedule generation remains locked until teams, stadiums, and E2 constraint models are fully verified.
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                >
                  Start completely empty (0%)
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                >
                  Create & Launch Setup
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
