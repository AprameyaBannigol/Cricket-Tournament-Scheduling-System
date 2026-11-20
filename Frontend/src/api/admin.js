import { requestJson } from './client.js'

export const adminApi = {
  dashboard(signal) {
    return requestJson('/api/admin/dashboard', { signal })
  },
  createAccount(account) {
    return requestJson('/api/admin/accounts', { method: 'POST', body: account })
  },
  replaceRoles(userId, roles) {
    return requestJson(`/api/admin/accounts/${encodeURIComponent(userId)}/roles`, {
      method: 'PUT', body: { roles },
    })
  },
  assignOrganizer(userId, tournamentId) {
    return requestJson('/api/admin/accounts/organizer-assignment', {
      method: 'POST', body: { userId: Number(userId), tournamentId: Number(tournamentId) },
    })
  },
  assignTeamManager(userId, teamId) {
    return requestJson('/api/admin/accounts/team-manager-assignment', {
      method: 'POST', body: { userId: Number(userId), teamId: Number(teamId) },
    })
  },
}
