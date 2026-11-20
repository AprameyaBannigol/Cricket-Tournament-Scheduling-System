/**
 * ══════════════════════════════════════════════════════════════
 *  SETUP WORKFLOW — Step 1: Tournament Details
 * ══════════════════════════════════════════════════════════════
 *  Dedicated form for tournament identity, sanctioning and rules.
 */

import { useCallback, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, ArrowRight, ArrowLeft } from 'lucide-react'
import { getTournament, updateTournament as updateLiveTournament } from '../../api/tournaments'
import { useApiResource } from '../../api/useApiResource'
import TournamentRequestStatus from '../../components/TournamentRequestStatus'
import { Card, Button, Input, SectionHeader, Badge } from '../../components/ui'
import { useTournamentSetup } from '../../context/TournamentSetupContext'
import { motionPresets } from '../../design/tokens'

const demoCategories = [
  ['Inter-Collegiate T20', 'Inter-Collegiate T20 (20 Overs)'],
  ['University One-Day Cup', 'University One-Day Trophy (50 Overs)'],
  ['Zonal Leather Ball League', 'Zonal Leather Ball League'],
  ['Inter-Departmental Knockout', 'Inter-Departmental Knockout'],
]
const liveCategories = [
  ['T20 Round Robin', 'T20 Round Robin'],
  ['50-Over Round Robin', '50-Over Round Robin'],
  ...demoCategories,
]
const matchBalls = [
  ['White Kookaburra (Leather)', 'White Kookaburra (Leather - D/N Standard)'],
  ['Red SG Club (Leather)', 'Red SG Club (Leather - Day Matches)'],
  ['Pink Kookaburra (Day/Night)', 'Pink Kookaburra (Day/Night Tests)'],
]

export default function TournamentDetailsPage() {
  const navigate = useNavigate()
  const { setupState, updateTournament, updateStepStatus } = useTournamentSetup()

  const save = (form) => {
    updateTournament(form)
    updateStepStatus('details', 'Completed')
    navigate('/teams')
  }
  return <TournamentDetailsForm tournament={setupState.tournament} stepStatus={setupState.stepStatus.details}
    onSave={save} onBack={() => navigate('/dashboard')} backLabel="Back to Dashboard" />
}

export function EditTournamentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const load = useCallback((signal) => getTournament(id, signal), [id])
  const request = useApiResource(load)

  if (!request.data) return (
    <div className="workspace-page"><TournamentRequestStatus {...request} /></div>
  )

  const detailsPath = `/tournaments/${request.data.id}`
  return (
    <TournamentDetailsForm key={request.data.id} tournament={request.data}
      onSave={async (form) => {
        const saved = await updateLiveTournament(request.data.id, form)
        navigate(`/tournaments/${saved.id}`, { replace: true })
      }}
      onBack={() => navigate(detailsPath)} backLabel="Back to tournament" />
  )
}

function TournamentDetailsForm({ tournament, stepStatus, onSave, onBack, backLabel }) {
  const demo = Boolean(stepStatus)
  const [form, setForm] = useState(tournament)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submitting = useRef(false)
  const categories = demo ? demoCategories : liveCategories
  const invalidDates = form.startDate && form.endDate && form.endDate < form.startDate

  const handleSave = async (event) => {
    event.preventDefault()
    if (submitting.current || !form.name.trim() || invalidDates) return
    submitting.current = true
    setSaving(true)
    setError('')
    try {
      await onSave(form)
    } catch (requestError) {
      setError(requestError.status === 404 ? 'This tournament no longer exists.' : requestError.message)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  return (
    <motion.div className="space-y-6 max-w-4xl mx-auto" {...motionPresets.slideUp}>
      {/* Top Workflow Banner */}
      {demo && <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
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
          {stepStatus}
        </Badge>
      </div>}

      {/* Main Form Card */}
      <Card className="p-6 sm:p-8" hover={false}>
        <SectionHeader
          title={demo ? 'Tournament Sanctioning & Profile' : 'Edit tournament'}
          subtitle={demo ? 'Provide official title, season edition, and sanctioning body before registering teams' : tournament.name}
        />

        <form onSubmit={handleSave} className="space-y-5 mt-4">
          <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                label={demo ? 'Edition / Season Code *' : 'Edition'}
                value={form.edition}
                onChange={(e) => setForm({ ...form, edition: e.target.value })}
                placeholder="e.g. Season 12 (Spring 2026)"
                required={demo}
              />
            </div>

            <div>
              <label htmlFor="tournament-category" className="block text-xs font-semibold text-slate-700 mb-1">
                Tournament Category / Format{demo ? ' *' : ''}
              </label>
              <select
                id="tournament-category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
              >
                {!demo && <option value="">Not set</option>}
                {!demo && tournament.category && !categories.some(([value]) => value === tournament.category) && (
                  <option value={tournament.category}>{tournament.category}</option>
                )}
                {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            <div>
              <Input
                label={demo ? 'Tournament Start Date *' : 'Tournament Start Date'}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required={demo}
              />
            </div>

            <div>
              <Input
                label={demo ? 'Tournament Concluding Date *' : 'Tournament Concluding Date'}
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required={demo}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label={demo ? 'Sanctioning Authority / Host Institution *' : 'Sanctioning Authority / Host Institution'}
                value={form.hostInstitution}
                onChange={(e) => setForm({ ...form, hostInstitution: e.target.value })}
                placeholder="e.g. KLE Technological University Sports Council"
                required={demo}
              />
            </div>

            <div>
              <label htmlFor="tournament-ball" className="block text-xs font-semibold text-slate-700 mb-1">
                Official Match Ball
              </label>
              <select
                id="tournament-ball"
                value={form.ballType}
                onChange={(e) => setForm({ ...form, ballType: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
              >
                {!demo && <option value="">Not set</option>}
                {!demo && tournament.ballType && !matchBalls.some(([value]) => value === tournament.ballType) && (
                  <option value={tournament.ballType}>{tournament.ballType}</option>
                )}
                {matchBalls.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            {!demo && <div>
              <Input label="Season" value={form.season} onChange={(event) => setForm({ ...form, season: event.target.value })} />
            </div>}
            {demo && <div>
              <Input
                label="Championship Trophy / Prize Title"
                defaultValue="Vice-Chancellor's Rolling Cup"
                placeholder="e.g. Chancellor Rolling Trophy"
              />
            </div>}
          </fieldset>
          {invalidDates && <p className="form-message" role="alert">End date must be on or after the start date.</p>}
          {error && <p className="form-message" role="alert">{error}</p>}

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={onBack}
              disabled={saving}
            >
              {backLabel}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={saving || !form.name.trim() || Boolean(invalidDates)}
                variant="primary"
                size="md"
                iconRight={ArrowRight}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                {saving ? 'Saving…' : demo ? 'Save & Proceed to Team Registration' : 'Save tournament'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}
