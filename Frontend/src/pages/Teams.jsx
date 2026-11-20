import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { teamApi } from '../api/tournamentResources'
import LiveTournamentResources from '../components/LiveTournamentResources'
import { useResourceEditor } from '../components/useResourceEditor'
import { useTournamentSetup } from '../context/TournamentSetupContext'

const blankTeam = { name: '', college: '', department: '', captain: '', squadSize: 15, pool: 'Pool A' }

export default function TeamsPage() {
  return <LiveTournamentResources api={teamApi} subject="teams" View={TeamsView} />
}

export function DemoTeamsPage() {
  const { teams, tournaments, activeTournament, setActiveTournament, addTeam, updateTeam, removeTeam, updateStepStatus } = useTournamentSetup()
  const [searchParams] = useSearchParams()
  const requestedTournamentId = searchParams.get('tournament')

  useEffect(() => {
    if (requestedTournamentId) setActiveTournament(requestedTournamentId)
  }, [requestedTournamentId, setActiveTournament])

  function save(form, editingId) {
    if (editingId) updateTeam(editingId, { ...form, squadSize: Number(form.squadSize) })
    else addTeam({ ...form, tournamentId: activeTournament?.id, status: 'Registered', initials: form.name.slice(0, 2).toUpperCase() })
    updateStepStatus('teams', 'Completed')
  }

  const selector = <label className="active-tournament-select">Tournament<select value={activeTournament?.id || ''} onChange={(event) => setActiveTournament(event.target.value)}>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></label>
  return <TeamsView key={activeTournament?.id} activeTournament={activeTournament} selector={selector}
    records={teams.filter((team) => team.tournamentId === activeTournament?.id)} save={save}
    removeTeam={removeTeam} onNext={() => updateStepStatus('teams', 'Completed')} />
}

const pools = ['Pool A', 'Pool B', 'Pool C', 'Pool D']

function TeamsView({ activeTournament, selector, records: tournamentTeams, save, removeTeam, onNext }) {
  const demo = Boolean(removeTeam)
  const matchRulesPath = demo ? '/setup/match-config' : `/setup/match-config?tournament=${activeTournament.id}`
  const [query, setQuery] = useState('')
  const { form, setForm, editingId, saving, error, success, open, submit, close } = useResourceEditor(blankTeam, save, 'Team')
  const visibleTeams = useMemo(() => tournamentTeams.filter((team) =>
    `${team.name} ${team.college ?? ''} ${team.pool ?? ''}`.toLowerCase().includes(query.toLowerCase())), [tournamentTeams, query])
  const currentPool = tournamentTeams.find(({ id }) => id === editingId)?.pool

  return (
    <div className="workspace-page data-management-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'Cricket Tournament'}{demo && ' · DEMO DATA'}</span>
        <h1>Registered teams</h1>
        <p>{tournamentTeams.length} teams · {activeTournament?.format || (demo ? 'T20' : 'Cricket')} · Squad registration and group assignments</p>
        {selector}
        <div className="page-actions">
          <button className="button button-primary" type="button" disabled={saving} onClick={() => open()}><Plus size={16} /> Register team</button>
          <Link className="button button-secondary" to={matchRulesPath}>Match rules <ArrowRight size={16} /></Link>
        </div>
      </header>
      {demo && <div className="demo-notice">Changes are saved to this browser’s demo data and persist after refresh. No live backend is connected.</div>}
      {success && <p className="form-message" role="status">{success}</p>}
      <div className="data-toolbar">
        <label className="data-search"><Search size={16} /><span className="sr-only">Search teams</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams or institutions" /></label>
      </div>
      {form && (
        <form className="content-panel editor-panel" onSubmit={submit}>
          <div className="panel-heading"><div><span className="panel-kicker">{editingId ? 'EDIT REGISTRATION' : 'NEW REGISTRATION'}</span><h2>{editingId ? 'Edit team' : 'Register a cricket team'}</h2></div><button type="button" className="button button-quiet" disabled={saving} onClick={close}>Cancel</button></div>
          <fieldset className="form-grid" disabled={saving}>
            <label>Team name<input required maxLength={255} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Institution or club<input required={demo} value={form.college ?? ''} onChange={(event) => setForm({ ...form, college: event.target.value })} /></label>
            <label>Team / department<input value={form.department ?? ''} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
            <label>Captain<input value={form.captain ?? ''} onChange={(event) => setForm({ ...form, captain: event.target.value })} /></label>
            <label>Squad size<input type="number" min={demo ? 11 : 1} max={demo ? 25 : 2147483647} value={form.squadSize ?? ''} onChange={(event) => setForm({ ...form, squadSize: event.target.value })} /></label>
            <label>Group<select value={form.pool ?? ''} onChange={(event) => setForm({ ...form, pool: event.target.value })}>{!demo && <option value="">No group</option>}{currentPool && !pools.includes(currentPool) && <option>{currentPool}</option>}{pools.map((pool) => <option key={pool}>{pool}</option>)}</select></label>
          </fieldset>
          {error && <p className="form-message" role="alert">{error}</p>}
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save team changes' : 'Add team'}</button></div>
        </form>
      )}
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">TEAM ROSTER</span><h2>Teams and registrations</h2></div><span className="panel-tag">{tournamentTeams.length} teams</span></div>
        <div className="table-scroll">
          <table className="dark-table data-table"><thead><tr><th>Team</th><th>Institution</th><th>Captain</th><th>Squad</th><th>Group</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{visibleTeams.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.college}</td><td>{team.captain || 'To be confirmed'}</td><td>{team.squadSize}</td><td>{team.pool}</td><td><span className="tournament-status status-upcoming">{team.status || (demo ? 'Registered' : '—')}</span></td><td><span className="row-actions"><button type="button" aria-label={`Edit ${team.name}`} disabled={saving} onClick={() => open(team)}><Pencil size={15} /></button>{demo && <button type="button" aria-label={`Remove ${team.name}`} onClick={() => removeTeam(team.id)}><Trash2 size={15} /></button>}</span></td></tr>)}</tbody>
          </table>
        </div>
        {visibleTeams.length === 0 && <p className="empty-filter">{tournamentTeams.length ? 'No teams match your search.' : 'No teams registered yet.'}</p>}
      </section>
      <div className="workflow-next"><span>Next: configure the playing format and points system.</span><Link className="button button-primary" to={matchRulesPath} onClick={onNext}>Continue to match rules <ArrowRight size={16} /></Link></div>
    </div>
  )
}
