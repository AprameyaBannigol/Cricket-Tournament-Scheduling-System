import { useCallback, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CalendarDays, Clock3, MapPin, Shield, Users } from 'lucide-react'
import { scheduleApi, scheduleWorkspacePath } from '../api/schedules'
import { useApiResource } from '../api/useApiResource'
import { LiveTournamentSelection } from '../components/LiveTournamentResources'
import TournamentRequestStatus from '../components/TournamentRequestStatus'
import useSchedulingConfigurationSave from '../components/useSchedulingConfigurationSave'
import { ScheduleFixtures } from './Schedule'

export function LiveGenerateSchedulePage() {
  return <LiveTournamentSelection clearScheduleVersion>{({ activeTournament, selector }) =>
    <GenerateScheduleForm tournament={activeTournament} selector={selector} />}
  </LiveTournamentSelection>
}

const setupLinks = [
  ['/teams', Users, 'Teams'],
  ['/stadiums', MapPin, 'Stadiums'],
  ['/officials', Shield, 'Officials'],
  ['/availability', CalendarDays, 'Availability'],
  ['/setup/match-config', Clock3, 'Match rules'],
  ['/setup/constraints', Shield, 'Constraints'],
  ['/setup/travel-times', MapPin, 'Travel times'],
]

function SchedulingIssues({ issues }) {
  return issues?.length > 0 && <ul className="form-message list-disc pl-6">
    {issues.map(({ code, message, matchNumber }, i) =>
      <li key={`${code}/${matchNumber}/${i}`}>{message}</li>)}
  </ul>
}

function GenerateScheduleForm({ tournament, selector }) {
  const navigate = useNavigate()
  const { id } = tournament
  const [versionName, setVersionName] = useState('')
  const save = useSchedulingConfigurationSave()
  const load = useCallback((signal) => scheduleApi.readiness(id, signal), [id])
  const request = useApiResource(load)
  const ready = request.data?.ready === true

  function generate(event) {
    event.preventDefault()
    if (!ready || !versionName.trim()) return
    save.submit(() => scheduleApi.generate(id, versionName.trim()), ({ versionId }) => {
      navigate(scheduleWorkspacePath('/schedule', id, versionId), {
        state: { generatedVersionId: versionId },
      })
    })
  }

  return <div className="workspace-page">
    <header className="page-intro">
      <span className="eyebrow">SCHEDULING</span>
      <h1>Generate a schedule</h1>
      <p>Generate round-robin fixtures from the saved tournament setup.</p>
      {selector}
      <div className="page-actions">
        <Link className="button button-secondary" to={scheduleWorkspacePath('/versions', id)}>Schedule versions</Link>
      </div>
    </header>
    {request.loading || request.error ? <TournamentRequestStatus {...request} subject="scheduling readiness" /> :
      <form className="content-panel scheduling-form" onSubmit={generate}>
        <div className="panel-heading">
          <div><span className="panel-kicker">PLANNING INPUTS</span><h2>Scheduling readiness</h2></div>
          <span className="panel-tag" role="status">{ready ? 'Ready to generate' : 'Setup required'}</span>
        </div>
        <div className="form-grid">
          <label>Start date<input type="date" value={tournament.startDate} readOnly /></label>
          <label>End date<input type="date" value={tournament.endDate} readOnly /></label>
          <label className="form-wide">Version name<input required maxLength={100} value={versionName}
            disabled={save.saving} onChange={(event) => setVersionName(event.target.value)} /></label>
        </div>
        <div className="planning-checklist">
          <p>Review saved inputs</p>
          <Link to={`/tournaments/${id}/edit`}><CalendarDays size={16} /> Tournament dates <ArrowUpRight size={14} /></Link>
          {setupLinks.map(([path, Icon, name]) => <Link key={path} to={scheduleWorkspacePath(path, id)}>
            <Icon size={16} /> {name} <ArrowUpRight size={14} />
          </Link>)}
        </div>
        <SchedulingIssues issues={request.data?.issues} />
        {ready && <p className="field-note">Each fixture has a candidate slot. Generation checks whether all fixtures can be scheduled together.</p>}
        <div className="page-actions">
          <button className="button button-primary" type="submit" disabled={!ready || !versionName.trim() || save.saving}>
            {save.saving ? 'Generating…' : 'Generate & save schedule'} <ArrowRight size={16} />
          </button>
          <button className="button button-secondary" type="button" disabled={save.saving}
            onClick={() => { save.reset(); request.retry() }}>Recheck readiness</button>
        </div>
        {save.error && <div role="alert">
          <p className="form-message">{save.error.message}</p>
          <SchedulingIssues issues={save.error.issues} />
          {save.error.status === 404 && <Link className="text-link" to="/tournaments">Back to tournaments</Link>}
          {(save.error.status === 0 || save.error.status === 409) &&
            <Link className="text-link" to={scheduleWorkspacePath('/versions', id)}>Check saved versions</Link>}
        </div>}
      </form>}
  </div>
}

