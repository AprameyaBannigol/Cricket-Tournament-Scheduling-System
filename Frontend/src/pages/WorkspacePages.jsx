import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Flag,
  MapPin,
  Shield,
  Trophy,
  Users,
} from 'lucide-react'
import { useTournamentSetup } from '../context/TournamentSetupContext'

const workflowSteps = [
  'Tournament details',
  'Register teams',
  'Choose format',
  'Add grounds',
  'Add officials',
  'Scheduling preferences',
  'Review',
]

export function LandingPage() {
  const { activeTournament, teams, stadiums, matches, matchConfig } = useTournamentSetup()
  const activeMatches = matches.filter((match) => match.tournamentId === activeTournament?.id)
  const activeTeams = teams.filter((team) => team.tournamentId === activeTournament?.id)
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Cricket, organized</span>
          <h1>Every fixture in place.<br /><span>Your tournament, in play.</span></h1>
          <p>
            Plan cricket competitions from team registration to match day.
            Keep fixtures, grounds and tournament information in one clear place.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/tournaments/create">
              Create your tournament <ArrowRight size={17} />
            </Link>
            <Link className="button button-quiet" to="/tournaments">
              Explore tournaments <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-capabilities">
            <span><Check size={15} /> Cricket-first setup</span>
            <span><Check size={15} /> Fixtures at a glance</span>
            <span><Check size={15} /> Shareable tournament pages</span>
          </div>
        </div>
        <StandingsPreview teams={activeTeams} matches={activeMatches} tournament={activeTournament} matchConfig={matchConfig} />
      </section>

      <section className="landing-section">
        <div className="section-copy">
          <span className="eyebrow">01 / Set the stage</span>
          <h2>Start with the competition you’re running.</h2>
          <p>
            Add the tournament essentials, register teams and choose a format
            that fits your cricket calendar.
          </p>
          <Link className="text-link" to="/tournaments/create">Set up a tournament <ArrowRight size={16} /></Link>
        </div>
        <div className="product-panel setup-preview">
          <div className="panel-heading">
            <div><span className="panel-kicker">TOURNAMENT SETUP</span><strong>{activeTournament?.name || 'KLE Cricket Championship 2026'}</strong></div>
            <span className="panel-tag">Draft</span>
          </div>
          <div className="setup-progress"><span style={{ width: '57%' }} /></div>
          {['Tournament details', 'Team registration', 'Match format', 'Grounds & officials'].map((item, index) => (
            <div className="setup-row" key={item}>
              <span className={`setup-step ${index < 2 ? 'is-done' : ''}`}>{index < 2 ? <Check size={12} /> : index + 1}</span>
              <span>{item}</span>
              <span className="setup-row-state">{index < 2 ? 'Complete' : 'To do'}</span>
            </div>
          ))}
          <p className="preview-caption">A preview of the organizer setup experience · sample content</p>
        </div>
      </section>

      <section className="landing-section section-reverse">
        <div className="section-copy">
          <span className="eyebrow">02 / Bring fixtures together</span>
          <h2>See the matchday shape at a glance.</h2>
          <p>
            Review generated fixtures, match times and grounds in a schedule
            view built for the people running the tournament.
          </p>
          <Link className="text-link" to="/schedule">View the schedule <ArrowRight size={16} /></Link>
        </div>
        <div className="product-panel fixture-preview">
          <div className="panel-heading">
            <div><span className="panel-kicker">FIXTURE PREVIEW</span><strong>Matchday 03 · 4 Nov</strong></div>
            <CalendarDays size={17} />
          </div>
          {activeMatches.slice(0, 3).map((match) => (
            <div className="fixture-row" key={match.id}>
              <span className="fixture-time">{match.time}</span>
              <div className="fixture-teams"><strong>{match.teamA}</strong><span>vs</span><strong>{match.teamB}</strong></div>
              <span className="fixture-venue"><MapPin size={12} />{match.stadium} · {match.date}</span>
            </div>
          ))}
          <p className="preview-caption">Sample fixtures from the selected tournament · demonstration data</p>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-copy">
          <span className="eyebrow">03 / Keep the details close</span>
          <h2>Grounds and officials, alongside the plan.</h2>
          <p>
            Keep venue and match-official information with your tournament.
            Scheduling inputs remain transparent while allocation tools evolve.
          </p>
          <div className="inline-links">
            <Link className="text-link" to="/stadiums">Manage grounds <ArrowRight size={16} /></Link>
            <Link className="text-link" to="/officials">Manage officials <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="product-panel resource-preview">
          <div className="panel-heading"><div><span className="panel-kicker">REGISTERED GROUNDS</span><strong>Competition venues</strong></div><MapPin size={17} /></div>
          {stadiums.slice(0, 3).map((stadium) => (
            <div className="resource-row" key={stadium.id}>
              <span className="resource-icon"><Flag size={15} /></span>
              <span className="resource-name"><strong>{stadium.name}</strong><small>{stadium.type}</small></span>
              <span className={`availability ${stadium.status === 'Available' ? 'available' : ''}`}>{stadium.status}</span>
            </div>
          ))}
          <p className="preview-caption">Sample venue information · availability is not validated by a backend</p>
        </div>
      </section>

      <section className="public-showcase">
        <span className="eyebrow">One public view for everyone following along</span>
        <h2>Fixtures and standings, easy to find.</h2>
        <p>Share a tournament page with players, supporters and the wider cricket community.</p>
        <Link className="button button-primary" to={`/tournaments/${activeTournament?.id || 'tn-001'}`}>View a tournament <ArrowRight size={16} /></Link>
        <div className="public-showcase-links">
          <Link to="/standings"><Trophy size={15} /> Points table</Link>
          <Link to="/schedule"><CalendarDays size={15} /> Match fixtures</Link>
          <Link to="/tournaments"><Users size={15} /> All tournaments</Link>
        </div>
      </section>
    </div>
  )
}

