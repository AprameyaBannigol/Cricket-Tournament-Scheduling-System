export const loginRoles = [
  { role: 'ADMIN', path: '/admin', label: 'Administrator', description: 'Manage accounts, roles and tournament administration.' },
  { role: 'ORGANIZER', path: '/organizer', label: 'Tournament Organizer', description: 'Set up tournaments, schedules and match operations.' },
  { role: 'TEAM_MANAGER', path: '/team-manager', label: 'Team Manager', description: 'Follow your assigned team and its fixtures.' },
  { role: 'VIEWER', path: '/viewer', label: 'Viewer', description: 'Browse tournaments, fixtures, results and standings.' },
]

export function dashboardDestinationForRole(role) {
  return loginRoles.find((entry) => entry.role === role)?.path ?? null
}

export function requiresRoleSessionSwitch(activeRoles = [], selectedRole) {
  return activeRoles.length > 0 && (activeRoles.length !== 1 || !activeRoles.includes(selectedRole))
}

export function roleFromLoginPath(pathRole = '') {
  return loginRoles.find(({ role }) => role.toLowerCase().replaceAll('_', '-') === pathRole.toLowerCase())?.role ?? null
}
