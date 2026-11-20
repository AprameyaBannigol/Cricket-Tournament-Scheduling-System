import { useCallback, useState } from 'react'
import { ArrowRight, MapPin, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { scheduleWorkspacePath, venueTravelApi } from '../../api/schedules'
import { stadiumApi } from '../../api/tournamentResources'
import { useApiResource } from '../../api/useApiResource'
import { LiveTournamentSelection } from '../../components/LiveTournamentResources'
import TournamentRequestStatus from '../../components/TournamentRequestStatus'
import useSchedulingConfigurationSave from '../../components/useSchedulingConfigurationSave'

export default function VenueTravelTimesPage() {
  return <LiveTournamentSelection>{({ activeTournament, selector }) =>
    <TravelTimeSetup tournament={activeTournament} selector={selector} />}
  </LiveTournamentSelection>
}

function TravelTimeSetup({ tournament, selector }) {
  const { id } = tournament
  const load = useCallback(async (signal) => {
    const [stadiums, travelTimes] = await Promise.all([stadiumApi.list(id, signal), venueTravelApi.list(id, signal)])
    return { stadiums, travelTimes }
  }, [id])
  const request = useApiResource(load)
  return <div className="workspace-page data-management-page">
    <header className="page-intro">
      <span className="eyebrow">{tournament.name} · SCHEDULING</span>
      <h1>Stadium travel times</h1>
      <p>Save travel minutes for each direction between available stadiums when travel checks are enabled.</p>
      {selector}
      <div className="page-actions">
        <Link className="button button-secondary" to={scheduleWorkspacePath('/setup/constraints', id)}>Scheduling constraints</Link>
        <Link className="button button-primary" to={scheduleWorkspacePath('/schedule/generate', id)}>Back to scheduling <ArrowRight size={16} /></Link>
      </div>
    </header>
    {request.loading || request.error ? <TournamentRequestStatus {...request} subject="travel times" /> :
      <TravelTimeEditor id={id} initial={request.data} />}
  </div>
}

function TravelTimeEditor({ id, initial }) {
  const [form, setForm] = useState({ from: '', to: '', minutes: '' })
  const [travelTimes, setTravelTimes] = useState(initial.travelTimes)
  const save = useSchedulingConfigurationSave()
  const stadiums = initial.stadiums
  const active = stadiums.filter(({ availabilityStatus }) => availabilityStatus === 'available')
  const groundName = (value) => stadiums.find(({ id }) => id === String(value))?.name ?? String(value)

  function select(from, to) {
    const existing = travelTimes.find((row) => String(row.fromStadiumId) === from && String(row.toStadiumId) === to)
    setForm({ from, to, minutes: existing?.travelMinutes ?? '' })
    save.reset()
  }

  function submit(event) {
    event.preventDefault()
    save.submit(() => venueTravelApi.save(id, form.from, form.to, Number(form.minutes)), (saved) => {
      setTravelTimes((rows) => [...rows.filter(({ fromStadiumId, toStadiumId }) =>
        fromStadiumId !== saved.fromStadiumId || toStadiumId !== saved.toStadiumId), saved])
    })
  }

  function options(exclude) {
    return <><option value="">Select a stadium</option>
      {stadiums.filter(({ id }) => id !== exclude).map(({ id, name, availabilityStatus }) =>
        <option key={id} value={id}>{name}{availabilityStatus === 'available' ? '' : ' · unavailable'}</option>)}</>
  }

  const configured = new Set(travelTimes.map((row) => `${row.fromStadiumId}/${row.toStadiumId}`))
  const missing = active.flatMap((from) => active.filter((to) =>
    from.id !== to.id && !configured.has(`${from.id}/${to.id}`)).map((to) => ({ from, to })))

  return <>
    {stadiums.length < 2 ? <p className="form-message">Register at least two stadiums to configure a travel time.</p> :
      <form className="content-panel editor-panel" onSubmit={submit}>
        <div className="panel-heading"><div><span className="panel-kicker">DIRECTED PAIR</span><h2>Set travel minutes</h2></div></div>
        <fieldset className="form-grid" disabled={save.saving}>
          <label>From stadium<select required value={form.from}
            onChange={(event) => select(event.target.value, form.to)}>{options(form.to)}</select></label>
          <label>To stadium<select required value={form.to}
            onChange={(event) => select(form.from, event.target.value)}>{options(form.from)}</select></label>
          <label>Travel minutes<input required type="number" min="0" max="2147483647" step="1" value={form.minutes}
            onChange={(event) => { save.reset(); setForm({ ...form, minutes: event.target.value }) }} /></label>
        </fieldset>
        {save.error && <p className="form-message" role="alert">{save.error.message}</p>}
        {save.saved && <p className="form-message" role="status">Travel time saved.</p>}
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={save.saving}>
          {save.saving ? 'Saving…' : 'Save travel time'}
        </button></div>
      </form>}
    <section className="content-panel data-table-panel">
      <div className="panel-heading"><div><span className="panel-kicker">STADIUM PAIRS</span><h2>Travel time matrix</h2></div>
        <span className="panel-tag">{missing.length} missing between available stadiums</span></div>
      {travelTimes.length || missing.length ? <div className="table-scroll">
        <table className="dark-table data-table"><thead><tr><th>From</th><th>To</th><th>Travel minutes</th><th>Actions</th></tr></thead>
          <tbody>
            {travelTimes.map(({ fromStadiumId: from, toStadiumId: to, travelMinutes }) =>
              <tr key={`${from}/${to}`}><td><strong className="table-name"><MapPin size={14} />{groundName(from)}</strong></td>
                <td>{groundName(to)}</td><td>{travelMinutes}</td><td><span className="row-actions"><button type="button"
                  aria-label={`Edit travel time from ${groundName(from)} to ${groundName(to)}`}
                  disabled={save.saving} onClick={() => select(String(from), String(to))}><Pencil size={15} /></button></span></td></tr>)}
            {missing.map(({ from, to }) => <tr key={`${from.id}/${to.id}`}><td>{from.name}</td><td>{to.name}</td>
              <td>Missing</td><td><button className="button button-secondary" type="button"
                disabled={save.saving} onClick={() => select(from.id, to.id)}>Set time</button></td></tr>)}
          </tbody>
        </table>
      </div> : <p className="empty-filter">No stadium pairs to configure.</p>}
    </section>
  </>
}
