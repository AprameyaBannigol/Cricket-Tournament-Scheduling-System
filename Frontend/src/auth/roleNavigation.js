export const loginRoles = [
  { role: 'ADMIN', path: '/admin', label: 'Administrator', description: 'Manage accounts, roles and tournament administration.' },
  { role: 'ORGANIZER', path: '/organizer', label: 'Tournament Organizer', description: 'Set up tournaments, schedules and match operations.' },
  { role: 'TEAM_MANAGER', path: '/team-manager', label: 'Team Manager', description: 'Follow your assigned team and its fixtures.' },
  { role: 'VIEWER', path: '/viewer', label: 'Viewer', description: 'Browse tournaments, fixtures, results and standings.' },
]

export function dashboardDestination(roles = []) {
  return loginRoles.find(({ role }) => roles.includes(role))?.path ?? '/tournaments'
}

export function roleFromLoginPath(pathRole = '') {
  return loginRoles.find(({ role }) => role.toLowerCase().replaceAll('_', '-') === pathRole.toLowerCase())?.role ?? null
}
