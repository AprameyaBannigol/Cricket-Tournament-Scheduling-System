import { requestJson } from './client.js'
import { tournamentIdPath, tournamentsPath } from './tournaments.js'

const base = (id) => `${tournamentsPath}/${tournamentIdPath(id)}`

export const statisticsApi = {
  standings: (id, signal) => requestJson(`${base(id)}/standings`, { signal }),
  analytics: (id, signal) => requestJson(`${base(id)}/analytics`, { signal }),
}
