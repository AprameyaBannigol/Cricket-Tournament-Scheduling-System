import { Link } from 'react-router-dom'
import { ArrowRight, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import { officialApi } from '../../api/tournamentResources'
import LiveTournamentResources from '../../components/LiveTournamentResources'
import { useResourceEditor } from '../../components/useResourceEditor'
import { useTournamentSetup } from '../../context/TournamentSetupContext'

const blankOfficial = { name: '', role: 'On-field Umpire', cert: 'State Panel', available: true, matches: 0, blackoutDates: '' }

const roles = [
  ['UMPIRE', 'On-field Umpire'],
  ['THIRD_UMPIRE', 'Third Umpire'],
  ['REFEREE', 'Match Referee'],
  ['SCORER', 'Official Scorer'],
]

export default function OfficialsRegistrationPage() {
  return <LiveTournamentResources api={officialApi} subject="officials" View={OfficialsView} />
}

export function DemoOfficialsRegistrationPage() {
  const { activeTournament, officials, addOfficial, updateOfficial, removeOfficial, updateStepStatus } = useTournamentSetup()
  function save(form, editingId) {
    if (editingId) updateOfficial(editingId, { ...form, matches: Number(form.matches) })
    else addOfficial({ ...form, matches: Number(form.matches) })
    updateStepStatus('officials', 'Completed')
  }

  return <OfficialsView activeTournament={activeTournament} records={officials} save={save}
    removeOfficial={removeOfficial} onNext={() => updateStepStatus('officials', 'Completed')} />
}

function OfficialsView({ activeTournament, selector, records: officials, save, removeOfficial, onNext }) {
  const demo = Boolean(removeOfficial)
  const availabilityPath = demo ? '/availability' : `/availability?tournament=${activeTournament.id}`
  const blank = demo ? blankOfficial : { ...blankOfficial, role: 'UMPIRE' }
  const { form, setForm, editingId, saving, error, success, open, submit, close } = useResourceEditor(blank, save, 'Official')
  const roleOptions = demo ? roles.map(([, label]) => [label, label]) : roles
  const originalRole = officials.find(({ id }) => id === editingId)?.role

  return (
    <div className="workspace-page data-management-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'CRICKET TOURNAMENT'}{demo && ' · DEMO DATA'}</span>
        <h1>Match officials</h1>
        <p>Register umpires and referees, with example availability for the tournament.</p>
        {selector}
        <div className="page-actions">
          <button className="button button-primary" type="button" disabled={saving} onClick={() => open()}><Plus size={16} /> Register official</button>
          <Link className="button button-secondary" to={availabilityPath}>Availability & constraints <ArrowRight size={16} /></Link>
        </div>
      </header>
      <div className="demo-notice">{demo
        ? 'Officials and availability are example records stored locally in this browser.'
        : 'Live registration saves official details and status. Set availability and blackout dates in Availability Configuration.'}</div>
      {success && <p className="form-message" role="status">{success}</p>}
      {form && (
        <form className="content-panel editor-panel" onSubmit={submit}>
          <div className="panel-heading"><div><span className="panel-kicker">{editingId ? 'EDIT OFFICIAL' : 'NEW OFFICIAL'}</span><h2>{editingId ? 'Edit official' : 'Register an official'}</h2></div><button type="button" className="button button-quiet" disabled={saving} onClick={close}>Cancel</button></div>
          <fieldset className="form-grid" disabled={saving}>
            <label>Full name<input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Role<select required value={form.role ?? ''} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="" disabled>Select role</option>{originalRole && !roleOptions.some(([code]) => code === originalRole) && <option>{originalRole}</option>}{roleOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
            <label>Qualification<input value={form.cert ?? ''} onChange={(event) => setForm({ ...form, cert: event.target.value })} /></label>
            <label>Unavailable dates<input disabled={!demo} value={demo ? form.blackoutDates : ''} onChange={(event) => setForm({ ...form, blackoutDates: event.target.value })} placeholder={demo ? "Comma-separated dates" : "Set in Availability Configuration"} /></label>
            <label>Matches assigned<input type="number" min="0" disabled={!demo} value={demo ? form.matches : ''} onChange={(event) => setForm({ ...form, matches: event.target.value })} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} /> Available for assignment</label>
          </fieldset>
          {error && <p className="form-message" role="alert">{error}</p>}
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save official changes' : 'Add official'}</button></div>
        </form>
      )}
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">OFFICIALS PANEL</span><h2>Umpires and match officials</h2></div><span className="panel-tag">{officials.length} officials</span></div>
        <div className="table-scroll"><table className="dark-table data-table"><thead><tr><th>Official</th><th>Role</th><th>Qualification</th><th>Matches</th><th>Unavailable dates</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>{officials.map((official) => <tr key={official.id}><td><strong className="table-name"><Shield size={14} />{official.name}</strong></td><td>{roleOptions.find(([code]) => code === official.role)?.[1] ?? official.role ?? '—'}</td><td>{official.cert}</td><td>{demo ? official.matches : '—'}</td><td>{demo ? official.blackoutDates || 'None' : '—'}</td><td><span className={`tournament-status ${official.available ? 'status-live' : 'status-completed'}`}>{official.available ? 'Available' : demo ? 'Unavailable' : official.status || '—'}</span></td><td><span className="row-actions"><button type="button" aria-label={`Edit ${official.name}`} disabled={saving} onClick={() => open(demo ? { ...blankOfficial, ...official } : official)}><Pencil size={15} /></button>{demo && <button type="button" aria-label={`Remove ${official.name}`} onClick={() => removeOfficial(official.id)}><Trash2 size={15} /></button>}</span></td></tr>)}</tbody>
        </table></div>
        {!officials.length && <p className="empty-filter">No officials registered yet.</p>}
      </section>
      <div className="workflow-next"><span>Next: configure availability and schedule preferences.</span><Link className="button button-primary" to={availabilityPath} onClick={onNext}>Continue to availability <ArrowRight size={16} /></Link></div>
    </div>
  )
}
