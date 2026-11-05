import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import { useTournamentSetup } from '../../context/TournamentSetupContext'

const blankOfficial = { name: '', role: 'On-field Umpire', cert: 'State Panel', available: true, matches: 0, blackoutDates: '' }

export default function OfficialsRegistrationPage() {
  const { activeTournament, officials, addOfficial, updateOfficial, removeOfficial, updateStepStatus } = useTournamentSetup()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankOfficial)

  const editOfficial = (official) => {
    setEditingId(official.id)
    setForm({ ...blankOfficial, ...official })
    setFormOpen(true)
  }

  const saveOfficial = (event) => {
    event.preventDefault()
    if (editingId) updateOfficial(editingId, { ...form, matches: Number(form.matches) })
    else addOfficial({ ...form, matches: Number(form.matches) })
    setForm(blankOfficial)
    setEditingId(null)
    setFormOpen(false)
    updateStepStatus('officials', 'Completed')
  }

  return (
    <div className="workspace-page data-management-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'CRICKET TOURNAMENT'} · DEMO DATA</span>
        <h1>Match officials</h1>
        <p>Register umpires and referees, with example availability for the tournament.</p>
        <div className="page-actions">
          <button className="button button-primary" type="button" onClick={() => { setEditingId(null); setForm(blankOfficial); setFormOpen(true) }}><Plus size={16} /> Register official</button>
          <Link className="button button-secondary" to="/availability">Availability & constraints <ArrowRight size={16} /></Link>
        </div>
      </header>
      <div className="demo-notice">Officials and availability are example records stored locally in this browser; no live roster checks are performed.</div>
      {formOpen && (
        <form className="content-panel editor-panel" onSubmit={saveOfficial}>
          <div className="panel-heading"><div><span className="panel-kicker">{editingId ? 'EDIT OFFICIAL' : 'NEW OFFICIAL'}</span><h2>{editingId ? 'Edit official' : 'Register an official'}</h2></div><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button></div>
          <div className="form-grid">
            <label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>{['On-field Umpire', 'Third Umpire', 'Match Referee', 'Official Scorer'].map((role) => <option key={role}>{role}</option>)}</select></label>
            <label>Qualification<input value={form.cert} onChange={(event) => setForm({ ...form, cert: event.target.value })} /></label>
            <label>Unavailable dates<input value={form.blackoutDates} onChange={(event) => setForm({ ...form, blackoutDates: event.target.value })} placeholder="Comma-separated dates" /></label>
            <label>Matches assigned<input type="number" min="0" value={form.matches} onChange={(event) => setForm({ ...form, matches: event.target.value })} /></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} /> Available for assignment</label>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit">{editingId ? 'Save official changes' : 'Add official'}</button></div>
        </form>
      )}
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">OFFICIALS PANEL</span><h2>Umpires and match officials</h2></div><span className="panel-tag">{officials.length} officials</span></div>
        <div className="table-scroll"><table className="dark-table data-table"><thead><tr><th>Official</th><th>Role</th><th>Qualification</th><th>Matches</th><th>Unavailable dates</th><th>Availability</th><th>Actions</th></tr></thead>
          <tbody>{officials.map((official) => <tr key={official.id}><td><strong className="table-name"><Shield size={14} />{official.name}</strong></td><td>{official.role}</td><td>{official.cert}</td><td>{official.matches}</td><td>{official.blackoutDates || 'None'}</td><td><span className={`tournament-status ${official.available ? 'status-live' : 'status-completed'}`}>{official.available ? 'Available' : 'Unavailable'}</span></td><td><span className="row-actions"><button type="button" aria-label={`Edit ${official.name}`} onClick={() => editOfficial(official)}><Pencil size={15} /></button><button type="button" aria-label={`Remove ${official.name}`} onClick={() => removeOfficial(official.id)}><Trash2 size={15} /></button></span></td></tr>)}</tbody>
        </table></div>
      </section>
      <div className="workflow-next"><span>Next: configure availability and schedule preferences.</span><Link className="button button-primary" to="/availability" onClick={() => updateStepStatus('officials', 'Completed')}>Continue to availability <ArrowRight size={16} /></Link></div>
    </div>
  )
}