function StandingsPreview({ teams, matches, tournament, matchConfig }) {
  const standings = calculateStandings(teams, matches, matchConfig)
  return (
    <div className="hero-preview">
      <div className="preview-topbar">
        <span className="tournament-mark"><Trophy size={16} /></span>
        <div><strong>{tournament?.name || 'KLE Cricket Championship 2026'}</strong><small>{tournament?.format || 'T20 Round Robin'}</small></div>
        <span className="preview-live"><i /> DEMO</span>
      </div>
      <div className="preview-tabs"><span className="active">Standings</span><span>Fixtures</span><span>Teams</span></div>
      <div className="standings-table">
        <div className="standings-head"><span>#</span><span>Team</span><span>P</span><span>W</span><span>Pts</span><span>NRR</span></div>
        {standings.slice(0, 5).map((row, index) => (
          <div className="standings-row" key={row.team}>
            <span className={index === 0 ? 'rank rank-first' : 'rank'}>{index + 1}</span>
            <strong>{row.team}</strong><span>{row.played}</span><span>{row.won}</span><b>{row.points}</b><span>{row.nrr}</span>
          </div>
        ))}
      </div>
      <div className="preview-bottom"><span>Sample standings for demonstration</span><span>Open public view <ArrowUpRight size={13} /></span></div>
      {matches[0] && <div className="floating-fixture"><span className="floating-label">UP NEXT · MATCH {matches[0].matchNumber}</span><strong>{matches[0].teamA} <span>vs</span> {matches[0].teamB}</strong><small><Clock3 size={12} /> {matches[0].date}, {matches[0].time} · {matches[0].stadium}</small></div>}
    </div>
  )
}

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const { createTournament, teams, activeTournament } = useTournamentSetup()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    hostInstitution: '',
    startDate: '2026-11-01',
    endDate: '2026-11-18',
    teams: teams.filter((team) => team.tournamentId === activeTournament?.id).map((team) => team.name).join('\n'),
    format: 'T20 Round Robin',
    stadiums: '',
    officials: '',
    matchDuration: 4,
    recoveryHours: 24,
  })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const complete = () => {
    const tournamentId = createTournament({
      name: form.name,
      hostInstitution: form.hostInstitution,
      startDate: form.startDate,
      endDate: form.endDate,
      teams: form.teams.split('\n').map((name) => name.trim()).filter(Boolean),
      format: form.format,
      stadiums: form.stadiums.split('\n').map((name) => name.trim()).filter(Boolean),
      officials: form.officials.split('\n').map((name) => name.trim()).filter(Boolean),
      matchDuration: form.matchDuration,
      recoveryHours: form.recoveryHours,
    })
    navigate(`/teams?tournament=${tournamentId}`)
  }

  return (
    <div className="workspace-page create-workspace">
      <div className="page-intro">
        <span className="eyebrow">TOURNAMENT SETUP</span>
        <h1>Create your tournament</h1>
        <p>Build a cricket tournament setup one step at a time.</p>
      </div>
      <div className="demo-notice"><CircleHelp size={16} /><span>Demonstration mode: the created tournament and registrations are saved in this browser, not sent to a backend.</span></div>
      <div className="wizard-layout">
        <nav className="wizard-steps" aria-label="Tournament setup progress">
          {workflowSteps.map((label, index) => (
            <button type="button" className={`wizard-step ${step === index ? 'current' : ''} ${step > index ? 'complete' : ''}`} key={label} onClick={() => index <= step && setStep(index)} disabled={index > step} aria-current={step === index ? 'step' : undefined}>
              <span>{step > index ? <Check size={13} /> : index + 1}</span>{label}
            </button>
          ))}
        </nav>
        <section className="wizard-card">
          <div className="wizard-card-heading">
            <div><span className="panel-kicker">STEP {step + 1} OF {workflowSteps.length}</span><h2>{workflowSteps[step]}</h2></div>
            <span className="muted">{Math.round(((step + 1) / workflowSteps.length) * 100)}% complete</span>
          </div>
          <div className="wizard-fields">
            {step === 0 && <>
              <label>Tournament name<input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="e.g. City Cricket Cup 2026" required autoFocus /></label>
              <label>Host organization<input value={form.hostInstitution} onChange={(event) => update('hostInstitution', event.target.value)} placeholder="Club, school or association" /></label>
              <div className="form-grid">
                <label>Start date<input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label>
                <label>End date<input type="date" value={form.endDate} onChange={(event) => update('endDate', event.target.value)} min={form.startDate || undefined} /></label>
              </div>
            </>}
            {step === 1 && <><label>Team names, one per line<textarea rows="7" value={form.teams} onChange={(event) => update('teams', event.target.value)} placeholder={'Riverside CC\nNorthside XI\nValley Cricket Club'} /></label><p className="field-note">Team registration and roster management are available on the Teams page. This list is a setup note only.</p></>}
            {step === 2 && <><label>Tournament format<select value={form.format} onChange={(event) => update('format', event.target.value)}><option>T20 Round Robin</option><option>50-Over Round Robin</option></select></label><p className="field-note">The local sample fixture generator supports round-robin formats; match overs and points can be configured in Match Configuration.</p></>}
            {step === 3 && <><label>Grounds to consider<textarea rows="5" value={form.stadiums} onChange={(event) => update('stadiums', event.target.value)} placeholder="Add ground names or manage them on the Stadiums page" /></label><Link className="text-link" to="/stadiums">Open stadium management <ArrowUpRight size={15} /></Link></>}
            {step === 4 && <><label>Officials to consider<textarea rows="5" value={form.officials} onChange={(event) => update('officials', event.target.value)} placeholder="Add umpire or match-official names" /></label><Link className="text-link" to="/officials">Open officials management <ArrowUpRight size={15} /></Link></>}
            {step === 5 && <><div className="form-grid"><label>Match duration (hours)<input type="number" min="1" max="12" value={form.matchDuration} onChange={(event) => update('matchDuration', event.target.value)} /></label><label>Minimum recovery (hours)<input type="number" min="0" max="168" value={form.recoveryHours} onChange={(event) => update('recoveryHours', event.target.value)} /></label></div><p className="demo-notice"><CircleHelp size={16} /> These preferences are captured for planning only; the current frontend has no allocation or constraint-validation API.</p></>}
            {step === 6 && <div className="review-list">
              <ReviewRow label="Tournament" value={form.name || 'Not provided'} />
              <ReviewRow label="Host" value={form.hostInstitution || 'Not provided'} />
              <ReviewRow label="Dates" value={form.startDate && form.endDate ? `${form.startDate} — ${form.endDate}` : 'Not provided'} />
              <ReviewRow label="Teams" value={form.teams.split('\n').filter(Boolean).length ? `${form.teams.split('\n').filter(Boolean).length} listed` : 'None listed'} />
              <ReviewRow label="Format" value={form.format} />
              <ReviewRow label="Grounds / officials" value={`${form.stadiums.split('\n').filter(Boolean).length} / ${form.officials.split('\n').filter(Boolean).length} listed`} />
              <p className="field-note">Finishing updates the in-session setup preview only. No tournament is sent to a backend.</p>
            </div>}
          </div>
          <div className="wizard-actions">
            <button className="button button-quiet" type="button" onClick={() => step === 0 ? navigate('/') : setStep(step - 1)}><ChevronLeft size={16} /> {step === 0 ? 'Cancel' : 'Back'}</button>
            {step < workflowSteps.length - 1
              ? <button className="button button-primary" type="button" onClick={() => setStep(step + 1)} disabled={step === 0 && !form.name.trim()}>Continue <ChevronRight size={16} /></button>
              : <button className="button button-primary" type="button" onClick={complete} disabled={!form.name.trim()}>Finish setup <Check size={16} /></button>}
          </div>
        </section>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return <div className="review-row"><span>{label}</span><strong>{value}</strong></div>
}

