import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardDestinationForRole, loginRoles, requiresRoleSessionSwitch, roleFromLoginPath } from '../src/auth/roleNavigation.js'

test('role selection always offers exactly four supported role cards and maps their login paths', () => {
  assert.deepEqual(loginRoles.map(({ role }) => role), ['ADMIN', 'ORGANIZER', 'TEAM_MANAGER', 'VIEWER'])
  assert.deepEqual(loginRoles.map(({ role }) => roleFromLoginPath(role.toLowerCase().replaceAll('_', '-'))),
    ['ADMIN', 'ORGANIZER', 'TEAM_MANAGER', 'VIEWER'])
  assert.equal(roleFromLoginPath('unknown'), null)
})

test('dashboard destination is derived from the selected role and rejects unsupported roles', () => {
  assert.equal(dashboardDestinationForRole('ADMIN'), '/admin')
  assert.equal(dashboardDestinationForRole('ORGANIZER'), '/organizer')
  assert.equal(dashboardDestinationForRole('TEAM_MANAGER'), '/team-manager')
  assert.equal(dashboardDestinationForRole('VIEWER'), '/viewer')
  assert.equal(dashboardDestinationForRole('UNKNOWN'), null)
})

test('an existing role session must be explicitly ended before switching role context', () => {
  assert.equal(requiresRoleSessionSwitch(['ADMIN'], 'ORGANIZER'), true)
  assert.equal(requiresRoleSessionSwitch(['ADMIN'], 'ADMIN'), false)
  assert.equal(requiresRoleSessionSwitch(['ADMIN', 'ORGANIZER'], 'ORGANIZER'), true)
  assert.equal(requiresRoleSessionSwitch([], 'ORGANIZER'), false)
})
