import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTournamentSetup } from '../context/TournamentSetupContext'

const blankTeam = { name: '', college: '', department: '', captain: '', squadSize: 15, pool: 'Pool A' }

export default function TeamsPage() {
  const { teams, tournaments, activeTournament, setActiveTournament, addTeam, updateTeam, removeTeam, updateStepStatus } = useTournamentSetup()
  const [searchParams] = useSearchParams()
  const requestedTournamentId = searchParams.get('tournament')

  useEffect(() => {
    if (requestedTournamentId) setActiveTournament(requestedTournamentId)
  }, [requestedTournamentId, setActiveTournament])

  const tournamentTeams = teams.filter((team) => team.tournamentId === activeTournament?.id)
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blankTeam)

  const visibleTeams = useMemo(() => tournamentTeams.filter((team) =>
    `${team.name} ${team.college} ${team.pool}`.toLowerCase().includes(query.toLowerCase())), [tournamentTeams, query])

  const editTeam = (team) => {
    setEditingId(team.id)
    setForm({ name: team.name, college: team.college || '', department: team.department || '', captain: team.captain || '', squadSize: team.squadSize || 15, pool: team.pool || 'Pool A' })
    setFormOpen(true)
  }

  const saveTeam = (event) => {
    event.preventDefault()
    if (editingId) updateTeam(editingId, { ...form, squadSize: Number(form.squadSize) })
    else addTeam({ ...form, tournamentId: activeTournament?.id, status: 'Registered', initials: form.name.slice(0, 2).toUpperCase() })
    setForm(blankTeam)
    setEditingId(null)
    setFormOpen(false)
    updateStepStatus('teams', 'Completed')
  }

  const beginAdd = () => {
    setEditingId(null)
    setForm(blankTeam)
    setFormOpen(true)
  }

  return (
    <div className="workspace-page data-management-page">
      <header className="page-intro">
        <span className="eyebrow">{activeTournament?.name || 'Cricket Tournament'} · DEMO DATA</span>
        <h1>Registered teams</h1>
        <p>{tournamentTeams.length} teams · {activeTournament?.format || 'T20'} · Squad registration and group assignments</p>
        <label className="active-tournament-select">Tournament<select value={activeTournament?.id || ''} onChange={(event) => setActiveTournament(event.target.value)}>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></label>
        <div className="page-actions">
          <button className="button button-primary" type="button" onClick={beginAdd}><Plus size={16} /> Register team</button>
          <Link className="button button-secondary" to="/setup/match-config">Match rules <ArrowRight size={16} /></Link>
        </div>
      </header>
      <div className="demo-notice">Changes are saved to this browser’s demo data and persist after refresh. No live backend is connected.</div>
      <div className="data-toolbar">
        <label className="data-search"><Search size={16} /><span className="sr-only">Search teams</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams or institutions" /></label>
      </div>
      {formOpen && (
        <form className="content-panel editor-panel" onSubmit={saveTeam}>
          <div className="panel-heading"><div><span className="panel-kicker">{editingId ? 'EDIT REGISTRATION' : 'NEW REGISTRATION'}</span><h2>{editingId ? 'Edit team' : 'Register a cricket team'}</h2></div><button type="button" className="button button-quiet" onClick={() => setFormOpen(false)}>Cancel</button></div>
          <div className="form-grid">
            <label>Team name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label>Institution or club<input required value={form.college} onChange={(event) => setForm({ ...form, college: event.target.value })} /></label>
            <label>Team / department<input value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
            <label>Captain<input value={form.captain} onChange={(event) => setForm({ ...form, captain: event.target.value })} /></label>
            <label>Squad size<input type="number" min="11" max="25" value={form.squadSize} onChange={(event) => setForm({ ...form, squadSize: event.target.value })} /></label>
            <label>Group<select value={form.pool} onChange={(event) => setForm({ ...form, pool: event.target.value })}>{['Pool A', 'Pool B', 'Pool C', 'Pool D'].map((pool) => <option key={pool}>{pool}</option>)}</select></label>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit">{editingId ? 'Save team changes' : 'Add team'}</button></div>
        </form>
      )}
      <section className="content-panel data-table-panel">
        <div className="panel-heading"><div><span className="panel-kicker">TEAM ROSTER</span><h2>Teams and registrations</h2></div><span className="panel-tag">{tournamentTeams.length} teams</span></div>
        <div className="table-scroll">
          <table className="dark-table data-table"><thead><tr><th>Team</th><th>Institution</th><th>Captain</th><th>Squad</th><th>Group</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{visibleTeams.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.college}</td><td>{team.captain || 'To be confirmed'}</td><td>{team.squadSize}</td><td>{team.pool}</td><td><span className="tournament-status status-upcoming">{team.status || 'Registered'}</span></td><td><span className="row-actions"><button type="button" aria-label={`Edit ${team.name}`} onClick={() => editTeam(team)}><Pencil size={15} /></button><button type="button" aria-label={`Remove ${team.name}`} onClick={() => removeTeam(team.id)}><Trash2 size={15} /></button></span></td></tr>)}</tbody>
          </table>
        </div>
        {visibleTeams.length === 0 && <p className="empty-filter">No teams match your search.</p>}
      </section>
      <div className="workflow-next"><span>Next: configure the playing format and points system.</span><Link className="button button-primary" to="/setup/match-config" onClick={() => updateStepStatus('teams', 'Completed')}>Continue to match rules <ArrowRight size={16} /></Link></div>
    </div>
  )
}
