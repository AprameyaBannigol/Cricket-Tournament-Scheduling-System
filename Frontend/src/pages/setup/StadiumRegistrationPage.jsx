import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTournamentSetup } from '../../context/TournamentSetupContext'

const blankGround = { name: '', shortName: '', type: 'Natural Turf', capacity: '5000', pitches: 1, curator: '', floodlights: true, availabilityStatus: 'available', availability: '09:00–18:00', blackoutDates: '' }

export default function StadiumRegistrationPage() {
  const { activeTournament, stadiums, addStadium, updateStadium, removeStadium, updateStepStatus } = useTournamentSetup()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankGround)

  const editGround = (stadium) => {
    setEditingId(stadium.id)
    setForm({ ...blankGround, ...stadium, capacity: String(stadium.capacity).replace(/,/g, '') })
    setFormOpen(true)
  }

  const saveGround = (event) => {
    event.preventDefault()
    const ground = { ...form, capacity: Number(form.capacity).toLocaleString('en-US'), pitches: Number(form.pitches) }
    if (editingId) updateStadium(editingId, ground)
    else addStadium({ ...ground, status: form.availabilityStatus === 'maintenance' ? 'Maintenance' : 'Available' })
    setForm(blankGround)
    setEditingId(null)
    setFormOpen(false)
    updateStepStatus('stadiums', 'Completed')
  }

  return (
    <div className="workspace-page data-management-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'CRICKET TOURNAMENT'} · DEMO DATA</span>
        <h1>Stadiums and grounds</h1>
        <p>Manage cricket venues, pitch details and availability windows.</p>
        <div className="page-actions">
          <button className="button button-primary" type="button" onClick={() => { setEditingId(null); setForm(blankGround); setFormOpen(true) }}><Plus size={16} /> Register ground</button>
          <Link className="button button-secondary" to="/officials">Officials <ArrowRight size={16} /></Link>
        </div>
      </header>
      <div className="demo-notice">Availability and blackout dates are stored in demo state. The frontend does not validate live venue availability.</div>
      {formOpen && (
        <form className="content-panel editor-panel" onSubmit={saveGround}>
          <div className="panel-heading"><div><span className="panel-kicker">{editingId ? 'EDIT VENUE' : 'NEW VENUE'}</span><h2>{editingId ? 'Edit stadium' : 'Register a cricket ground'}</h2></div><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button></div>
          <div className="form-grid">
            <label>Ground name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Short name<input value={form.shortName} onChange={(event) => setForm({ ...form, shortName: event.target.value })} /></label>
            <label>Pitch type<input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} /></label>
            <label>Capacity<input type="number" min="0" required value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>
            <label>Number of pitches<input type="number" min="1" value={form.pitches} onChange={(event) => setForm({ ...form, pitches: event.target.value })} /></label>
            <label>Availability window<input value={form.availability} onChange={(event) => setForm({ ...form, availability: event.target.value })} placeholder="09:00–18:00" /></label>
            <label>Blackout dates<input value={form.blackoutDates} onChange={(event) => setForm({ ...form, blackoutDates: event.target.value })} placeholder="Comma-separated dates" /></label>
            <label>Ground status<select value={form.availabilityStatus} onChange={(event) => setForm({ ...form, availabilityStatus: event.target.value })}><option value="available">Available</option><option value="maintenance">Maintenance</option></select></label>
            <label className="checkbox-field"><input type="checkbox" checked={form.floodlights} onChange={(event) => setForm({ ...form, floodlights: event.target.checked })} /> Floodlights available</label>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit">{editingId ? 'Save ground changes' : 'Add ground'}</button></div>
        </form>
      )}
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">REGISTERED VENUES</span><h2>Grounds and pitch availability</h2></div><span className="panel-tag">{stadiums.length} venues</span></div>
        <div className="table-scroll"><table className="dark-table data-table"><thead><tr><th>Ground</th><th>Pitch</th><th>Capacity</th><th>Pitches</th><th>Availability</th><th>Blackouts</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{stadiums.map((stadium) => <tr key={stadium.id}><td><strong className="table-name"><MapPin size={14} />{stadium.name}</strong></td><td>{stadium.type}</td><td>{stadium.capacity}</td><td>{stadium.pitches}</td><td>{stadium.availability || 'Not set'}</td><td>{stadium.blackoutDates || 'None'}</td><td><span className={`tournament-status ${stadium.availabilityStatus === 'maintenance' ? 'status-completed' : 'status-live'}`}>{stadium.availabilityStatus === 'maintenance' ? 'Maintenance' : 'Available'}</span></td><td><span className="row-actions"><button type="button" aria-label={`Edit ${stadium.name}`} onClick={() => editGround(stadium)}><Pencil size={15} /></button><button type="button" aria-label={`Remove ${stadium.name}`} onClick={() => removeStadium(stadium.id)}><Trash2 size={15} /></button></span></td></tr>)}</tbody>
        </table></div>
      </section>
      <div className="workflow-next"><span>Next: register match officials.</span><Link className="button button-primary" to="/officials" onClick={() => updateStepStatus('stadiums', 'Completed')}>Continue to officials <ArrowRight size={16} /></Link></div>
    </div>
  )
}
