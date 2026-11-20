import { Link } from 'react-router-dom'
import { ArrowRight, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { stadiumApi } from '../../api/tournamentResources'
import LiveTournamentResources from '../../components/LiveTournamentResources'
import { useResourceEditor } from '../../components/useResourceEditor'
import { useTournamentSetup } from '../../context/TournamentSetupContext'

const blankGround = { name: '', shortName: '', type: 'Natural Turf', capacity: '5000', pitches: 1, curator: '', floodlights: true, availabilityStatus: 'available', availability: '09:00–18:00', blackoutDates: '' }

export default function StadiumRegistrationPage() {
  return <LiveTournamentResources api={stadiumApi} subject="stadiums" View={StadiumsView} />
}

export function DemoStadiumRegistrationPage() {
  const { activeTournament, stadiums, addStadium, updateStadium, removeStadium, updateStepStatus } = useTournamentSetup()
  function save(form, editingId) {
    const ground = { ...form, capacity: Number(form.capacity).toLocaleString('en-US'), pitches: Number(form.pitches) }
    if (editingId) updateStadium(editingId, ground)
    else addStadium({ ...ground, status: form.availabilityStatus === 'maintenance' ? 'Maintenance' : 'Available' })
    updateStepStatus('stadiums', 'Completed')
  }

  return <StadiumsView activeTournament={activeTournament} records={stadiums} save={save}
    removeStadium={removeStadium} onNext={() => updateStepStatus('stadiums', 'Completed')} />
}

function StadiumsView({ activeTournament, selector, records: stadiums, save, removeStadium, onNext }) {
  const demo = Boolean(removeStadium)
  const { form, setForm, editingId, saving, error, success, open, submit, close } = useResourceEditor(blankGround, save, 'Ground')
  const officialsPath = demo ? '/officials' : `/officials?tournament=${activeTournament.id}`
  const currentStatus = stadiums.find(({ id }) => id === editingId)?.availabilityStatus

  return (
    <div className="workspace-page data-management-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'CRICKET TOURNAMENT'}{demo && ' · DEMO DATA'}</span>
        <h1>Stadiums and grounds</h1>
        <p>Manage cricket venues, pitch details and availability windows.</p>
        {selector}
        <div className="page-actions">
          <button className="button button-primary" type="button" disabled={saving} onClick={() => open()}><Plus size={16} /> Register ground</button>
          <Link className="button button-secondary" to={officialsPath}>Officials <ArrowRight size={16} /></Link>
        </div>
      </header>
      <div className="demo-notice">{demo
        ? 'Availability and blackout dates are stored in demo state.'
        : 'Live registration saves ground details and status. Set windows and blackout dates in Availability Configuration.'}</div>
      {success && <p className="form-message" role="status">{success}</p>}
      {form && (
        <form className="content-panel editor-panel" onSubmit={submit}>
          <div className="panel-heading"><div><span className="panel-kicker">{editingId ? 'EDIT VENUE' : 'NEW VENUE'}</span><h2>{editingId ? 'Edit stadium' : 'Register a cricket ground'}</h2></div><button type="button" className="button button-quiet" disabled={saving} onClick={close}>Cancel</button></div>
          <fieldset className="form-grid" disabled={saving}>
            <label>Ground name<input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Short name<input value={form.shortName ?? ''} onChange={(event) => setForm({ ...form, shortName: event.target.value })} /></label>
            <label>Pitch type<input value={form.type ?? ''} onChange={(event) => setForm({ ...form, type: event.target.value })} /></label>
            <label>Capacity<input type="number" min="0" max={2147483647} required={demo} value={form.capacity ?? ''} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>
            <label>Number of pitches<input type="number" min="1" max={2147483647} value={form.pitches ?? ''} onChange={(event) => setForm({ ...form, pitches: event.target.value })} /></label>
            <label>Availability window<input disabled={!demo} value={demo ? form.availability : ''} onChange={(event) => setForm({ ...form, availability: event.target.value })} placeholder={demo ? "09:00–18:00" : "Set in Availability Configuration"} /></label>
            <label>Blackout dates<input disabled={!demo} value={demo ? form.blackoutDates : ''} onChange={(event) => setForm({ ...form, blackoutDates: event.target.value })} placeholder={demo ? "Comma-separated dates" : "Set in Availability Configuration"} /></label>
            <label>Ground status<select value={form.availabilityStatus ?? ''} onChange={(event) => setForm({ ...form, availabilityStatus: event.target.value })}>{!demo && <option value="">Not set</option>}{!demo && currentStatus && !['available', 'maintenance'].includes(currentStatus) && <option>{currentStatus}</option>}<option value="available">Available</option><option value="maintenance">Maintenance</option></select></label>
            <label className="checkbox-field"><input type="checkbox" checked={Boolean(form.floodlights)} onChange={(event) => setForm({ ...form, floodlights: event.target.checked })} /> Floodlights available</label>
          </fieldset>
          {error && <p className="form-message" role="alert">{error}</p>}
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save ground changes' : 'Add ground'}</button></div>
        </form>
      )}
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">REGISTERED VENUES</span><h2>Grounds and pitch availability</h2></div><span className="panel-tag">{stadiums.length} venues</span></div>
        <div className="table-scroll"><table className="dark-table data-table"><thead><tr><th>Ground</th><th>Pitch</th><th>Capacity</th><th>Pitches</th><th>Availability</th><th>Blackouts</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{stadiums.map((stadium) => <tr key={stadium.id}><td><strong className="table-name"><MapPin size={14} />{stadium.name}</strong></td><td>{stadium.type}</td><td>{stadium.capacity?.toLocaleString('en-US') ?? '—'}</td><td>{stadium.pitches}</td><td>{demo ? stadium.availability || 'Not set' : '—'}</td><td>{demo ? stadium.blackoutDates || 'None' : '—'}</td><td><span className={`tournament-status ${stadium.availabilityStatus === 'available' ? 'status-live' : 'status-completed'}`}>{stadium.availabilityStatus === 'available' ? 'Available' : stadium.availabilityStatus === 'maintenance' ? 'Maintenance' : stadium.availabilityStatus || '—'}</span></td><td><span className="row-actions"><button type="button" aria-label={`Edit ${stadium.name}`} disabled={saving} onClick={() => open(demo
            ? { ...blankGround, ...stadium, capacity: String(stadium.capacity).replace(/,/g, '') }
            : stadium)}><Pencil size={15} /></button>{demo && <button type="button" aria-label={`Remove ${stadium.name}`} onClick={() => removeStadium(stadium.id)}><Trash2 size={15} /></button>}</span></td></tr>)}</tbody>
        </table></div>
        {!stadiums.length && <p className="empty-filter">No grounds registered yet.</p>}
      </section>
      <div className="workflow-next"><span>Next: register match officials.</span><Link className="button button-primary" to={officialsPath} onClick={onNext}>Continue to officials <ArrowRight size={16} /></Link></div>
    </div>
  )
}
