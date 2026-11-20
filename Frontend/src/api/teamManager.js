import { requestJson } from './client.js'

export const teamManagerApi = {
  dashboard(signal) {
    return requestJson('/api/team-manager/dashboard', { signal })
  },
}
