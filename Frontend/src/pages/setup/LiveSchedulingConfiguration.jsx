import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  matchConfigurationApi, matchConfigurationBody, schedulingAvailabilityApi,
  schedulingConstraintsApi, schedulingConstraintsBody,
} from '../../api/schedulingConfiguration'
import { teamApi, stadiumApi, officialApi } from '../../api/tournamentResources'
import { useApiResource } from '../../api/useApiResource'
import { LiveTournamentSelection } from '../../components/LiveTournamentResources'
import TournamentRequestStatus from '../../components/TournamentRequestStatus'
import useSchedulingConfigurationSave from '../../components/useSchedulingConfigurationSave'
import { Button, Input } from '../../components/ui'
import { MatchConfigurationForm } from './MatchConfigPage'
import { AvailabilityConfigurationForm } from './AvailabilityConfigPage'
import { SchedulingConstraintsForm } from './ConstraintsPage'

const scoped = (path, id) => `${path}?tournament=${id}`
const formConfigs = {
  match: {
    api: matchConfigurationApi, Form: MatchConfigurationForm, body: matchConfigurationBody,
    subject: 'match configuration', back: '/teams', next: '/stadiums',
    initial: (dto) => ({
      format: dto?.matchFormat ?? '',
      oversPerInnings: dto?.oversPerInnings ?? '',
      maxBowlerOvers: dto?.maxBowlerOvers ?? '',
      powerplayOvers: dto?.powerplayOvers == null ? '' : String(dto.powerplayOvers),
      inningsBreakMinutes: dto?.inningsBreakMinutes ?? '',
      matchDurationMinutes: dto?.matchDurationMinutes ?? '',
      minOversForDLS: dto?.minOversForDls ?? '',
      pointsForWin: dto?.pointsForWin ?? '',
      pointsForTie: dto?.pointsForTie ?? '',
      pointsForLoss: dto?.pointsForLoss ?? '',
      superOver: dto?.superOverEnabled ?? true,
    }),
  },
  constraints: {
    api: schedulingConstraintsApi, Form: SchedulingConstraintsForm, body: schedulingConstraintsBody,
    subject: 'scheduling constraints', back: '/availability', next: '/schedule/generate',
    initial: (dto) => ({
      minRestHours: dto ? dto.minimumRecoveryMinutes / 60 : '',
      maxMatchesPerDayPerTeam: dto?.maxMatchesPerTeamPerDay ?? '',
      maxMatchesPerGroundPerDay: dto?.maxMatchesPerStadiumPerDay ?? '',
      travelBufferHours: dto ? dto.minimumTravelMinutes / 60 : '',
      travelConstraintEnabled: dto?.travelConstraintEnabled ?? false,
      noBackToBackNightMorning: dto?.nightToMorningRestriction ?? false,
      balancedHomeAway: false,
      umpireClashPrevention: dto?.avoidOfficialBlackouts ?? true,
      avoidGroundBlackouts: dto?.avoidGroundBlackouts ?? true,
      reserveDayEnforcement: dto?.reserveDayEnforced ?? false,
    }),
  },
}

function SaveFeedback({ state }) {
  if (state.error?.status === 404) {
    return <p role="alert" className="form-message">{state.error.message} <Link to="/tournaments">Back to tournaments</Link></p>
  }
  if (state.error) return <p role="alert" className="form-message">{state.error.message} Edit the form or submit again to retry.</p>
  if (state.saved) return <p role="status" className="form-message">Availability saved.</p>
  return null
}

export default function LiveSchedulingConfiguration({ type }) {
  return <LiveTournamentSelection>{({ activeTournament, selector }) =>
    <div className="space-y-6 max-w-4xl mx-auto">
      {selector}
      {type === 'availability'
        ? <AvailabilityResources tournament={activeTournament} />
        : <ConfigurationEditor key={type} id={activeTournament.id} config={formConfigs[type]} />}
    </div>
  }</LiveTournamentSelection>
}

function ConfigurationEditor({ id, config }) {
  const navigate = useNavigate()
  const { api, Form, body, subject, back, next, initial } = config
  const load = useCallback((signal) => api.get(id, signal), [api, id])
  const request = useApiResource(load)
  const save = useSchedulingConfigurationSave()

  if (request.loading || request.error) return <TournamentRequestStatus {...request} subject={subject} />

  return <>
    {request.data === null && <p className="form-message" role="status">No {subject} has been saved for this tournament.</p>}
    {config === formConfigs.constraints && <Link className="text-link" to={scoped('/setup/travel-times', id)}>
      Configure stadium travel times
    </Link>}
    <Form live initial={initial(request.data)} status={request.data ? 'Completed' : 'Not Started'}
      saving={save.saving} feedback={<SaveFeedback state={save} />}
      onBack={() => navigate(scoped(back, id))}
      onSave={(form) => save.submit(() => api.save(id, body(form)), () => navigate(scoped(next, id)))} />
  </>
}

