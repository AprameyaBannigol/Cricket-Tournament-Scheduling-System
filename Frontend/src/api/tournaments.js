import { ApiError, requestJson } from './client.js'

export const tournamentsPath = '/api/tournaments'

const statuses = { LIVE: 'live', IN_PROGRESS: 'live', UPCOMING: 'upcoming', COMPLETED: 'completed' }
const categoryLabels = {
  'Inter-Collegiate T20': 'T20 Round Robin',
  'University One-Day Cup': '50-Over Round Robin',
  'Zonal Leather Ball League': 'Zonal Round Robin',
  'Inter-Departmental Knockout': 'T20 Knockout',
}

export function tournamentIdPath(value) {
  const id = String(value)
  if (!/^\d{1,19}$/.test(id) || BigInt(id) < 1n || BigInt(id) > 9223372036854775807n) {
    throw new ApiError(404, 'Tournament not found.')
  }
  return BigInt(id).toString()
}

function toTournament(dto) {
  if (!Number.isSafeInteger(dto?.tournamentId) || dto.tournamentId <= 0 || typeof dto.name !== 'string') {
    throw new Error('The server returned an invalid tournament record.')
  }
  const statusCode = dto.status ?? ''
  const normalizedStatus = statusCode.toUpperCase().replace(/[ -]/g, '_')
  return {
    id: String(dto.tournamentId),
    name: dto.name,
    edition: dto.edition ?? '',
    season: dto.season ?? '',
    category: dto.category ?? '',
    format: (Object.hasOwn(categoryLabels, dto.category) ? categoryLabels[dto.category] : dto.category) ?? '',
    startDate: dto.startDate ?? '',
    endDate: dto.endDate ?? '',
    hostInstitution: dto.hostInstitution ?? '',
    ballType: dto.ballType ?? '',
    status: Object.hasOwn(statuses, normalizedStatus) ? statuses[normalizedStatus] : '',
    statusCode,
  }
}

function toRequest(tournament) {
  return {
    name: tournament.name.trim(),
    edition: tournament.edition || null,
    category: tournament.category || null,
    season: tournament.season || null,
    startDate: tournament.startDate || null,
    endDate: tournament.endDate || null,
    hostInstitution: tournament.hostInstitution || null,
    ballType: tournament.ballType || null,
    status: tournament.statusCode || null,
  }
}

export async function listTournaments(signal) {
  const records = await requestJson(tournamentsPath, { signal })
  if (!Array.isArray(records)) throw new Error('The server returned an invalid tournament list.')
  return records.map(toTournament)
}

export async function getTournament(id, signal) {
  return toTournament(await requestJson(`${tournamentsPath}/${tournamentIdPath(id)}`, { signal }))
}

export async function createTournament(tournament) {
  return toTournament(await requestJson(tournamentsPath, { method: 'POST', body: toRequest(tournament) }))
}

export async function updateTournament(id, tournament) {
  return toTournament(await requestJson(`${tournamentsPath}/${tournamentIdPath(id)}`, {
    method: 'PUT',
    body: toRequest(tournament),
  }))
}
