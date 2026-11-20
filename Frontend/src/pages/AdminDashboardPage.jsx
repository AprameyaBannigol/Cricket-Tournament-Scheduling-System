import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, RefreshCw, Shield, Users, Trophy, UserPlus } from 'lucide-react'
import { adminApi } from '../api/admin'
import { listTournaments } from '../api/tournaments'
import { teamApi } from '../api/tournamentResources'

const roles = ['ADMIN', 'ORGANIZER', 'TEAM_MANAGER', 'VIEWER']

function Message({ children, success = false }) {
  return children ? <p className={`form-message ${success ? 'success-message' : ''}`} role={success ? 'status' : 'alert'}>{children}</p> : null
}

function Stat({ title, value, icon: Icon }) {
  return <article className="content-panel" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
    <span className="brand-mark"><Icon size={18} /></span>
    <div><p className="field-note">{title}</p><strong style={{ color: 'var(--app-text)', fontSize: 23 }}>{value ?? '—'}</strong></div>
  </article>
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [tournaments, setTournaments] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState({ text: '', success: false })
  const [create, setCreate] = useState({ email: '', password: '', roles: ['VIEWER'] })
  const [organizer, setOrganizer] = useState({ userId: '', tournamentId: '' })
  const [manager, setManager] = useState({ userId: '', teamId: '' })
  const [roleDrafts, setRoleDrafts] = useState({})

  const load = useCallback(async (signal) => {
    setLoading(true)
    setLoadError('')
    try {
      const [dashboard, tournamentList] = await Promise.all([
        adminApi.dashboard(signal), listTournaments(signal),
      ])
      const teamLists = await Promise.all(tournamentList.map((item) => teamApi.list(item.id, signal)))
      setData(dashboard)
      setTournaments(tournamentList)
      setTeams(teamLists.flatMap((list) => list.map((team) => ({ ...team,
        tournamentName: tournamentList.find((tournament) => tournament.id === team.tournamentId)?.name ?? 'Tournament',
      }))))
      setRoleDrafts(Object.fromEntries((dashboard.users ?? []).map((user) => [user.id, [...user.roles]])))
    } catch (error) {
      if (!signal?.aborted) setLoadError(error.message || 'Could not load administration data.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  const organizers = useMemo(() => (data?.users ?? []).filter((user) => user.roles.includes('ORGANIZER')), [data])
  const managers = useMemo(() => (data?.users ?? []).filter((user) => user.roles.includes('TEAM_MANAGER')), [data])

  async function act(key, operation, successText) {
    setBusy(key)
    setMessage({ text: '', success: false })
    try {
      await operation()
      setMessage({ text: successText, success: true })
      await load()
    } catch (error) {
      setMessage({ text: error.message || 'The request failed. Please retry.', success: false })
    } finally {
      setBusy('')
    }
  }

  function toggleRole(role) {
    setCreate((current) => ({ ...current, roles: current.roles.includes(role)
      ? current.roles.filter((value) => value !== role) : [...current.roles, role] }))
  }

  function toggleDraftRole(userId, role) {
    setRoleDrafts((current) => {
      const selected = current[userId] ?? []
      return { ...current, [userId]: selected.includes(role)
        ? selected.filter((value) => value !== role) : [...selected, role] }
    })
  }

  if (loading && !data) return <div className="workspace-page"><p role="status">Loading admin dashboard…</p></div>
  if (loadError && !data) return <div className="workspace-page"><section className="content-panel"><Message>{loadError}</Message><button className="button button-primary" type="button" onClick={() => load()}>Retry</button></section></div>

  return <div className="workspace-page">
    <header className="page-intro">
      <p className="eyebrow">ADMINISTRATION</p>
      <h1>Admin Dashboard</h1>
      <p>Manage user accounts, roles and resource assignments.</p>
      <div className="page-actions"><button className="button button-secondary" type="button" disabled={loading} onClick={() => load()}><RefreshCw size={15} /> Refresh</button></div>
    </header>

    <Message success={message.success}>{message.text}</Message>
    {loadError && <Message>{loadError}</Message>}
    {loading && <p role="status" className="field-note">Refreshing administration data…</p>}

    <section className="admin-dashboard-grid" aria-label="Administration totals">
      <Stat title="Registered users" value={data?.totalUsers} icon={Users} />
      <Stat title="Tournaments" value={data?.totalTournaments} icon={Trophy} />
      <Stat title="Teams" value={data?.totalTeams} icon={Shield} />
      <article className="content-panel">
        <div className="panel-heading"><div><p className="eyebrow">USERS BY ROLE</p><h2>Role distribution</h2></div></div>
        <div className="role-counts">{roles.map((role) => <span key={role}>{role.replace('_', ' ')} <strong>{data?.usersByRole?.[role] ?? 0}</strong></span>)}</div>
      </article>
    </section>

    <section className="content-panel" style={{ marginTop: 22 }}>
      <div className="panel-heading"><div><p className="eyebrow">ACCOUNT PROVISIONING</p><h2>Create user account</h2></div><UserPlus size={18} /></div>
      <form className="admin-form-grid" onSubmit={(event) => {
        event.preventDefault()
        if (!create.roles.length) { setMessage({ text: 'Select at least one role.', success: false }); return }
        act('create', async () => {
          await adminApi.createAccount(create)
          setCreate({ email: '', password: '', roles: ['VIEWER'] })
        }, 'Account created successfully.')
      }}>
        <label>Email<input required type="email" autoComplete="off" value={create.email} onChange={(event) => setCreate({ ...create, email: event.target.value })} /></label>
        <label>Temporary password<input required type="password" minLength="12" maxLength="72" autoComplete="new-password" value={create.password} onChange={(event) => setCreate({ ...create, password: event.target.value })} /><span className="field-note">At least 12 characters. Share securely with the account holder.</span></label>
        <fieldset className="admin-role-options"><legend>Assign roles</legend>{roles.map((role) => <label key={role}><input type="checkbox" checked={create.roles.includes(role)} onChange={() => toggleRole(role)} />{role.replace('_', ' ')}</label>)}</fieldset>
        <button className="button button-primary" type="submit" disabled={busy === 'create'}>{busy === 'create' ? 'Creating…' : 'Create account'}</button>
      </form>
    </section>

    <div className="admin-assignment-grid">
      <section className="content-panel">
        <div className="panel-heading"><div><p className="eyebrow">TOURNAMENT ACCESS</p><h2>Assign organizer</h2></div></div>
        <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); act('organizer', () => adminApi.assignOrganizer(organizer.userId, organizer.tournamentId), 'Organizer assignment saved.') }}>
          <label>Organizer<select required value={organizer.userId} onChange={(event) => setOrganizer({ ...organizer, userId: event.target.value })}><option value="">Select an organizer</option>{organizers.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}</select></label>
          <label>Tournament<select required value={organizer.tournamentId} onChange={(event) => setOrganizer({ ...organizer, tournamentId: event.target.value })}><option value="">Select a tournament</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name}</option>)}</select></label>
          <button className="button button-primary" disabled={busy === 'organizer' || !organizers.length || !tournaments.length}>{busy === 'organizer' ? 'Saving…' : 'Assign organizer'}</button>
          {(!organizers.length || !tournaments.length) && <p className="field-note">Create an ORGANIZER account and tournament before assigning access.</p>}
        </form>
      </section>

      <section className="content-panel">
        <div className="panel-heading"><div><p className="eyebrow">TEAM ACCESS</p><h2>Assign team manager</h2></div></div>
        <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); act('manager', () => adminApi.assignTeamManager(manager.userId, manager.teamId), 'Team manager assignment saved.') }}>
          <label>Team manager<select required value={manager.userId} onChange={(event) => setManager({ ...manager, userId: event.target.value })}><option value="">Select a team manager</option>{managers.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}</select></label>
          <label>Team<select required value={manager.teamId} onChange={(event) => setManager({ ...manager, teamId: event.target.value })}><option value="">Select a team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} — {team.tournamentName}</option>)}</select></label>
          <button className="button button-primary" disabled={busy === 'manager' || !managers.length || !teams.length}>{busy === 'manager' ? 'Saving…' : 'Assign team manager'}</button>
          {(!managers.length || !teams.length) && <p className="field-note">Create a TEAM_MANAGER account and register a team before assigning access.</p>}
        </form>
      </section>
    </div>

    <section className="content-panel" style={{ marginTop: 22 }}>
      <div className="panel-heading"><div><p className="eyebrow">REGISTERED ACCOUNTS</p><h2>User management</h2></div><span className="field-note">{data?.users?.length ?? 0} accounts</span></div>
      {!data?.users?.length ? <div className="empty-panel"><p>No registered accounts yet.</p></div> : <div className="table-scroll"><table className="dark-table data-table"><thead><tr><th>User</th><th>Status</th><th>Roles</th><th>Tournament assignments</th><th>Team assignments</th><th>Update roles</th></tr></thead><tbody>
        {data.users.map((user) => <tr key={user.id}>
          <td><strong>{user.email}</strong><div className="field-note">ID {user.id}</div></td>
          <td>{user.enabled ? 'Active' : 'Disabled'}</td>
          <td>{user.roles.map((role) => <span className="admin-role-tag" key={role}>{role.replace('_', ' ')}</span>)}</td>
          <td>{user.tournaments?.length ? user.tournaments.map((item) => <div key={item.tournamentId}>{item.name}</div>) : <span className="field-note">None</span>}</td>
          <td>{user.teams?.length ? user.teams.map((item) => <div key={item.teamId}>{item.name} <span className="field-note">({item.tournamentName})</span></div>) : <span className="field-note">None</span>}</td>
          <td><div className="admin-row-roles">{roles.map((role) => <label key={role}><input type="checkbox" checked={(roleDrafts[user.id] ?? []).includes(role)} onChange={() => toggleDraftRole(user.id, role)} />{role.replace('_', ' ')}</label>)}<button className="button button-secondary" type="button" disabled={busy === `roles-${user.id}` || !(roleDrafts[user.id] ?? []).length || JSON.stringify([...(roleDrafts[user.id] ?? [])].sort()) === JSON.stringify([...user.roles].sort())} onClick={() => act(`roles-${user.id}`, () => adminApi.replaceRoles(user.id, roleDrafts[user.id]), 'Account roles updated.')}><Check size={14} /> Save roles</button></div></td>
        </tr>)}
      </tbody></table></div>}
    </section>
  </div>
}