function AvailabilityResources({ tournament }) {
  const { id } = tournament
  const load = useCallback(async (signal) => {
    const [teams, stadiums, officials] = await Promise.all([
      teamApi.list(id, signal), stadiumApi.list(id, signal), officialApi.list(id, signal),
    ])
    return { teams, stadiums, officials }
  }, [id])
  const request = useApiResource(load)
  const [resourceKey, setResourceKey] = useState('')

  if (request.loading || request.error) return <TournamentRequestStatus {...request} subject="availability resources" />

  const [type, resourceId] = resourceKey.split('/')
  const resource = request.data[type]?.find((record) => record.id === resourceId)
  function controls(disabled = false) {
    return <label className="active-tournament-select">Availability resource
      <select value={resourceKey} disabled={disabled} onChange={(event) => setResourceKey(event.target.value)}>
        <option value="">Select a resource</option>
        {Object.entries(request.data).map(([group, records]) => records.length > 0 &&
          <optgroup key={group} label={group[0].toUpperCase() + group.slice(1)}>
            {records.map((record) => <option key={record.id} value={`${group}/${record.id}`}>{record.name}</option>)}
          </optgroup>)}
      </select>
    </label>
  }

  if (!resource) return <section className="content-panel space-y-4">
    <h2>Scheduling availability</h2>
    {controls()}
    <p>{Object.values(request.data).some((records) => records.length)
      ? 'Select a team, stadium or official to configure dated windows.'
      : 'Register teams, stadiums or officials to configure their availability.'}</p>
    <div className="page-actions">
      <Link className="button button-secondary" to={scoped('/officials', id)}>Back to Officials</Link>
      <Link className="button button-secondary" to={scoped('/setup/constraints', id)}>Scheduling Constraints</Link>
    </div>
  </section>

  return <ResourceAvailability key={resourceKey} {...{ tournament, type, resource, controls }} />
}

function ResourceAvailability({ tournament, type, resource, controls }) {
  const id = tournament.id
  const resourceId = resource.id
  const load = useCallback((signal) => schedulingAvailabilityApi.get(id, type, resourceId, signal), [id, type, resourceId])
  const request = useApiResource(load)

  if (request.loading || request.error) return <>{controls()}
    <TournamentRequestStatus {...request} subject="resource availability"
      notFoundTitle={request.error?.message.startsWith('Resource') ? 'Resource not found in this tournament' : undefined} />
  </>

  return <AvailabilityEditor {...{ tournament, type, resource, controls }} initialWindows={request.data.windows} />
}

