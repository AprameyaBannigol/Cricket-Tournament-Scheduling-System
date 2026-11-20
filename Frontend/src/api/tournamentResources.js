import { ApiError, requestJson } from './client.js'
import { tournamentIdPath, tournamentsPath } from './tournaments.js'

function responseId(id) {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error('The server returned an invalid resource ID.')
  }
  return String(id)
}

function resourceApi(collection, idField, fromDto, toDto) {
  const scope = (id) => `${tournamentsPath}/${id}/${collection}`
  const readRecord = (dto, tournamentId) => {
    const owner = responseId(dto?.tournamentId)
    if (owner !== tournamentId) throw new Error('The server returned a resource for another tournament.')
    return { ...fromDto(dto), id: responseId(dto[idField]), tournamentId: owner }
  }

  return {
    async list(id, signal) {
      const tournamentId = tournamentIdPath(id)
      const records = await requestJson(scope(tournamentId), { signal })
      if (!Array.isArray(records)) throw new Error('The server returned an invalid resource list.')
      return records.map((dto) => readRecord(dto, tournamentId))
    },
    async create(id, form) {
      const tournamentId = tournamentIdPath(id)
      const dto = await requestJson(scope(tournamentId), { method: 'POST', body: toDto(form) })
      return readRecord(dto, tournamentId)
    },
    async update(id, record) {
      const tournamentId = tournamentIdPath(id)
      if (String(record.tournamentId) !== tournamentId) {
        throw new ApiError(404, 'This record does not belong to the selected tournament.')
      }
      const recordId = tournamentIdPath(record.id)
      const dto = await requestJson(`${scope(tournamentId)}/${recordId}`, {
        method: 'PUT',
        body: toDto(record),
      })
      const saved = readRecord(dto, tournamentId)
      if (saved.id !== recordId) throw new Error('The server returned a different resource than requested.')
      return saved
    },
  }
}

const textOrNull = (value) => value === '' ? null : (value ?? null)

function integerOrNull(value, minimum, label) {
  if (value === '' || value == null) return null
  const number = Number(value)
  if (!Number.isInteger(number) || number < minimum || number > 2147483647) {
    throw new Error(`${label} must be a whole number from ${minimum} to 2147483647.`)
  }
  return number
}

export const teamApi = resourceApi('teams', 'teamId', (dto) => ({
  name: dto.teamName,
  college: dto.college,
  department: dto.department,
  captain: dto.captain,
  coach: dto.coach,
  squadSize: dto.squadSize,
  pool: dto.pool,
  status: dto.status,
}), (team) => ({
  teamName: team.name.trim(),
  college: textOrNull(team.college),
  department: textOrNull(team.department),
  captain: textOrNull(team.captain),
  coach: textOrNull(team.coach),
  squadSize: integerOrNull(team.squadSize, 1, 'Squad size'),
  pool: textOrNull(team.pool),
  status: textOrNull(team.status),
}))

export const stadiumApi = resourceApi('stadiums', 'stadiumId', (dto) => ({
  name: dto.name,
  shortName: dto.shortName,
  type: dto.groundType,
  capacity: dto.capacity,
  pitches: dto.numberOfPitches,
  floodlights: dto.floodlights,
  curator: dto.curator,
  availabilityStatus: dto.availabilityStatus?.toLowerCase() ?? '',
}), (stadium) => ({
  name: stadium.name.trim(),
  shortName: textOrNull(stadium.shortName),
  groundType: textOrNull(stadium.type),
  capacity: integerOrNull(stadium.capacity, 0, 'Capacity'),
  numberOfPitches: integerOrNull(stadium.pitches, 1, 'Number of pitches'),
  floodlights: stadium.floodlights ?? null,
  curator: textOrNull(stadium.curator),
  availabilityStatus: textOrNull(stadium.availabilityStatus?.toUpperCase()),
}))

export const officialApi = resourceApi('officials', 'officialId', (dto) => ({
  name: dto.name,
  role: dto.role,
  cert: dto.qualification,
  status: dto.status,
  available: dto.status?.toUpperCase() === 'ACTIVE',
}), (official) => ({
  name: official.name.trim(),
  role: official.role,
  qualification: textOrNull(official.cert),
  status: official.status != null && official.available === (official.status.toUpperCase() === 'ACTIVE')
    ? official.status
    : official.available ? 'ACTIVE' : 'INACTIVE',
}))
