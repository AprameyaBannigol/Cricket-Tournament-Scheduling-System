import { useCallback } from 'react'
import { ArrowRight, RefreshCw, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { statisticsApi } from '../api/statistics'
import { scheduleWorkspacePath } from '../api/schedules'
import { useApiResource } from '../api/useApiResource'
import { LiveTournamentSelection } from '../components/LiveTournamentResources'
import TournamentRequestStatus from '../components/TournamentRequestStatus'

export default function LiveStandingsPage() {
  return <LiveTournamentSelection>{({ activeTournament, selector }) =>
    <TournamentStandings tournament={activeTournament} selector={selector} />
  }</LiveTournamentSelection>
}

function TournamentStandings({ tournament, selector }) {
  const load = useCallback((signal) => statisticsApi.standings(tournament.id, signal), [tournament.id])
  const request = useApiResource(load)
  if (request.loading || request.error) return <div className="workspace-page">
    <header className="page-intro"><h1>Standings</h1>{selector}</header>
    <TournamentRequestStatus {...request} subject="tournament standings" />
  </div>

  return <div className="workspace-page">
    <header className="page-intro">
      <span className="eyebrow">{tournament.name} · TOURNAMENT TABLE</span>
      <h1>Standings</h1>
      <p>Current points and net run rate from saved match results.</p>
      {selector}
      <div className="page-actions">
        <Link className="button button-secondary" to={scheduleWorkspacePath('/results', tournament.id)}>Match results <ArrowRight size={16} /></Link>
        <button className="button button-secondary" type="button" onClick={request.retry}><RefreshCw size={15} /> Refresh</button>
      </div>
    </header>
    <section className="content-panel data-table-panel">
      <div className="panel-heading"><div><span className="panel-kicker">LIVE RESULTS</span><h2>Group standings</h2></div><span className="panel-tag">{request.data.length} teams</span></div>
      {request.data.length === 0 ? <p className="empty-filter">No teams are registered for this tournament.</p> : <div className="table-scroll">
        <table className="dark-table data-table">
          <thead><tr><th>Position</th><th>Team</th><th>Played</th><th>Won</th><th>Lost</th><th>Tied</th><th>No result</th><th>Points</th><th>NRR</th></tr></thead>
          <tbody>{request.data.map((row) => <tr key={row.teamId}>
            <td><span className={`rank ${row.position <= 2 ? 'rank-first' : ''}`}>{row.position}</span></td>
            <td><strong>{row.team}</strong></td><td>{row.played}</td><td>{row.won}</td><td>{row.lost}</td><td>{row.tied}</td><td>{row.noResult}</td><td><b>{Number(row.points).toFixed(0)}</b></td>
            <td>{row.netRunRate == null ? '—' : `${Number(row.netRunRate) > 0 ? '+' : ''}${Number(row.netRunRate).toFixed(3)}`}</td>
          </tr>)}</tbody>
        </table>
      </div>}
      <div className="standings-legend"><span><Trophy size={14} /> Points, then NRR, then team name determine order.</span><span>NRR uses legal balls. All-out innings use the configured full overs. Shortened innings use recorded overs; revised DLS targets are not stored, so no target-resource adjustment is applied. NRR is shown as unavailable for all-out innings without match configuration.</span></div>
    </section>
  </div>
}