export function LiveScheduleVersionsPage() {
  return <LiveTournamentSelection clearScheduleVersion>{({ activeTournament, selector }) =>
    <ScheduleVersionList tournament={activeTournament} selector={selector} />}
  </LiveTournamentSelection>
}

function ScheduleVersionList({ tournament, selector, openLatest = false }) {
  const { id } = tournament
  const [query] = useSearchParams()
  const version = query.get('version')
  const load = useCallback((signal) => scheduleApi.list(id, signal), [id])
  const request = useApiResource(load)

  if (openLatest && request.data?.length) {
    return <Navigate replace to={scheduleWorkspacePath('/schedule', id, request.data[0].versionId)} />
  }

  return <div className="workspace-page">
    <header className="page-intro">
      <span className="eyebrow">{tournament.name} · SCHEDULE HISTORY</span>
      <h1>{openLatest ? 'Match schedule' : 'Schedule versions'}</h1>
      <p>Browse read-only versions saved by the scheduling engine.</p>
      {selector}
      <div className="page-actions">
        <Link className="button button-primary" to={scheduleWorkspacePath('/schedule/generate', id)}>Generate a new version</Link>
        {version && <Link className="button button-secondary" to={scheduleWorkspacePath('/schedule', id, version)}>Back to selected version</Link>}
      </div>
    </header>
    {request.loading || request.error ? <TournamentRequestStatus {...request} subject="schedule versions" /> :
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">VERSION HISTORY</span>
          <h2>{request.data.length} saved versions</h2></div></div>
        {request.data.length ? <div className="version-list">{request.data.map((row) =>
          <article className="version-row" key={row.versionId}>
            <div><strong>{row.versionName}</strong><span>{formatSavedDate(row.createdAt)}</span></div>
            <span>{row.matchCount} {row.matchCount === 1 ? 'fixture' : 'fixtures'}</span>
            <Link className="button button-secondary" to={scheduleWorkspacePath('/schedule', id, row.versionId)}>
              View fixtures <ArrowRight size={15} />
            </Link>
          </article>)}</div> : <p className="empty-filter">No schedule versions have been saved for this tournament.</p>}
      </section>}
  </div>
}

export function LiveSchedulePage() {
  const [query] = useSearchParams()
  const version = query.get('version')
  return <LiveTournamentSelection clearScheduleVersion>{({ activeTournament, selector }) =>
    version === null
      ? <ScheduleVersionList tournament={activeTournament} selector={selector} openLatest />
      : <SavedScheduleDetail key={version} tournament={activeTournament} selector={selector} version={version} />}
  </LiveTournamentSelection>
}

function SavedScheduleDetail({ tournament, selector, version }) {
  const { id } = tournament
  const { state } = useLocation()
  const load = useCallback((signal) => scheduleApi.get(id, version, signal), [id, version])
  const request = useApiResource(load)
  const schedule = request.data
  const teams = schedule ? [...new Set(schedule.matches.flatMap(({ teamA, teamB }) => [teamA, teamB]))]
    .sort().map((name) => ({ id: name, name })) : []

  return <div className="workspace-page">
    <header className="page-intro">
      <span className="eyebrow">{tournament.name} · SAVED SCHEDULE</span>
      <h1>{schedule?.versionName ?? 'Match schedule'}</h1>
      {schedule && <p>{schedule.matchCount} {schedule.matchCount === 1 ? 'fixture' : 'fixtures'} · {formatSavedDate(schedule.createdAt)} · Match times in IST</p>}
      {selector}
      <div className="page-actions">
        <Link className="button button-primary" to={scheduleWorkspacePath('/schedule/generate', id)}>Generate a new version <CalendarDays size={16} /></Link>
        <Link className="button button-secondary" to={scheduleWorkspacePath('/versions', id, version)}>Schedule versions</Link>
        <Link className="button button-secondary" to={scheduleWorkspacePath('/results', id)}>Match results</Link>
      </div>
    </header>
    {request.loading || request.error ? <TournamentRequestStatus {...request} subject="schedule version"
      notFoundTitle={request.error?.message?.startsWith('Tournament not found:') ? undefined : 'Schedule version not found'} /> :
      <>
        {state?.generatedVersionId === schedule.versionId && <p className="form-message" role="status">Schedule saved as {schedule.versionName}.</p>}
        <ScheduleFixtures matches={schedule.matches} teams={teams} />
      </>}
  </div>
}

function formatSavedDate(date) {
  return date ? date.replace('T', ' ').slice(0, 16) : ''
}
