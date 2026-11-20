import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, BarChart3, CalendarDays, CheckCircle2, Clock3, MapPin, RefreshCw, Trophy, Users } from 'lucide-react'
import { organizerApi } from '../api/organizer'

function tournamentPath(path, id) {
  const query = new URLSearchParams({ tournament: String(id) })
  return `${path}?${query}`
}

function dateLabel(value) {
  if (!value) return 'Dates not set'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'Dates not set' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function LinkItem({ to, children }) {
  return <Link className="organizer-workflow-link" to={to}>{children}<ArrowRight size={14} /></Link>
}

function Summary({ icon: Icon, label, value }) {
  return <article className="content-panel organizer-summary"><span className="brand-mark"><Icon size={18} /></span><div><span className="field-note">{label}</span><strong>{value}</strong></div></article>
}

function ResourceNames({ title, items }) {
  return <div className="organizer-resource"><strong>{title} <span>({items.length})</span></strong>
    {items.length ? <ul>{items.map((item) => <li key={item.id}>{item.name}</li>)}</ul> : <p className="field-note">None registered</p>}
  </div>
}

function TournamentCard({ tournament }) {
  const id = tournament.tournamentId
  const progress = Math.max(0, Math.min(100, Number(tournament.completionPercentage) || 0))
  const configurationLink = tournamentPath('/setup/match-config', id)
  return <article className="content-panel organizer-tournament-card">
    <header className="organizer-card-header">
      <div><span className="eyebrow">ASSIGNED TOURNAMENT</span><h2>{tournament.name}</h2><p>{dateLabel(tournament.startDate)} – {dateLabel(tournament.endDate)}</p></div>
      <Link className="button button-secondary" to={`/tournaments/${id}/edit`}>Manage tournament</Link>
    </header>

    <div className="organizer-summary-grid">
      <Summary icon={Users} label="Registered teams" value={tournament.teams.length} />
      <Summary icon={MapPin} label="Stadiums" value={tournament.stadiums.length} />
      <Summary icon={CheckCircle2} label="Officials" value={tournament.officials.length} />
      <Summary icon={CalendarDays} label="Scheduled fixtures" value={tournament.totalScheduledFixtures} />
      <Summary icon={Trophy} label="Completed matches" value={tournament.completedMatches} />
      <Summary icon={Clock3} label="Upcoming matches" value={tournament.upcomingMatches} />
    </div>

    <div className="organizer-detail-grid">
      <ResourceNames title="Teams" items={tournament.teams} />
      <ResourceNames title="Stadiums" items={tournament.stadiums} />
      <ResourceNames title="Officials" items={tournament.officials} />
    </div>

    <section className="organizer-readiness" aria-label={`Scheduling readiness for ${tournament.name}`}>
      <div className={`organizer-readiness-heading ${tournament.schedulingReady ? 'is-ready' : 'needs-setup'}`}>
        {tournament.schedulingReady ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
        <strong>Scheduling {tournament.schedulingReady ? 'ready' : 'not ready'}</strong>
      </div>
      {!tournament.schedulingReady && tournament.readinessIssues?.length > 0 && <ul>{tournament.readinessIssues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}</ul>}
      {tournament.schedulingReady && <p className="field-note">Saved scheduling configuration and resources passed the existing readiness checks.</p>}
      <LinkItem to={configurationLink}>Review match configuration</LinkItem>
    </section>

    <section className="organizer-progress">
      <div className="organizer-progress-heading"><strong>Tournament completion</strong><span>{progress.toFixed(2)}%</span></div>
      <div className="organizer-progress-track" role="progressbar" aria-label="Tournament completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>
    </section>

    <section className="organizer-latest-version">
      <div><span className="eyebrow">LATEST SAVED SCHEDULE</span>
        {tournament.latestScheduleVersion
          ? <p><strong>{tournament.latestScheduleVersion.versionName}</strong> · {tournament.latestScheduleVersion.matchCount} fixtures · {new Date(tournament.latestScheduleVersion.createdAt).toLocaleString()}</p>
          : <p className="field-note">No saved schedule version yet.</p>}
      </div>
      {tournament.latestScheduleVersion && <Link className="button button-secondary" to={tournamentPath('/versions', id)}>View saved versions</Link>}
    </section>

    <section className="organizer-workflows" aria-label={`Management links for ${tournament.name}`}>
      <div className="panel-heading"><div><span className="eyebrow">TOURNAMENT WORKFLOWS</span><h3>Manage this tournament</h3></div></div>
      <div className="organizer-workflow-grid">
        <LinkItem to={`/tournaments/${id}/edit`}>Tournament details</LinkItem>
        <LinkItem to={tournamentPath('/teams', id)}>Teams</LinkItem>
        <LinkItem to={tournamentPath('/stadiums', id)}>Stadiums</LinkItem>
        <LinkItem to={tournamentPath('/officials', id)}>Officials</LinkItem>
        <LinkItem to={tournamentPath('/availability', id)}>Availability</LinkItem>
        <LinkItem to={configurationLink}>Match configuration</LinkItem>
        <LinkItem to={tournamentPath('/setup/constraints', id)}>Scheduling constraints</LinkItem>
        <LinkItem to={tournamentPath('/setup/travel-times', id)}>Venue travel times</LinkItem>
        <LinkItem to={tournamentPath('/schedule/generate', id)}>Generate schedule</LinkItem>
        <LinkItem to={tournamentPath('/versions', id)}>Saved schedule versions</LinkItem>
        <LinkItem to={tournamentPath('/results', id)}>Match results</LinkItem>
        <LinkItem to={tournamentPath('/standings', id)}>Standings</LinkItem>
        <LinkItem to={tournamentPath('/analytics', id)}>Analytics</LinkItem>
      </div>
    </section>
  </article>
}

export default function OrganizerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      setData(await organizerApi.dashboard(signal))
    } catch (requestError) {
      if (!signal?.aborted) setError(requestError.message || 'Could not load assigned tournaments.')
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
      <span className="eyebrow">ORGANIZER WORKSPACE</span>
      <h1>Organizer Dashboard</h1>
      <p>Review assigned tournaments, scheduling readiness and match progress.</p>
      <div className="page-actions"><button className="button button-secondary" type="button" disabled={loading} onClick={() => load()}><RefreshCw size={15} /> Refresh</button></div>
    </header>

    {loading && !data && <p role="status">Loading assigned tournaments…</p>}
    {loading && data && <p className="field-note" role="status">Refreshing dashboard data…</p>}
    {error && <section className="content-panel"><p className="form-message" role="alert">{error}</p><button className="button button-secondary" type="button" onClick={() => load()}>Try again</button></section>}
    {!loading && !error && data?.tournaments?.length === 0 && <section className="empty-panel organizer-empty-state">
      <h2>No tournaments assigned</h2><p>Your account does not have an organizer tournament assignment yet.</p>
      <Link className="button button-primary" to="/tournaments/create">Create a tournament</Link>
    </section>}
    {data?.tournaments?.length > 0 && <>
      <section className="organizer-overview-stats" aria-label="Assigned tournament totals">
        <Summary icon={Trophy} label="Assigned tournaments" value={data.tournaments.length} />
        <Summary icon={Users} label="Teams registered" value={data.tournaments.reduce((sum, item) => sum + item.teams.length, 0)} />
        <Summary icon={CalendarDays} label="Scheduled fixtures" value={data.tournaments.reduce((sum, item) => sum + item.totalScheduledFixtures, 0)} />
        <Summary icon={BarChart3} label="Completed matches" value={data.tournaments.reduce((sum, item) => sum + item.completedMatches, 0)} />
      </section>
      <div className="organizer-tournament-list">{data.tournaments.map((tournament) => <TournamentCard key={tournament.tournamentId} tournament={tournament} />)}</div>
    </>}
  </div>
}