export function LoginPage() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <div className="workspace-page narrow-page">
      <section className="simple-form-card">
        <span className="eyebrow">ORGANIZER ACCESS</span>
        <h1>Log in to TournamentHub</h1>
        <p>Manage your cricket tournaments and matchday details.</p>
        <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
          <label>Email address<input type="email" placeholder="you@club.org" required /></label>
          <label>Password<input type="password" placeholder="Your password" required /></label>
          {submitted && <p className="form-message" role="status">Login is not connected because this project has no authentication API yet.</p>}
          <button className="button button-primary button-full" type="submit">Continue <ArrowRight size={16} /></button>
        </form>
        <p className="form-footnote">New to TournamentHub? <Link to="/tournaments/create">Create a tournament</Link></p>
      </section>
    </div>
  )
}

export function TournamentOverviewPage() {
  const { id } = useParams()
  const { tournaments: allTournaments, matches: allMatches, teams, matchConfig, setActiveTournament } = useTournamentSetup()
  const tournament = allTournaments.find((item) => item.id === id) || allTournaments[0]
  const tournamentTeams = teams.filter((team) => team.tournamentId === tournament?.id)
  const teamNames = tournamentTeams.map((team) => team.name)
  const matches = allMatches.filter((match) => match.tournamentId === tournament?.id)
  const standings = calculateStandings(tournamentTeams, matches, matchConfig)

  useEffect(() => {
    if (tournament?.id) setActiveTournament(tournament.id)
  }, [setActiveTournament, tournament?.id])

  return (
    <div className="workspace-page">
      <div className="page-intro tournament-intro">
        <span className="eyebrow">PUBLIC TOURNAMENT · SAMPLE DATA</span>
        <h1>{tournament.name}</h1>
        <p>{tournament.format} · {tournament.location} · {tournament.startDate} — {tournament.endDate}</p>
        <div className="page-actions">
          <Link className="button button-secondary" to="/schedule">Fixtures <CalendarDays size={16} /></Link>
          <Link className="button button-secondary" to="/standings">Standings <Trophy size={16} /></Link>
        </div>
      </div>
      <div className="demo-notice"><CircleHelp size={16} /> This public preview uses demonstration data and is not connected to a live tournament feed.</div>
      <div className="overview-grid">
        <section className="content-panel">
          <div className="panel-heading"><div><span className="panel-kicker">TOURNAMENT TABLE</span><h2>Standings</h2></div><Link className="text-link" to="/standings">Full table <ArrowRight size={15} /></Link></div>
          <StandingsTable standings={standings} />
        </section>
        <section className="content-panel">
          <div className="panel-heading"><div><span className="panel-kicker">UP NEXT</span><h2>Fixtures</h2></div><Link className="text-link" to="/schedule">All fixtures <ArrowRight size={15} /></Link></div>
          <div className="mini-fixtures">{matches.filter((match) => !teamNames.length || (teamNames.includes(match.teamA) && teamNames.includes(match.teamB))).slice(0, 3).map((match) => <div className="mini-fixture" key={match.id}><span>Match {match.matchNumber} · {match.round}</span><strong>{match.teamA} <i>vs</i> {match.teamB}</strong><small>{match.date} · {match.time}</small></div>)}</div>
        </section>
      </div>
      <p className="field-note">Public view for {tournament?.name} · Sample content</p>
    </div>
  )
}

