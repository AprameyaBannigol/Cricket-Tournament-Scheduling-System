import { Fragment, useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listTournaments } from '../api/tournaments'
import { useApiResource } from '../api/useApiResource'
import TournamentRequestStatus from './TournamentRequestStatus'

export default function LiveTournamentResources({ api, subject, View }) {
  return <LiveTournamentSelection>{({ activeTournament, selector }) =>
    <ResourceCollection {...{ api, subject, View, activeTournament, selector }} />
  }</LiveTournamentSelection>
}

export function LiveTournamentSelection({ children, clearScheduleVersion = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tournaments = useApiResource(listTournaments)
  const requestedId = searchParams.get('tournament')
  const activeTournament = requestedId === null
    ? tournaments.data?.[0]
    : tournaments.data?.find(({ id }) => id === requestedId.replace(/^0+/, ''))

  let content
  if (tournaments.loading || tournaments.error) {
    content = <TournamentRequestStatus {...tournaments} subject="tournaments" />
  } else if (!activeTournament && requestedId === null) {
    content = <section className="content-panel">
      <h2>No tournaments available</h2>
      <Link className="text-link" to="/tournaments/create">Create a tournament</Link>
    </section>
  } else {
    const selector = (
      <label className="active-tournament-select">Tournament
        <select value={activeTournament?.id ?? ''} onChange={(event) => {
          setSearchParams((previous) => {
            const next = new URLSearchParams(previous)
            next.set('tournament', event.target.value)
            if (clearScheduleVersion) next.delete('version')
            return next
          })
        }}>
          {!activeTournament && <option value="" disabled>Select a tournament</option>}
          {tournaments.data.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
    )
    if (!activeTournament) {
      content = <>{selector}<TournamentRequestStatus error={{ status: 404 }} /></>
    } else {
      return <Fragment key={activeTournament.id}>{children({ activeTournament, selector })}</Fragment>
    }
  }

  return <div className="workspace-page data-management-page">{content}</div>
}

function ResourceCollection({ api, subject, View, activeTournament, selector }) {
  const id = activeTournament.id
  const load = useCallback((signal) => api.list(id, signal), [api, id])
  const request = useApiResource(load)
  if (request.loading || request.error) {
    return <div className="workspace-page data-management-page">
      {selector}
      <TournamentRequestStatus {...request} subject={subject} />
    </div>
  }

  return <LoadedCollection {...{ api, View, activeTournament, selector }} initialRecords={request.data} />
}

function LoadedCollection({ api, View, activeTournament, selector, initialRecords }) {
  const [records, setRecords] = useState(initialRecords)

  async function save(form, editingId) {
    const id = activeTournament.id
    const saved = editingId ? await api.update(id, form) : await api.create(id, form)
    setRecords((previous) => editingId
      ? previous.map((record) => record.id === saved.id ? saved : record)
      : [...previous, saved])
  }

  return <View {...{ activeTournament, selector, records, save }} />
}