function AvailabilityEditor({ tournament, type, resource, controls, initialWindows }) {
  const navigate = useNavigate()
  const { id, startDate, endDate } = tournament
  const [draft, setDraft] = useState(initialWindows)
  const [savedWindows, setSavedWindows] = useState(initialWindows)
  const [windowError, setWindowError] = useState('')
  const appliedSessions = useRef(null)
  const save = useSchedulingConfigurationSave()
  const dirty = draft !== savedWindows
  const allowNight = type !== 'stadiums' || resource.floodlights === true

  function change(windows) {
    setDraft(windows)
    setWindowError('')
    save.reset()
  }

  function sessionDraft(slots) {
    const sessions = (allowNight ? ['morning', 'afternoon', 'night'] : ['morning', 'afternoon'])
      .map((name) => [slots[`${name}Start`], slots[`${name}End`]])
      .filter(([start, end]) => start || end)
    return {
      sessions,
      signature: JSON.stringify([slots.startDate, slots.endDate, sessions]),
    }
  }

  function windowsWithSessions(slots, sessions) {
    if (!slots.startDate || !slots.endDate || slots.startDate > slots.endDate ||
        !startDate || !endDate || slots.startDate < startDate || slots.endDate > endDate) {
      throw new Error('Select a valid date range within the tournament.')
    }
    if (!sessions.length || sessions.some(([start, end]) => !start || !end || start >= end)) {
      throw new Error('Enter at least one session with a start time and a later end time.')
    }
    const windows = [...draft]
    const date = new Date(`${slots.startDate}T00:00:00Z`)
    const through = new Date(`${slots.endDate}T00:00:00Z`)
    for (; date <= through; date.setUTCDate(date.getUTCDate() + 1)) {
      for (const [startTime, endTime] of sessions) {
        windows.push({ date: date.toISOString().slice(0, 10), startTime, endTime, status: 'AVAILABLE' })
      }
    }
    return windows
  }

  function applySessions(slots) {
    try {
      const { sessions, signature } = sessionDraft(slots)
      change(windowsWithSessions(slots, sessions))
      appliedSessions.current = signature
    } catch (error) {
      setWindowError(error.message)
    }
  }

  function update(index, patch) {
    change(draft.map((window, i) => i === index ? { ...window, ...patch } : window))
  }

  function saveWindows(slots, proceed) {
    setWindowError('')
    const { sessions, signature } = sessionDraft(slots)
    let windowsToSave = draft
    if (sessions.length && signature !== appliedSessions.current) {
      try {
        windowsToSave = windowsWithSessions(slots, sessions)
      } catch (error) {
        setWindowError(error.message)
        return
      }
    }
    save.submit(() => schedulingAvailabilityApi.save(id, type, resource.id, windowsToSave), ({ windows }) => {
      appliedSessions.current = signature
      setSavedWindows(windows)
      setDraft(windows)
      if (proceed) navigate(scoped('/setup/constraints', id))
    })
  }

  return <AvailabilityConfigurationForm
    live={{ startDate, endDate, allowNight, stadium: type === 'stadiums' }}
    initial={{ morningStart: '', morningEnd: '', afternoonStart: '', afternoonEnd: '',
      nightStart: '', nightEnd: '', startDate, endDate, pitchRestHours: '', reserveDay: '',
      weeklyRestDay: '', teamRecoveryHours: '' }}
    status={savedWindows.length ? 'Completed' : 'Not Started'}
    saving={save.saving} onSave={saveWindows} onBack={() => navigate(scoped('/officials', id))}
    scopedControls={<div className="space-y-3">{controls(dirty || save.saving)}
      {dirty && <Button type="button" variant="secondary" size="sm" disabled={save.saving}
        onClick={() => change(savedWindows)}>Discard Unsaved Windows</Button>}
      {(!startDate || !endDate) && <p className="form-message">
        <Link to={`/tournaments/${id}/edit`}>Set tournament dates</Link> before adding windows.
      </p>}
    </div>}
    feedback={<>{windowError && <p className="form-message" role="alert">{windowError}</p>}<SaveFeedback state={save} /></>}
    renderWindows={(slots) => <div className="space-y-3 pt-4 border-t border-slate-100">
      <h3 className="text-sm font-bold text-slate-900">Dated Availability & Blackout Periods</h3>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={!startDate || !endDate}
          onClick={() => applySessions(slots)}>Add Daily Sessions to Dates</Button>
        <Button type="button" variant="secondary" size="sm" disabled={!startDate || !endDate}
          onClick={() => change([...draft, { date: '', startTime: '', endTime: '', status: 'AVAILABLE' }])}>Add Window</Button>
        <Button type="button" variant="secondary" size="sm" disabled={!startDate || !endDate}
          onClick={() => change([...draft, { date: '', startTime: '00:00', endTime: '23:59:59', status: 'UNAVAILABLE' }])}>Add Full-day Blackout</Button>
      </div>
      {!draft.length && <p className="text-xs text-slate-500">No windows recorded for this resource.</p>}
      {draft.map((window, index) => <div key={index} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
        <Input label="Date" type="date" min={startDate} max={endDate} value={window.date} required
          onChange={(event) => update(index, { date: event.target.value })} />
        <Input label="Start Time" type="time" step="1" value={window.startTime} required
          onChange={(event) => update(index, { startTime: event.target.value })} />
        <Input label="End Time" type="time" step="1" value={window.endTime} required
          onChange={(event) => update(index, { endTime: event.target.value })} />
        <label className="block text-xs font-semibold text-slate-700">Type
          <select value={window.status} onChange={(event) => update(index, { status: event.target.value })}
            className="block w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg">
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Blackout</option>
          </select>
        </label>
        <Button type="button" variant="secondary" size="sm" aria-label={`Remove window ${index + 1}`}
          onClick={() => change(draft.filter((_, i) => i !== index))}>Remove</Button>
      </div>)}
    </div>}
  />
}