export function GenerateSchedulePage() {
  const { tournaments: allTournaments, activeTournament, setActiveTournament, teams, stadiums, officials, availability, constraints, saveConstraints, generateSchedule } = useTournamentSetup()
  const [message, setMessage] = useState('')
  const [values, setValues] = useState({
    tournament: activeTournament?.id || '',
    start: activeTournament?.startDate || availability.startDate,
    end: activeTournament?.endDate || availability.endDate,
    duration: String(availability.matchDurationHours),
    rest: String(constraints.minimumRecoveryHours),
    travel: String(constraints.travelBufferHours),
  })
  const update = (key, value) => setValues((current) => ({ ...current, [key]: value }))
  const generate = (event) => {
    event.preventDefault()
    try {
      const count = generateSchedule(values.tournament, {
        startDate: values.start,
        endDate: values.end,
        duration: values.duration,
      })
      saveConstraints({
        ...constraints,
        minimumRecoveryHours: Number(values.rest),
        travelBufferHours: Number(values.travel),
      })
      setActiveTournament(values.tournament)
      setMessage(`Generated ${count} round-robin fixtures in local demo state. Venue, official and constraint assignments are illustrative, not backend-validated.`)
    } catch (error) {
      setMessage(error.message)
    }
  }
  const activeTeamCount = teams.filter((team) => team.tournamentId === values.tournament).length
  const selectedTournament = allTournaments.find((tournament) => tournament.id === values.tournament)
  const formatSupported = selectedTournament?.format?.toLowerCase().includes('round robin')
  const availableGroundCount = stadiums.filter((stadium) => stadium.availabilityStatus !== 'maintenance').length
  return (
    <div className="workspace-page">
      <div className="page-intro">
        <span className="eyebrow">SCHEDULING</span>
        <h1>Generate a schedule</h1>
        <p>Choose the inputs you want to use for fixture planning.</p>
      </div>
      <div className="demo-notice"><CircleHelp size={16} /><span><strong>Demonstration mode:</strong> fixtures are generated locally with a round-robin pairing rotation. Assignments are sample data; backend availability, recovery and travel checks are not represented.</span></div>
      <form className="content-panel scheduling-form" onSubmit={generate}>
        <div className="panel-heading"><div><span className="panel-kicker">PLANNING INPUTS</span><h2>Match and availability preferences</h2></div><span className="panel-tag">Not sent to server</span></div>
        <div className="form-grid">
          <label className="form-wide">Tournament<select required value={values.tournament} onChange={(event) => {
            const tournamentId = event.target.value
            const selected = allTournaments.find((tournament) => tournament.id === tournamentId)
            setValues((current) => ({ ...current, tournament: tournamentId, start: selected?.startDate || current.start, end: selected?.endDate || current.end }))
          }}><option value="">Select a tournament</option>{allTournaments.map((tournament) => <option key={tournament.id} value={tournament.id} disabled={!tournament.format?.toLowerCase().includes('round robin')}>{tournament.name}{!tournament.format?.toLowerCase().includes('round robin') ? ' · unsupported demo format' : ''}</option>)}</select></label>
          <label>Start date<input type="date" required value={values.start} onChange={(event) => update('start', event.target.value)} /></label>
          <label>End date<input type="date" required min={values.start || undefined} value={values.end} onChange={(event) => update('end', event.target.value)} /></label>
          <label>Match duration (hours)<input type="number" min="1" max="12" value={values.duration} onChange={(event) => update('duration', event.target.value)} /></label>
          <label>Minimum recovery (hours)<input type="number" min="0" max="168" value={values.rest} onChange={(event) => update('rest', event.target.value)} /></label>
          <label>Minimum travel buffer (hours)<input type="number" min="0" max="24" value={values.travel} onChange={(event) => update('travel', event.target.value)} /></label>
        </div>
        <div className="planning-checklist">
          <p>Availability to review</p>
          <Link to="/teams"><Users size={16} /> {activeTeamCount} registered teams <ArrowUpRight size={14} /></Link>
          <Link to="/stadiums"><MapPin size={16} /> {availableGroundCount} grounds marked available <ArrowUpRight size={14} /></Link>
          <Link to="/officials"><Shield size={16} /> {officials.filter((official) => official.available).length} available officials <ArrowUpRight size={14} /></Link>
        </div>
        <button className="button button-primary" type="submit" disabled={!formatSupported || activeTeamCount < 2 || availableGroundCount < 2 || officials.filter((official) => official.available).length < 2}>Generate sample schedule <ArrowRight size={16} /></button>
        {message && <p className="form-message" role="status">{message}</p>}
        {message.startsWith('Generated') && <Link className="text-link" to="/schedule">Open generated fixtures <ArrowRight size={16} /></Link>}
      </form>
    </div>
  )
}

