import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, CalendarDays, RefreshCw, Trophy, Users } from 'lucide-react'
import { teamManagerApi } from '../api/teamManager'

function tournamentPath(path, id) {
  return `${path}?${new URLSearchParams({ tournament: String(id) })}`
}

function dateLabel(value) {
  if (!value) return 'Date not set'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date not set' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined })
}

function Summary({ icon: Icon, label, value }) {
  return <article className="content-panel organizer-summary"><span className="brand-mark"><Icon size={18} /></span><div><span className="field-note">{label}</span><strong>{value}</strong></div></article>
}

function isUpcoming(match) {
  return !match.result && match.startTime && new Date(match.startTime).getTime() > Date.now()
}

function MatchRow({ match }) {
  const result = match.result
  const scores = result
    ? `${result.team1Score}/${result.team1Wickets} (${result.team1Overs}) – ${result.team2Score}/${result.team2Wickets} (${result.team2Overs})`
    : 'Result pending'
  return <tr>
    <td><strong>{match.team1} vs {match.team2}</strong></td>
    <td>{dateLabel(match.startTime)}</td>
    <td>{match.stadium || 'Venue not set'}</td>
    <td>{result ? `${result.resultType.replaceAll('_', ' ')} · ${scores}` : scores}</td>
  </tr>
}

function TeamCard({ team }) {
  const performance = team.performance
  return <article className="content-panel organizer-tournament-card">
    <header className="organizer-card-header">
      <div><span className="eyebrow">ASSIGNED TEAM · {team.status || 'ACTIVE'}</span><h2>{team.teamName}</h2>
        <p>{team.tournamentName} · {dateLabel(team.tournamentStartDate)} – {dateLabel(team.tournamentEndDate)}</p>
        {(team.captain || team.coach) && <p>{[team.captain && `Captain: ${team.captain}`, team.coach && `Coach: ${team.coach}`].filter(Boolean).join(' · ')}</p>}
      </div>
      <Link className="button button-secondary" to={tournamentPath('/teams', team.tournamentId)}>View team</Link>
    </header>
    <div className="organizer-summary-grid">
      <Summary icon={CalendarDays} label="Upcoming fixtures" value={team.matches.filter(isUpcoming).length} />
      <Summary icon={Trophy} label="Completed fixtures" value={team.matches.filter((match) => match.result).length} />
      <Summary icon={Users} label="Wins · Losses" value={`${performance?.won ?? 0} · ${performance?.lost ?? 0}`} />
      <Summary icon={Users} label="Played" value={performance?.played ?? 0} />
      <Summary icon={BarChart3} label="Points · NRR" value={`${performance?.points ?? '0'} · ${performance?.netRunRate ?? '—'}`} />
    </div>
    {team.matches.length ? <div className="table-scroll"><table className="dark-table">
      <thead><tr><th>Fixture</th><th>Match date</th><th>Stadium</th><th>Result / status</th></tr></thead>
      <tbody>{team.matches.map((match) => <MatchRow key={match.fixtureId} match={match} />)}</tbody>
    </table></div> : <p className="field-note">No scheduled fixtures for this team yet.</p>}
    <div className="organizer-workflow-grid">
      <Link className="organizer-workflow-link" to={tournamentPath('/results', team.tournamentId)}>Match results <ArrowRight size={14} /></Link>
      <Link className="organizer-workflow-link" to={tournamentPath('/standings', team.tournamentId)}>Tournament standings <ArrowRight size={14} /></Link>
      <Link className="organizer-workflow-link" to={tournamentPath('/analytics', team.tournamentId)}>Tournament analytics <ArrowRight size={14} /></Link>
    </div>
  </article>
}

export default function TeamManagerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      setData(await teamManagerApi.dashboard(signal))
    } catch (requestError) {
      if (!signal?.aborted) setError(requestError.message || 'Could not load assigned team information.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  return <div className="workspace-page organizer-dashboard">
    <header className="page-intro">
      <span className="eyebrow">TEAM MANAGER WORKSPACE</span>
      <h1>Team Manager Dashboard</h1>
      <p>View your assigned teams, upcoming fixtures and recorded results.</p>
      <div className="page-actions"><button className="button button-secondary" type="button" disabled={loading} onClick={() => load()}><RefreshCw size={15} /> Refresh</button></div>
    </header>
    {loading && !data && <p role="status">Loading assigned teams…</p>}
    {loading && data && <p className="field-note" role="status">Refreshing team data…</p>}
    {error && <section className="content-panel"><p className="form-message" role="alert">{error}</p><button className="button button-secondary" type="button" onClick={() => load()}>Try again</button></section>}
    {!loading && !error && data?.teams?.length === 0 && <section className="empty-panel organizer-empty-state">
      <h2>No team assigned</h2><p>Your account does not have a team assignment yet. Ask an administrator to assign a team.</p>
    </section>}
    {data?.teams?.length > 0 && <>
      <section className="organizer-overview-stats" aria-label="Assigned team totals">
        <Summary icon={Users} label="Assigned teams" value={data.teams.length} />
        <Summary icon={Trophy} label="Tournament entries" value={new Set(data.teams.map((team) => team.tournamentId)).size} />
        <Summary icon={CalendarDays} label="Scheduled fixtures" value={data.teams.reduce((sum, team) => sum + team.matches.length, 0)} />
        <Summary icon={BarChart3} label="Completed matches" value={data.teams.reduce((sum, team) => sum + team.matches.filter((match) => match.result).length, 0)} />
      </section>
      <div className="organizer-tournament-list">{data.teams.map((team) => <TeamCard key={team.teamId} team={team} />)}</div>
    </>}
  </div>
}
