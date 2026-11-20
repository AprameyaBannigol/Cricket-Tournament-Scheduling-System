import { requestJson } from './client.js'

export const organizerApi = {
  dashboard(signal) {
    return requestJson('/api/organizer/dashboard', { signal })
  },
}