export function ConflictResolutionPage() {
  const { activeTournament, conflicts, matches, resolveConflict } = useTournamentSetup()
  const tournamentMatches = matches.filter((match) => match.tournamentId === activeTournament?.id)
  const tournamentMatchIds = new Set(tournamentMatches.map((match) => match.id))
  const tournamentConflicts = conflicts.filter((conflict) => tournamentMatchIds.has(conflict.matchId))
  const openConflicts = tournamentConflicts.filter((conflict) => !conflict.resolved)
  const resolvedConflicts = tournamentConflicts.filter((conflict) => conflict.resolved)
  return (
    <div className="workspace-page">
      <div className="page-intro">
        <span className="eyebrow">SCHEDULING · DEMO CASES</span>
        <h1>Schedule conflicts</h1>
        <p>Review and resolve the sample conflicts associated with the fixture draft.</p>
      </div>
      <div className="demo-notice"><CircleHelp size={16} /><span>These conflicts are intentionally seeded demonstration cases, not backend detection. Resolving one updates the local fixture shown in the schedule.</span></div>
      <section className="content-panel">
        <div className="panel-heading"><div><span className="panel-kicker">NEEDS ATTENTION</span><h2>{openConflicts.length} open conflict{openConflicts.length === 1 ? '' : 's'}</h2></div><div className="inline-links"><Link className="text-link" to="/schedule">Open fixtures <ArrowRight size={15} /></Link><Link className="text-link" to="/results">Enter results <ArrowRight size={15} /></Link></div></div>
        {openConflicts.length ? <div className="conflict-list">{openConflicts.map((conflict) => {
          const match = matches.find((item) => item.id === conflict.matchId)
          return <article className="conflict-row" key={conflict.id}>
            <div className="conflict-severity">{conflict.severity}</div>
            <div className="conflict-details">
              <span className="panel-kicker">{conflict.type}</span>
              <h3>{conflict.message}</h3>
              <p>{match ? `Match ${match.matchNumber}: ${match.teamA} vs ${match.teamB} · ${match.date} at ${match.time}` : 'The affected match is no longer in the active schedule.'}</p>
              <small>Suggested demo resolution: {conflict.suggestion}</small>
            </div>
            <button type="button" className="button button-primary" disabled={!match} onClick={() => resolveConflict(conflict.id)}>Apply sample resolution</button>
          </article>
        })}</div> : <div className="empty-inline"><Shield size={19} /><span>No open demo conflicts. Generate another sample schedule to seed a conflict case.</span></div>}
      </section>
      {resolvedConflicts.length > 0 && <section className="content-panel resolved-panel"><div className="panel-heading"><div><span className="panel-kicker">RESOLVED</span><h2>Resolution history</h2></div></div>{resolvedConflicts.map((conflict) => <div className="resolved-row" key={conflict.id}><strong>{conflict.type}</strong><span>{conflict.resolution}</span></div>)}</section>}
    </div>
  )
}

