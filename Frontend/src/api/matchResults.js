import { requestJson } from './client.js'
import { tournamentIdPath, tournamentsPath } from './tournaments.js'

const base = (id) => `${tournamentsPath}/${tournamentIdPath(id)}/matches`
export const matchResultsApi = {
  list: (id, signal) => requestJson(base(id), { signal }),
  save: (id, fixtureId, result) => requestJson(`${base(id)}/${tournamentIdPath(fixtureId)}/result`, {
    method: 'PUT', body: result,
  }),
}
