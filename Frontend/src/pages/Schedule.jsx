import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin, Pencil, ShieldCheck, Users } from 'lucide-react'
import { useTournamentSetup } from '../context/TournamentSetupContext'

const viewOptions = ['List', 'Calendar', 'Team-wise', 'Stadium-wise']

function showDate(date) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function SchedulePage() {
  const { pathname } = useLocation()
  const resultsPage = pathname === '/results'
  const { activeTournament, tournaments, setActiveTournament, teams: allTeams, matches: allMatches } = useTournamentSetup()
  const [view, setView] = useState('List')
  const [teamFilter, setTeamFilter] = useState('')
  const [stadiumFilter, setStadiumFilter] = useState('')
  const [resultMatchId, setResultMatchId] = useState(null)

  const matches = useMemo(() => allMatches.filter((match) => match.tournamentId === activeTournament?.id), [allMatches, activeTournament?.id])
  const teams = useMemo(() => allTeams.filter((team) => team.tournamentId === activeTournament?.id), [allTeams, activeTournament?.id])
  const filteredMatches = useMemo(() => matches.filter((match) => {
    const hasTeam = !teamFilter || match.teamA === teamFilter || match.teamB === teamFilter
    const hasStadium = !stadiumFilter || match.stadium === stadiumFilter
    return hasTeam && hasStadium
  }), [matches, teamFilter, stadiumFilter])

  const teamMatches = view === 'Team-wise' && !teamFilter
    ? filteredMatches.flatMap((match) => [
      { ...match, groupTeam: match.teamA },
      { ...match, groupTeam: match.teamB },
    ])
    : filteredMatches
  const groupKey = view === 'Calendar'
    ? (match) => match.date
    : view === 'Team-wise'
      ? (match) => teamFilter || match.groupTeam || match.teamA
      : view === 'Stadium-wise'
        ? (match) => match.stadium
        : () => 'All fixtures'
  const groups = groupBy(teamMatches, groupKey)
  const stadiums = [...new Set(matches.map((match) => match.stadium))].filter(Boolean)

  return (
    <div className="workspace-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'Cricket tournament'} · DEMO DATA</span>
        <h1>{resultsPage ? 'Match results' : 'Match schedule'}</h1>
        <p>{resultsPage ? 'Enter or update sample scores; the points table recalculates from saved results.' : 'Generated fixtures, grounds and match officials for the selected tournament.'}</p>
        <div className="page-actions">
          <Link className="button button-primary" to="/schedule/generate">Generate sample fixtures <CalendarDays size={16} /></Link>
          <Link className="button button-secondary" to="/schedule/conflicts">Review conflicts</Link>
          <Link className="button button-secondary" to="/versions">Schedule versions</Link>
          <Link className="button button-secondary" to="/results">Match results</Link>
          <Link className="button button-secondary" to="/standings">Standings</Link>
        </div>
      </header>
      <div className="demo-notice">Sample schedule stored in this browser. Venue and official examples are not backend-validated.</div>
      <section className="content-panel">
        <div className="schedule-toolbar">
          <div className="schedule-views" aria-label="Schedule view">
            {viewOptions.map((option) => <button key={option} type="button" className={view === option ? 'selected' : ''} aria-pressed={view === option} onClick={() => setView(option)}>{option}</button>)}
          </div>
          <div className="schedule-filters">
            <label><span className="sr-only">Select tournament</span><select value={activeTournament?.id || ''} onChange={(event) => { setActiveTournament(event.target.value); setTeamFilter(''); setStadiumFilter('') }}>{tournaments.map((tournament) => <option value={tournament.id} key={tournament.id}>{tournament.name}</option>)}</select></label>
            <label><span className="sr-only">Filter by team</span><select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}><option value="">All teams</option>{teams.map((team) => <option key={team.id}>{team.name}</option>)}</select></label>
            <label><span className="sr-only">Filter by stadium</span><select value={stadiumFilter} onChange={(event) => setStadiumFilter(event.target.value)}><option value="">All grounds</option>{stadiums.map((stadium) => <option key={stadium}>{stadium}</option>)}</select></label>
          </div>
        </div>
        {filteredMatches.length ? (
          <div className="schedule-groups">
            {groups.map(([group, groupMatches]) => <section className="schedule-group" key={group}>
              {view !== 'List' && <h2>{view === 'Calendar' ? showDate(group) : group}</h2>}
              <div className="schedule-match-list">
                {groupMatches.map((match) => <ScheduleMatch key={match.id} match={match} resultOpen={resultMatchId === match.id} onToggleResult={() => setResultMatchId(resultMatchId === match.id ? null : match.id)} />)}
              </div>
            </section>)}
          </div>
        ) : <p className="empty-filter">No matches found. Generate sample fixtures or adjust your filters.</p>}
      </section>
    </div>
  )
}