export function StandingsPage() {
  const { activeTournament, teams, matches: allMatches, matchConfig } = useTournamentSetup()
  const activeTeams = teams.filter((team) => team.tournamentId === activeTournament?.id)
  const matches = allMatches.filter((match) => match.tournamentId === activeTournament?.id)
  const standings = calculateStandings(activeTeams, matches, matchConfig)
  return (
    <div className="workspace-page">
      <div className="page-intro">
        <span className="eyebrow">TOURNAMENT TABLE · DEMO DATA</span>
        <h1>Standings</h1>
        <p>Cricket points table for {activeTournament?.name || 'the selected tournament'}.</p>
        <div className="page-actions">        <Link className="button button-secondary" to="/results">Enter match results <ArrowRight size={16} /></Link></div>
      </div>
      <div className="demo-notice"><CircleHelp size={16} /> Points and NRR are calculated from completed demo match results in this browser.</div>
      <section className="content-panel">
        <div className="panel-heading"><div><span className="panel-kicker">INTER-COLLEGIATE · {activeTournament?.format || 'T20'}</span><h2>Group standings</h2></div><span className="panel-tag">{matches.filter((match) => match.status === 'Completed').length} results</span></div>
        <StandingsTable full standings={standings} />
        <div className="standings-legend"><span><ArrowUpRight size={14} /> Points follow the saved demo match results</span><span><ArrowDownRight size={14} /> NRR uses entered runs and overs</span></div>
      </section>
    </div>
  )
}

