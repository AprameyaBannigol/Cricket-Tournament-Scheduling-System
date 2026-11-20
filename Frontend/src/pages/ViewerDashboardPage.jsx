import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarDays, RefreshCw, Trophy } from 'lucide-react'
import { listTournaments } from '../api/tournaments'
import { matchResultsApi } from '../api/matchResults'
import { statisticsApi } from '../api/statistics'

function pathFor(path, id) {
  return `${path}?${new URLSearchParams({ tournament: String(id) })}`
}

function Summary({ icon: Icon, label, value }) {
  return <article className="content-panel organizer-summary"><span className="brand-mark"><Icon size={18} /></span><div><span className="field-note">{label}</span><strong>{value}</strong></div></article>
}

function ViewerTournament({ item }) {
  const matches = item.matches ?? []
  const upcoming = matches.filter((match) => !match.result)
  const recorded = matches.filter((match) => match.result)
  const leader = item.standings?.[0]
  return <article className="content-panel organizer-tournament-card">
    <header className="organizer-card-header">
      <div><span className="eyebrow">AVAILABLE TOURNAMENT</span><h2>{item.tournament.name}</h2>
        <p>{item.tournament.startDate || 'Dates not set'} – {item.tournament.endDate || 'Dates not set'}</p>
      </div>
      <Link className="button button-secondary" to={`/tournaments/${item.tournament.id}`}>Tournament details</Link>
    </header>
    <div className="organizer-summary-grid">
      <Summary icon={CalendarDays} label="Scheduled matches" value={item.matches ? matches.length : '—'} />
      <Summary icon={Trophy} label="Matches with results" value={item.matches ? recorded.length : '—'} />
      <Summary icon={CalendarDays} label="Pending results" value={item.matches ? upcoming.length : '—'} />
      <Summary icon={BarChart3} label="Current leader" value={item.standings ? (leader?.team || 'No standings yet') : '—'} />
    </div>
    {item.error && <p className="form-message" role="status">Some tournament summaries are unavailable: {item.error}</p>}
    <div className="organizer-workflow-grid">
      <Link className="organizer-workflow-link" to={pathFor('/schedule', item.tournament.id)}>Scheduled matches</Link>
      <Link className="organizer-workflow-link" to={pathFor('/results', item.tournament.id)}>Match results</Link>
      <Link className="organizer-workflow-link" to={pathFor('/standings', item.tournament.id)}>Standings</Link>
      <Link className="organizer-workflow-link" to={pathFor('/analytics', item.tournament.id)}>Analytics</Link>
    </div>
    {item.matches?.length > 0 && <div className="table-scroll"><table className="dark-table">
      <thead><tr><th>Match</th><th>Start</th><th>Stadium</th><th>Result</th></tr></thead>
      <tbody>{item.matches.slice(0, 5).map((match) => <tr key={match.fixtureId}>
        <td><strong>{match.team1} vs {match.team2}</strong></td><td>{match.startTime?.replace('T', ' ') || 'Not scheduled'}</td>
        <td>{match.stadium || 'Venue not set'}</td>
        <td>{match.result ? `${match.result.resultType.replaceAll('_', ' ')} · ${match.result.team1Score}/${match.result.team1Wickets} – ${match.result.team2Score}/${match.result.team2Wickets}` : 'Pending'}</td>
      </tr>)}</tbody>
    </table></div>}
    {item.matches?.length === 0 && <p className="field-note">No saved fixtures are available for this tournament.</p>}
    {item.matches === null && <p className="field-note">Fixture information is unavailable. Retry or open the schedule page.</p>}
  </article>
}

export default function ViewerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      const tournaments = await listTournaments(signal)
      const items = await Promise.all(tournaments.map(async (tournament) => {
        const [matches, standings, analytics] = await Promise.allSettled([
          matchResultsApi.list(tournament.id, signal),
          statisticsApi.standings(tournament.id, signal),
          statisticsApi.analytics(tournament.id, signal),
        ])
        const problems = [matches, standings, analytics].filter((result) => result.status === 'rejected')
        return {
          tournament,
          matches: matches.status === 'fulfilled' ? matches.value : null,
          standings: standings.status === 'fulfilled' ? standings.value : null,
          analytics: analytics.status === 'fulfilled' ? analytics.value : null,
          error: problems.map((result) => result.reason?.message).filter(Boolean).join('; '),
        }
      }))
      if (!signal?.aborted) setData(items)
    } catch (requestError) {
      if (!signal?.aborted) setError(requestError.message || 'Could not load available tournaments.')
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
      <span className="eyebrow">VIEWER WORKSPACE</span><h1>Tournament Viewer</h1>
      <p>Browse tournaments, fixtures, match results, standings and analytics.</p>
      <div className="page-actions"><button className="button button-secondary" type="button" disabled={loading} onClick={() => load()}><RefreshCw size={15} /> Refresh</button></div>
    </header>
    {loading && !data && <p role="status">Loading tournament information…</p>}
    {loading && data && <p className="field-note" role="status">Refreshing tournament information…</p>}
    {error && <section className="content-panel"><p className="form-message" role="alert">{error}</p><button className="button button-secondary" type="button" onClick={() => load()}>Try again</button></section>}
    {!loading && !error && data?.length === 0 && <section className="empty-panel organizer-empty-state"><h2>No tournaments available</h2><p>There are no tournaments to browse yet.</p></section>}
    {data?.length > 0 && <>
      <section className="organizer-overview-stats" aria-label="Tournament totals">
        <Summary icon={Trophy} label="Tournaments" value={data.length} />
        <Summary icon={CalendarDays} label="Scheduled fixtures" value={data.some((item) => item.matches === null) ? '—' : data.reduce((sum, item) => sum + item.matches.length, 0)} />
        <Summary icon={CalendarDays} label="Matches with results" value={data.some((item) => item.matches === null) ? '—' : data.reduce((sum, item) => sum + item.matches.filter((match) => match.result).length, 0)} />
        <Summary icon={BarChart3} label="Total teams" value={data.some((item) => item.analytics === null) ? '—' : data.reduce((sum, item) => sum + item.analytics.totalTeams, 0)} />
      </section>
      <div className="organizer-tournament-list">{data.map((item) => <ViewerTournament key={item.tournament.id} item={item} />)}</div>
    </>}
  </div>
}