function ScheduleMatch({ match, resultOpen, onToggleResult }) {
  const { enterMatchResult } = useTournamentSetup()
  const [scoreA, setScoreA] = useState(match.scoreA ?? '')
  const [scoreB, setScoreB] = useState(match.scoreB ?? '')
  const [oversA, setOversA] = useState(match.oversA || '20.0')
  const [oversB, setOversB] = useState(match.oversB || '20.0')
  const [error, setError] = useState('')

  const saveResult = (event) => {
    event.preventDefault()
    try {
      enterMatchResult(match.id, scoreA, scoreB, oversA, oversB)
      setError('')
    } catch (validationError) {
      setError(validationError.message)
    }
  }

  return (
    <article className="schedule-match">
      <span className={`match-status status-${match.status.toLowerCase()}`}>{match.status}</span>
      <span className="match-time"><Clock3 size={14} />{match.time}</span>
      <div className="match-main">
        <strong>{match.teamA} <i>vs</i> {match.teamB}</strong>
        <small>Match {match.matchNumber} · {match.round} · {showDate(match.date)}</small>
        {match.status === 'Completed' && <b className="match-score">{match.teamA} {match.scoreA}/{match.oversA} · {match.teamB} {match.scoreB}/{match.oversB} {match.winner ? `· ${match.winner} won` : ''}</b>}
        <div className="match-details">
          <span><MapPin size={13} />{match.stadium} · {match.pitch || 'Pitch TBC'}</span>
          <span><Users size={13} />{match.officials?.join(', ') || 'Officials to be assigned'}</span>
        </div>
        {resultOpen && (
          <form className="match-result-form" onSubmit={saveResult}>
            <label>{match.teamA} runs<input aria-label={`${match.teamA} runs`} type="number" min="0" max="999" required value={scoreA} onChange={(event) => setScoreA(event.target.value)} /></label>
            <label>Overs<input aria-label={`${match.teamA} overs`} value={oversA} onChange={(event) => setOversA(event.target.value)} /></label>
            <label>{match.teamB} runs<input aria-label={`${match.teamB} runs`} type="number" min="0" max="999" required value={scoreB} onChange={(event) => setScoreB(event.target.value)} /></label>
            <label>Overs<input aria-label={`${match.teamB} overs`} value={oversB} onChange={(event) => setOversB(event.target.value)} /></label>
            <button className="button button-primary" type="submit">Save demo result</button>
            {error && <span className="form-message" role="alert">{error}</span>}
          </form>
        )}
      </div>
      <span className="match-date">{match.date}</span>
      <button className="match-result-toggle" type="button" onClick={onToggleResult}><Pencil size={14} /> {match.status === 'Completed' ? 'Edit result' : 'Enter result'}</button>
    </article>
  )
}

export function ScheduleVersionsPage() {
  const { activeTournament, scheduleVersions: allVersions, restoreScheduleVersion, matches } = useTournamentSetup()
  const [restoredVersion, setRestoredVersion] = useState('')
  const scheduleVersions = allVersions.filter((version) => (version.tournamentId || version.matches[0]?.tournamentId) === activeTournament?.id)
  const activeMatches = matches.filter((match) => match.tournamentId === activeTournament?.id)

  return (
    <div className="workspace-page">
      <header className="page-intro">
        <span className="eyebrow">SCHEDULE HISTORY · DEMO DATA</span>
        <h1>Schedule versions</h1>
        <p>Generated schedules are snapshotted locally so you can compare drafts and restore a previous version.</p>
        <div className="page-actions"><Link className="button button-secondary" to="/schedule">Current schedule <CalendarDays size={16} /></Link><Link className="button button-primary" to="/schedule/generate">Generate a new version</Link></div>
      </header>
      <div className="demo-notice">Restoring a version replaces the active demo fixtures. This change is saved in this browser.</div>
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">VERSION HISTORY</span><h2>{scheduleVersions.length} saved versions</h2></div><span className="panel-tag">{activeMatches.length} active fixtures</span></div>
        <div className="version-list">{scheduleVersions.map((version, index) => <article className="version-row" key={version.id}><div><strong>{version.label}</strong><span>{new Date(version.createdAt).toLocaleString()}</span></div><span>{version.matchCount} fixtures</span><button className="button button-secondary" type="button" disabled={index === 0} onClick={() => { restoreScheduleVersion(version.id); setRestoredVersion(version.label) }}>{index === 0 ? 'Current' : 'Restore this version'}</button></article>)}</div>
        {restoredVersion && <p className="form-message" role="status">Restored {restoredVersion} to the active schedule.</p>}
      </section>
    </div>
  )
}

function groupBy(items, keyFor) {
  const groups = new Map()
  items.forEach((item) => {
    const key = keyFor(item)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return [...groups.entries()]
}
