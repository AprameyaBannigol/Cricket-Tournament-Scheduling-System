import { useCallback, useState } from 'react'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { matchResultsApi } from '../api/matchResults'
import { matchConfigurationApi } from '../api/schedulingConfiguration'
import { scheduleWorkspacePath } from '../api/schedules'
import { useApiResource } from '../api/useApiResource'
import { LiveTournamentSelection } from '../components/LiveTournamentResources'
import TournamentRequestStatus from '../components/TournamentRequestStatus'

export default function LiveResultsPage() {
  return <LiveTournamentSelection>{({ activeTournament, selector }) =>
    <TournamentResults tournament={activeTournament} selector={selector} />}
  </LiveTournamentSelection>
}

function TournamentResults({ tournament, selector }) {
  const { id } = tournament
  const load = useCallback(async (signal) => {
    const [matches, configuration] = await Promise.all([
      matchResultsApi.list(id, signal),
      matchConfigurationApi.get(id, signal),
    ])
    return { matches, oversLimit: configuration?.oversPerInnings ?? null }
  }, [id])
  const request = useApiResource(load)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await matchResultsApi.save(id, selected.fixtureId, {
        resultType: form.resultType,
        team1Score: Number(form.team1Score),
        team1Wickets: Number(form.team1Wickets),
        team1Overs: form.team1Overs,
        team2Score: Number(form.team2Score),
        team2Wickets: Number(form.team2Wickets),
        team2Overs: form.team2Overs,
        remarks: form.remarks || null,
      })
      setSelected(result)
      setForm(resultForm(result, request.data.oversLimit))
      setMessage('Match result saved.')
      request.retry()
    } catch (failure) {
      setError(failure.message)
    } finally {
      setSaving(false)
    }
  }

  if (request.loading || request.error) return <div className="workspace-page">
    <header className="page-intro"><h1>Match results</h1>{selector}</header>
    <TournamentRequestStatus {...request} subject="tournament matches" />
  </div>

  const resultRows = request.data.matches
  const oversLimit = request.data.oversLimit
  const chosen = resultRows.find((row) => row.fixtureId === selected?.fixtureId) ?? selected

  return <div className="workspace-page">
    <header className="page-intro">
      <span className="eyebrow">{tournament.name} · MATCH RESULTS</span>
      <h1>Match results</h1>
      <p>Enter or update a result for a scheduled match.</p>
      {selector}
      <div className="page-actions"><Link className="button button-secondary" to={scheduleWorkspacePath('/schedule', id)}>
        View schedule <CalendarDays size={16} />
      </Link></div>
    </header>
    {message && <p className="form-message" role="status">{message}</p>}
    {oversLimit == null && <p className="form-message" role="alert">
      Save this tournament’s match configuration before entering results.{' '}
      <Link to={scheduleWorkspacePath('/setup/match-config', id)}>Open match configuration</Link>
    </p>}
    {resultRows.length === 0 ? <section className="content-panel">
      <p className="empty-filter">No scheduled matches are available for this tournament.</p>
    </section> : <section className="content-panel data-table-panel">
      <div className="panel-heading"><div><span className="panel-kicker">SCHEDULED MATCHES</span>
        <h2>{resultRows.length} matches</h2></div></div>
      <div className="table-scroll"><table className="dark-table data-table">
        <thead><tr><th>Match</th><th>Date &amp; time</th><th>Stadium</th><th>Result</th><th>Action</th></tr></thead>
        <tbody>{resultRows.map((row) => <tr key={row.fixtureId}>
          <td><strong>{row.team1} vs {row.team2}</strong><br />Match {row.matchNumber} · Round {row.round}</td>
          <td>{row.startTime.replace('T', ' ').slice(0, 16)}</td>
          <td><MapPin size={13} /> {row.stadium}</td>
          <td>{row.result ? resultLabel(row.result) : 'Not entered'}</td>
          <td><button className="button button-secondary" type="button" onClick={() => {
            setSelected(row)
            setForm(resultForm(row, oversLimit))
            setMessage('')
            setError('')
          }} disabled={oversLimit == null}>{row.result ? 'Edit result' : 'Enter result'}</button></td>
        </tr>)}</tbody>
      </table></div>
      {!chosen && <p className="field-note">Select a match to enter its result.</p>}
    </section>}
    {chosen && form && <form className="content-panel editor-panel" onSubmit={save}>
      <div className="panel-heading"><div><span className="panel-kicker">MATCH {chosen.matchNumber}</span>
        <h2>{chosen.team1} vs {chosen.team2}</h2>
        <p>{chosen.startTime.replace('T', ' ').slice(0, 16)} · {chosen.stadium} · {chosen.versionName}</p></div></div>
      <fieldset className="form-grid" disabled={saving}>
        <label>Result type<select required value={form.resultType} onChange={(event) => setForm({ ...form, resultType: event.target.value })}>
          <option value="COMPLETED">Completed</option><option value="TIED">Tied</option>
          <option value="ABANDONED">Abandoned</option><option value="NO_RESULT">No result</option>
        </select></label>
        <label>{chosen.team1} score<input required type="number" min="0" value={form.team1Score} onChange={(event) => setForm({ ...form, team1Score: event.target.value })} /></label>
        <label>{chosen.team1} wickets<input required type="number" min="0" max="10" value={form.team1Wickets} onChange={(event) => setForm({ ...form, team1Wickets: event.target.value })} /></label>
        <label>{chosen.team1} overs (maximum {oversLimit}.0)<input required value={form.team1Overs} placeholder={`Up to ${oversLimit}.0`} aria-label={`${chosen.team1} overs, maximum ${oversLimit}.0`} onChange={(event) => setForm({ ...form, team1Overs: event.target.value })} /></label>
        <label>{chosen.team2} score<input required type="number" min="0" value={form.team2Score} onChange={(event) => setForm({ ...form, team2Score: event.target.value })} /></label>
        <label>{chosen.team2} wickets<input required type="number" min="0" max="10" value={form.team2Wickets} onChange={(event) => setForm({ ...form, team2Wickets: event.target.value })} /></label>
        <label>{chosen.team2} overs (maximum {oversLimit}.0)<input required value={form.team2Overs} placeholder={`Up to ${oversLimit}.0`} aria-label={`${chosen.team2} overs, maximum ${oversLimit}.0`} onChange={(event) => setForm({ ...form, team2Overs: event.target.value })} /></label>
        <label className="form-wide">Remarks<textarea maxLength="1000" value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} /></label>
      </fieldset>
      {error && <p className="form-message" role="alert">{error}</p>}
      <div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}>
        {saving ? 'Saving…' : chosen.result ? 'Update result' : 'Save result'} <ArrowRight size={16} />
      </button></div>
    </form>}
  </div>
}
function resultForm(row, oversLimit) {
  const result = row.result
  return {
    resultType: result?.resultType ?? 'COMPLETED',
    team1Score: result?.team1Score ?? '',
    team1Wickets: result?.team1Wickets ?? 0,
    team1Overs: result?.team1Overs ?? `${oversLimit}.0`,
    team2Score: result?.team2Score ?? '',
    team2Wickets: result?.team2Wickets ?? 0,
    team2Overs: result?.team2Overs ?? `${oversLimit}.0`,
    remarks: result?.remarks ?? '',
  }
}
function resultLabel(result) {
  if (result.winner) return `${result.winner} won by ${result.winningMargin} runs`
  return result.resultType === 'TIED' ? 'Tied' : result.resultType.replaceAll('_', ' ')
}
