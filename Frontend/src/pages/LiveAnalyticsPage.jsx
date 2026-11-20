import { useCallback } from 'react'
import { Activity, CalendarDays, MapPin, RefreshCw, Trophy, Users } from 'lucide-react'
import { statisticsApi } from '../api/statistics'
import { LiveTournamentSelection } from '../components/LiveTournamentResources'
import TournamentRequestStatus from '../components/TournamentRequestStatus'
import { useApiResource } from '../api/useApiResource'

export default function LiveAnalyticsPage() {
  return <LiveTournamentSelection>{({ activeTournament, selector }) =>
    <TournamentAnalytics tournament={activeTournament} selector={selector} />
  }</LiveTournamentSelection>
}

function TournamentAnalytics({ tournament, selector }) {
  const load = useCallback((signal) => statisticsApi.analytics(tournament.id, signal), [tournament.id])
  const request = useApiResource(load)
  if (request.loading || request.error) return <div className="workspace-page">
    <header className="page-intro"><h1>Analytics</h1>{selector}</header>
    <TournamentRequestStatus {...request} subject="tournament analytics" />
  </div>

  const data = request.data
  const distribution = [
    ['Completed', data.resultDistribution.completed, 'bg-emerald-600'],
    ['Tied', data.resultDistribution.tied, 'bg-blue-500'],
    ['Abandoned', data.resultDistribution.abandoned, 'bg-amber-500'],
    ['No result', data.resultDistribution.noResult, 'bg-slate-400'],
  ]
  const maxTeamWins = Math.max(1, ...data.teamPerformance.map((team) => team.wins))

  return <div className="workspace-page">
    <header className="page-intro">
      <span className="eyebrow">{tournament.name} · LIVE DATA</span>
      <h1>Analytics</h1>
      <p>Tournament progress and team performance from saved fixtures and match results.</p>
      {selector}
      <div className="page-actions"><button className="button button-secondary" type="button" onClick={request.retry}><RefreshCw size={15} /> Refresh</button></div>
    </header>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard icon={Users} label="Teams" value={data.totalTeams} />
      <SummaryCard icon={CalendarDays} label="Fixtures" value={data.totalFixtures} />
      <SummaryCard icon={Activity} label="Completed" value={data.completedMatches} detail={`${data.pendingMatches} pending · ${data.noResultMatches} no result`} />
      <SummaryCard icon={Trophy} label="Total runs" value={data.totalRuns} detail={`${data.totalWickets} wickets recorded`} />
    </div>
    <section className="content-panel">
      <div className="panel-heading"><div><span className="panel-kicker">TOURNAMENT PROGRESS</span><h2>{Number(data.completionPercentage).toFixed(1)}% complete</h2></div></div>
      <div className="h-3 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--app-border-soft)' }} role="progressbar" aria-valuenow={Number(data.completionPercentage)} aria-valuemin="0" aria-valuemax="100">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${Math.max(0, Math.min(100, Number(data.completionPercentage)))}%` }} />
      </div>
      <p className="field-note">Completed, tied, abandoned and no-result fixtures count as finished.</p>
    </section>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <section className="content-panel"><div className="panel-heading"><div><span className="panel-kicker">RESULTS</span><h2>Match result distribution</h2></div></div>
        {data.totalFixtures === 0 ? <p className="empty-filter">No fixtures are available yet.</p> : <div className="space-y-4">{distribution.map(([label, count, color]) => <div key={label}>
          <div className="mb-1 flex justify-between text-sm"><span>{label}</span><strong>{count}</strong></div>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--app-border-soft)' }}><div className={`h-full ${color}`} style={{ width: `${data.totalFixtures ? count / data.totalFixtures * 100 : 0}%` }} /></div>
        </div>)}</div>}
      </section>
      <section className="content-panel"><div className="panel-heading"><div><span className="panel-kicker">TEAM PERFORMANCE</span><h2>Wins and losses</h2></div></div>
        {data.teamPerformance.length === 0 ? <p className="empty-filter">No teams are registered for this tournament.</p> : <div className="space-y-4">{data.teamPerformance.map((team) => <div key={team.teamId}>
          <div className="mb-1 flex justify-between gap-3 text-sm"><strong className="truncate">{team.team}</strong><span>{team.wins} W · {team.losses} L</span></div>
          <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--app-border-soft)' }}><div className="h-full rounded-full bg-emerald-600" style={{ width: `${team.wins / maxTeamWins * 100}%` }} /></div>
        </div>)}</div>}
      </section>
    </div>
    <section className="content-panel"><div className="panel-heading"><div><span className="panel-kicker">VENUES</span><h2>Stadium usage</h2></div><MapPin size={18} /></div>
      {data.stadiumUsage.length === 0 ? <p className="empty-filter">No scheduled fixtures have stadium assignments.</p> : <div className="table-scroll"><table className="dark-table data-table">
        <thead><tr><th>Stadium</th><th>Fixtures</th></tr></thead><tbody>{data.stadiumUsage.map((venue) => <tr key={venue.stadiumId}><td><strong>{venue.stadium}</strong></td><td>{venue.fixtures}</td></tr>)}</tbody>
      </table></div>}
    </section>
  </div>
}

function SummaryCard({ icon: Icon, label, value, detail }) {
  return <section className="content-panel"><div className="mb-2 flex items-center gap-2 text-slate-500"><Icon size={16} /><span className="text-sm">{label}</span></div>
    <strong className="text-2xl" style={{ color: 'var(--app-text)' }}>{value}</strong>{detail && <p className="field-note">{detail}</p>}
  </section>
}