function StandingsTable({ full = false, standings = [] }) {
  return (
    <div className="table-scroll">
      <table className="dark-table">
        <thead><tr><th>#</th><th>Team</th><th>Played</th><th>Won</th>{full && <><th>Lost</th><th>Tied</th></>}<th>Points</th><th>NRR</th></tr></thead>
        <tbody>{standings.map((team, index) => <tr key={team.team}><td><span className={`rank ${index < 2 ? 'rank-first' : ''}`}>{index + 1}</span></td><td><strong>{team.team}</strong></td><td>{team.played}</td><td>{team.won}</td>{full && <><td>{team.lost}</td><td>{team.tied}</td></>}<td><b>{team.points}</b></td><td>{team.nrr}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

function calculateStandings(teams, matches, matchConfig = {}) {
  const pointsForWin = Number(matchConfig.pointsForWin ?? 2)
  const pointsForTie = Number(matchConfig.pointsForTie ?? 1)
  const pointsForLoss = Number(matchConfig.pointsForLoss ?? 0)
  return teams.map((team) => {
    const record = { team: team.name, played: 0, won: 0, lost: 0, tied: 0, points: 0, runsFor: 0, runsAgainst: 0, oversFor: 0, oversAgainst: 0 }
    matches.filter((match) => match.status === 'Completed' && (match.teamA === team.name || match.teamB === team.name)).forEach((match) => {
      record.played += 1
      const teamA = match.teamA === team.name
      const runsFor = Number(teamA ? match.scoreA : match.scoreB) || 0
      const runsAgainst = Number(teamA ? match.scoreB : match.scoreA) || 0
      record.runsFor += runsFor
      record.runsAgainst += runsAgainst
      record.oversFor += oversAsDecimal(teamA ? match.oversA : match.oversB)
      record.oversAgainst += oversAsDecimal(teamA ? match.oversB : match.oversA)
      const result = match.winner || (runsFor === runsAgainst ? 'Tie' : runsFor > runsAgainst ? team.name : (teamA ? match.teamB : match.teamA))
      if (result === 'Tie' || runsFor === runsAgainst) {
        record.tied += 1
        record.points += pointsForTie
      } else if (result === team.name) {
        record.won += 1
        record.points += pointsForWin
      } else {
        record.lost += 1
        record.points += pointsForLoss
      }
    })
    const nrrValue = record.oversFor > 0 && record.oversAgainst > 0
      ? (record.runsFor / record.oversFor) - (record.runsAgainst / record.oversAgainst)
      : null
    const nrr = nrrValue === null ? '—' : `${nrrValue > 0 ? '+' : ''}${nrrValue.toFixed(2)}`
    return { ...record, nrr, nrrValue }
  }).sort((left, right) => right.points - left.points || (right.nrrValue ?? -Infinity) - (left.nrrValue ?? -Infinity))
}

function oversAsDecimal(value) {
  const [overs = 0, balls = 0] = String(value || '0.0').split('.').map(Number)
  return overs + Math.min(balls, 5) / 6
}
