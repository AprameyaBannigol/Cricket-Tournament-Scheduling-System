import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardDestination, loginRoles, roleFromLoginPath } from '../src/auth/roleNavigation.js'

test('role selection always offers exactly four supported role cards and maps their login paths', () => {
  assert.deepEqual(loginRoles.map(({ role }) => role), ['ADMIN', 'ORGANIZER', 'TEAM_MANAGER', 'VIEWER'])
  assert.deepEqual(loginRoles.map(({ role }) => roleFromLoginPath(role.toLowerCase().replaceAll('_', '-'))),
    ['ADMIN', 'ORGANIZER', 'TEAM_MANAGER', 'VIEWER'])
  assert.equal(roleFromLoginPath('unknown'), null)
})

test('each supported role receives its dashboard destination', () => {
  assert.equal(dashboardDestination(['ADMIN']), '/admin')
  assert.equal(dashboardDestination(['ORGANIZER']), '/organizer')
  assert.equal(dashboardDestination(['TEAM_MANAGER']), '/team-manager')
  assert.equal(dashboardDestination(['VIEWER']), '/viewer')
})

test('dashboard destination precedence is deterministic for multi-role accounts', () => {
  assert.equal(dashboardDestination(['VIEWER', 'ORGANIZER']), '/organizer')
  assert.equal(dashboardDestination(['TEAM_MANAGER', 'ADMIN']), '/admin')
})

test('accounts without a supported role use tournament browsing', () => {
  assert.equal(dashboardDestination([]), '/tournaments')
  assert.equal(dashboardDestination(), '/tournaments')
})
