import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trash2 } from 'lucide-react'
import { listTournaments } from '../api/tournaments'
import { useApiResource } from '../api/useApiResource'
import { useTournamentSetup } from '../context/TournamentSetupContext'

const filters = [
  { value: 'all', label: 'All tournaments' },
  { value: 'live', label: 'In progress' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
]

const statusLabels = {
  live: 'In progress',
  upcoming: 'Upcoming',
  completed: 'Completed',
}

function formatDates(startDate, endDate) {
  const options = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
  if (!startDate && !endDate) return 'Not set'
  if (!startDate || !endDate) return new Date(`${startDate || endDate}T00:00:00Z`).toLocaleDateString('en-GB', options)
  const start = new Date(`${startDate}T00:00:00Z`).toLocaleDateString('en-GB', options)
  const end = new Date(`${endDate}T00:00:00Z`).toLocaleDateString('en-GB', options)
  return `${start} – ${end}`
}

export default function TournamentsPage() {
  const { data, ...request } = useApiResource(listTournaments)
  return <TournamentList tournaments={data ?? []} {...request} />
}

export function DemoTournamentsPage() {
  const { tournaments, teams, removeTournament } = useTournamentSetup()
  const demoTournaments = tournaments.map((tournament) => ({
    ...tournament,
    teams: teams.filter((team) => team.tournamentId === tournament.id).length || tournament.teams,
  }))
  return <TournamentList tournaments={demoTournaments} removeTournament={removeTournament} />
}

function TournamentList({ tournaments, loading, error, retry, removeTournament }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actionMessage, setActionMessage] = useState(null)
  const deleteTournament = async (tournament) => {
    const confirmed = window.confirm(
      `Delete "${tournament.name}" and its associated teams, matches, saved schedules, and conflicts?`,
    )
    if (!confirmed) return

    try {
      await removeTournament(tournament.id)
      setActionMessage({
        type: 'success',
        text: `${tournament.name} and its associated data were removed from the local demo state.`,
      })
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: error.message || 'Unable to delete this tournament from the local demo state.',
      })
    }
  }

  const filteredTournaments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return tournaments.filter((tournament) => {
      const matchesStatus = filter === 'all' || tournament.status === filter
      const teamCount = tournament.teams
      const matchesSearch = !query
        || tournament.name.toLocaleLowerCase().includes(query)
        || tournament.format.toLocaleLowerCase().includes(query)
        || String(teamCount ?? '').includes(query)
      return matchesStatus && matchesSearch
    })
  }, [filter, search, tournaments])

  return (
    <section className="tournament-list-page" aria-labelledby="tournaments-heading">
      <header className="tournament-list-heading">
        <div>
          <span className="eyebrow">TOURNAMENTS</span>
          <h1 id="tournaments-heading">Your Tournaments</h1>
          <p>Browse and manage your cricket competitions.</p>
        </div>
        <Link className="button button-primary tournament-create-button" to="/tournaments/create">
          Create Tournament
        </Link>
      </header>

      <div className="tournament-list-controls">
        <label className="tournament-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search tournaments</span>
          <input
            type="search"
            placeholder="Search tournaments"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="tournament-status-filters" role="group" aria-label="Filter tournaments by status">
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? 'active' : ''}
              aria-pressed={filter === option.value}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <p className="form-message" role={actionMessage.type === 'error' ? 'alert' : 'status'}>
          {actionMessage.text}
        </p>
      )}

      {loading && <p className="empty-filter" role="status">Loading tournaments…</p>}
      {error && (
        <div className="tournament-list-empty">
          <p className="form-message" role="alert">{error.message}</p>
          <button className="button button-secondary" type="button" onClick={retry}>Try again</button>
        </div>
      )}
      {!loading && !error && <>
        <div className="tournament-table" role="table" aria-label="Your tournaments">
          <div className="tournament-table-header" role="row">
            <span role="columnheader">Tournament</span>
            <span role="columnheader">Format</span>
            <span role="columnheader">Teams</span>
            <span role="columnheader">Dates</span>
            <span role="columnheader">Status</span>
            <span role="columnheader"><span className="sr-only">Actions</span></span>
          </div>
          {filteredTournaments.map((tournament) => (
            <article className="tournament-table-row" role="row" key={tournament.id}>
              <div className="tournament-name-cell" role="cell" data-label="Tournament">
                <Link to={`/tournaments/${tournament.id}`}>{tournament.name}</Link>
              </div>
              <div className="tournament-format-cell" role="cell" data-label="Format">{tournament.format || '—'}</div>
              <div className="tournament-teams-cell" role="cell" data-label="Teams">{tournament.teams ?? '—'}</div>
              <div className="tournament-dates-cell" role="cell" data-label="Dates">
                {formatDates(tournament.startDate, tournament.endDate)}
              </div>
              <div className="tournament-status-cell" role="cell" data-label="Status">
                <span className={`tournament-status status-${tournament.status}`}>
                  {statusLabels[tournament.status] || tournament.statusCode || 'Not set'}
                </span>
              </div>
              <div className="tournament-action-cell" role="cell">
                <span className="row-actions">
                  <Link to={`/tournaments/${tournament.id}`}>Manage</Link>
                  {removeTournament && <button
                    type="button"
                    aria-label={`Delete ${tournament.name}`}
                    title="Delete tournament"
                    onClick={() => deleteTournament(tournament)}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>}
                </span>
              </div>
            </article>
          ))}
          {filteredTournaments.length === 0 && (
            <div className="tournament-list-empty" role="status">
              <strong>{tournaments.length ? 'No tournaments found' : 'No tournaments yet'}</strong>
              {tournaments.length > 0 && <span>Try a different search or status filter.</span>}
            </div>
          )}
        </div>
        <p className="tournament-result-count" aria-live="polite">
          Showing {filteredTournaments.length} of {tournaments.length} tournaments
        </p>
      </>}
    </section>
  )
}
