import { requestJson } from './client.js'
import { tournamentIdPath, tournamentsPath } from './tournaments.js'

const tournamentPath = (id) => `${tournamentsPath}/${tournamentIdPath(id)}`
const schedulesPath = (id) => `${tournamentPath(id)}/schedules`
const travelPath = (id) => `${tournamentPath(id)}/venue-travel-times`

export function scheduleWorkspacePath(path, tournamentId, versionId) {
  const query = new URLSearchParams()
  if (tournamentId != null) query.set('tournament', tournamentId)
  if (versionId != null) query.set('version', versionId)
  return query.size ? `${path}?${query}` : path
}

function readId(id) {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('The server returned an invalid schedule ID.')
  return String(id)
}

function readSavedSchedule(schedule, tournamentId, versionId) {
  if (readId(schedule?.tournamentId) !== tournamentId ||
      (versionId && readId(schedule.versionId) !== versionId) || !Array.isArray(schedule.matches)) {
    throw new Error('The server returned a different schedule than requested.')
  }
  return { ...schedule, versionId: readId(schedule.versionId), matches: schedule.matches.map(toFixtureCard) }
}

export const scheduleApi = {
  async readiness(id, signal) {
    return requestJson(`${schedulesPath(id)}/readiness`, { signal })
  },
  async list(id, signal) {
    const versions = await requestJson(schedulesPath(id), { signal })
    if (!Array.isArray(versions)) throw new Error('The server returned an invalid schedule version list.')
    return versions.map((version) => ({ ...version, versionId: readId(version.versionId) }))
  },
  async get(id, version, signal) {
    const tournamentId = tournamentIdPath(id)
    const versionId = tournamentIdPath(version)
    return readSavedSchedule(await requestJson(`${schedulesPath(tournamentId)}/${versionId}`, { signal }),
      tournamentId, versionId)
  },
  async generate(id, versionName) {
    const tournamentId = tournamentIdPath(id)
    const schedule = await requestJson(`${schedulesPath(tournamentId)}/generate`, {
      method: 'POST', body: { versionName },
    })
    return readSavedSchedule(schedule, tournamentId)
  },
}

export const venueTravelApi = {
  async list(id, signal) {
    return requestJson(travelPath(id), { signal })
  },
  async save(id, from, to, travelMinutes) {
    return requestJson(`${travelPath(id)}/${tournamentIdPath(from)}/${tournamentIdPath(to)}`, {
      method: 'PUT', body: { travelMinutes },
    })
  },
}

export function toFixtureCard(match) {
  const { fixture } = match
  // Backend match dates and times are tournament-local values without an offset.
  const [date, start] = match.startTime.split('T')
  const end = match.endTime.split('T')[1]
  const status = match.matchStatus
    ? match.matchStatus.toLowerCase().replaceAll('_', ' ')
    : ''
  return {
    id: readId(match.matchId),
    matchNumber: fixture.matchNumber,
    round: `Round ${fixture.round}`,
    teamA: fixture.team1,
    teamB: fixture.team2,
    date,
    time: `${start.slice(0, 5)}–${end.slice(0, 5)}`,
    stadium: match.stadiumName,
    pitch: match.pitchNumber == null ? null : `Pitch ${match.pitchNumber}`,
    officials: match.officials.map(({ name, assignedRole }) => assignedRole
      ? `${name} (${assignedRole.replaceAll('_', ' ').toLowerCase()})` : name),
    status: status ? status[0].toUpperCase() + status.slice(1) : '',
  }
}
