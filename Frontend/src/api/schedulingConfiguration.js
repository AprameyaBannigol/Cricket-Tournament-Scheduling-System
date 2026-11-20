import { requestJson } from './client.js'
import { tournamentIdPath, tournamentsPath } from './tournaments.js'

const tournamentPath = (id) => `${tournamentsPath}/${tournamentIdPath(id)}`
const configurationApi = (resourcePath) => ({
  get: (id, signal) => requestJson(`${tournamentPath(id)}/${resourcePath}`, { signal }),
  save: (id, body) => requestJson(`${tournamentPath(id)}/${resourcePath}`, { method: 'PUT', body }),
})

export const matchConfigurationApi = configurationApi('match-configuration')
export const schedulingConstraintsApi = configurationApi('scheduling-constraints')

function availabilityPath(id, type, resourceId) {
  if (!['teams', 'stadiums', 'officials'].includes(type)) throw new Error('Select an availability resource.')
  return `${tournamentPath(id)}/availability/${type}/${tournamentIdPath(resourceId)}`
}

export const schedulingAvailabilityApi = {
  get: (id, type, resourceId, signal) => requestJson(availabilityPath(id, type, resourceId), { signal }),
  save: (id, type, resourceId, windows) => requestJson(availabilityPath(id, type, resourceId), {
    method: 'PUT',
    body: { windows },
  }),
}

export function matchConfigurationBody(form) {
  const powerplay = String(form.powerplayOvers).trim()
  const range = /^(?:1\s*(?:to|[-–])\s*)?(\d+)$/.exec(powerplay)
  if (powerplay && !range) throw new Error('Enter a powerplay over count or a range such as 1 to 6.')
  return {
    matchFormat: form.format,
    oversPerInnings: Number(form.oversPerInnings),
    maxBowlerOvers: Number(form.maxBowlerOvers),
    powerplayOvers: range ? Number(range[1]) : null,
    inningsBreakMinutes: Number(form.inningsBreakMinutes),
    matchDurationMinutes: Number(form.matchDurationMinutes),
    minOversForDls: form.minOversForDLS === '' ? null : Number(form.minOversForDLS),
    pointsForWin: Number(form.pointsForWin),
    pointsForTie: Number(form.pointsForTie),
    pointsForLoss: Number(form.pointsForLoss),
    superOverEnabled: form.superOver,
  }
}

export function schedulingConstraintsBody(rules) {
  return {
    minimumRecoveryMinutes: Math.round(rules.minRestHours * 60),
    maxMatchesPerTeamPerDay: Number(rules.maxMatchesPerDayPerTeam),
    maxMatchesPerStadiumPerDay: Number(rules.maxMatchesPerGroundPerDay),
    minimumTravelMinutes: Math.round(rules.travelBufferHours * 60),
    travelConstraintEnabled: rules.travelConstraintEnabled,
    avoidGroundBlackouts: rules.avoidGroundBlackouts,
    avoidOfficialBlackouts: rules.umpireClashPrevention,
    nightToMorningRestriction: rules.noBackToBackNightMorning,
    reserveDayEnforced: rules.reserveDayEnforcement,
  }
}
