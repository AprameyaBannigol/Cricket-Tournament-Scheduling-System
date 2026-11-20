/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — App Router & Setup Context Provider
 * ══════════════════════════════════════════════════════════════
 */

import { Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import {
  ConflictResolutionPage,
  CreateTournamentPage,
  DemoCreateTournamentPage,
  DemoLandingPage,
  DemoTournamentOverviewPage,
  GenerateSchedulePage,
  LandingPage,
  LoginPage,
  StandingsPage,
  TournamentOverviewPage,
} from './pages/WorkspacePages'
import Dashboard from './pages/Dashboard'
import TournamentsPage, { DemoTournamentsPage } from './pages/Tournaments'
import TeamsPage, { DemoTeamsPage } from './pages/Teams'
import SchedulePage, { ScheduleVersionsPage } from './pages/Schedule'
import { LiveGenerateSchedulePage, LiveSchedulePage, LiveScheduleVersionsPage } from './pages/LiveSchedules'
import VenueTravelTimesPage from './pages/setup/VenueTravelTimesPage'
import LiveResultsPage from './pages/LiveResultsPage'
import AnalyticsPage from './pages/Analytics'
import LiveStandingsPage from './pages/LiveStandingsPage'
import LiveAnalyticsPage from './pages/LiveAnalyticsPage'
import SettingsPage from './pages/Settings'
import AdminDashboardPage from './pages/AdminDashboardPage'
import OrganizerDashboardPage from './pages/OrganizerDashboardPage'
import TeamManagerDashboardPage from './pages/TeamManagerDashboardPage'
import ViewerDashboardPage from './pages/ViewerDashboardPage'

// Setup Workflow Pages
import TournamentDetailsPage, { EditTournamentPage } from './pages/setup/TournamentDetailsPage'
import MatchConfigPage from './pages/setup/MatchConfigPage'
import StadiumRegistrationPage, { DemoStadiumRegistrationPage } from './pages/setup/StadiumRegistrationPage'
import OfficialsRegistrationPage, { DemoOfficialsRegistrationPage } from './pages/setup/OfficialsRegistrationPage'
import AvailabilityConfigPage from './pages/setup/AvailabilityConfigPage'
import ConstraintsPage from './pages/setup/ConstraintsPage'
import LiveSchedulingConfiguration from './pages/setup/LiveSchedulingConfiguration'

// Setup Context
import { TournamentSetupProvider } from './context/TournamentSetupContext'

function DemoFeaturePage() {
  const { pathname } = useLocation()
  return (
    <div className="workspace-page">
      <section className="content-panel">
        <h1>Available in demo mode</h1>
        <p>This page uses the browser-local demo workspace.</p>
        <div className="page-actions">
          <a className="button button-primary" href={`/demo${pathname}`}>Open demo page</a>
          <Link className="button button-secondary" to="/tournaments">Back to tournaments</Link>
        </div>
      </section>
    </div>
  )
}

function RequireAuth({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (!auth) return children
  if (auth.loading) return <div className="workspace-page"><p role="status">Checking your session…</p></div>
  if (!auth.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return children
}

function RequireAdmin({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth?.loading) return <div className="workspace-page"><p role="status">Checking your session…</p></div>
  if (!auth?.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!auth.user.roles?.includes('ADMIN')) return <Navigate to="/tournaments" replace />
  return children
}

function RequireOrganizer({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth?.loading) return <div className="workspace-page"><p role="status">Checking your session…</p></div>
  if (!auth?.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!auth.user.roles?.includes('ORGANIZER') && !auth.user.roles?.includes('ADMIN')) return <Navigate to="/tournaments" replace />
  return children
}

function RequireTeamManager({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth?.loading) return <div className="workspace-page"><p role="status">Checking your session…</p></div>
  if (!auth?.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!auth.user.roles?.includes('TEAM_MANAGER')) return <Navigate to="/tournaments" replace />
  return children
}

function RequireViewer({ children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth?.loading) return <div className="workspace-page"><p role="status">Checking your session…</p></div>
  if (!auth?.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!auth.user.roles?.includes('VIEWER')) return <Navigate to="/tournaments" replace />
  return children
}

function RequireRoles({ roles, children }) {
  const auth = useAuth()
  const location = useLocation()
  if (auth?.loading) return <div className="workspace-page"><p role="status">Checking your session…</p></div>
  if (!auth?.user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!auth.user.roles?.some((role) => roles.includes(role))) return <Navigate to="/tournaments" replace />
  return children
}

export default function App({ demo = false }) {
  const workspace = (
    <Layout demo={demo}>
      <Routes>
        <Route path="/" element={demo ? <DemoLandingPage /> : <LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/:role" element={<LoginPage />} />
        {!demo && <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />}
        {!demo && <Route path="/organizer" element={<RequireOrganizer><OrganizerDashboardPage /></RequireOrganizer>} />}
        {!demo && <Route path="/team-manager" element={<RequireTeamManager><TeamManagerDashboardPage /></RequireTeamManager>} />}
        {!demo && <Route path="/viewer" element={<RequireViewer><ViewerDashboardPage /></RequireViewer>} />}

        <Route path="/tournaments" element={demo ? <DemoTournamentsPage /> : <TournamentsPage />} />
        <Route path="/tournaments/create" element={demo ? <DemoCreateTournamentPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><CreateTournamentPage /></RequireRoles>} />
        <Route path="/tournaments/new" element={<Navigate to="/tournaments/create" replace />} />
        <Route path="/tournaments/:id" element={demo ? <DemoTournamentOverviewPage /> : <TournamentOverviewPage />} />
        {!demo && <Route path="/tournaments/:id/edit" element={<RequireRoles roles={['ADMIN', 'ORGANIZER']}><EditTournamentPage /></RequireRoles>} />}

        <Route path="/teams" element={demo ? <DemoTeamsPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER', 'TEAM_MANAGER']}><TeamsPage /></RequireRoles>} />
        <Route path="/stadiums" element={demo ? <DemoStadiumRegistrationPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><StadiumRegistrationPage /></RequireRoles>} />
        <Route path="/officials" element={demo ? <DemoOfficialsRegistrationPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><OfficialsRegistrationPage /></RequireRoles>} />

        <Route path="/setup/match-config" element={demo ? <MatchConfigPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><LiveSchedulingConfiguration type="match" /></RequireRoles>} />
        <Route path="/matches" element={demo ? <MatchConfigPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><LiveSchedulingConfiguration type="match" /></RequireRoles>} />
        <Route path="/availability" element={demo ? <AvailabilityConfigPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><LiveSchedulingConfiguration type="availability" /></RequireRoles>} />
        <Route path="/setup/constraints" element={demo ? <ConstraintsPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><LiveSchedulingConfiguration type="constraints" /></RequireRoles>} />
        <Route path="/generator" element={demo ? <ConstraintsPage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><LiveSchedulingConfiguration type="constraints" /></RequireRoles>} />

        <Route path="/schedule/generate" element={demo ? <GenerateSchedulePage /> : <RequireRoles roles={['ADMIN', 'ORGANIZER']}><LiveGenerateSchedulePage /></RequireRoles>} />
        <Route path="/schedule" element={demo ? <SchedulePage /> : <LiveSchedulePage />} />
        <Route path="/versions" element={demo ? <ScheduleVersionsPage /> : <LiveScheduleVersionsPage />} />
        {!demo && <Route path="/setup/travel-times" element={<RequireRoles roles={['ADMIN', 'ORGANIZER']}><VenueTravelTimesPage /></RequireRoles>} />}
        {!demo && <Route path="/results" element={<RequireRoles roles={['ADMIN', 'ORGANIZER', 'TEAM_MANAGER']}><LiveResultsPage /></RequireRoles>} />}

        <Route path="/standings" element={demo ? <StandingsPage /> : <LiveStandingsPage />} />
        <Route path="/analytics" element={demo ? <AnalyticsPage /> : <LiveAnalyticsPage />} />

        <Route element={demo ? <Outlet /> : <DemoFeaturePage />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/setup/details" element={<TournamentDetailsPage />} />

          <Route path="/schedule/conflicts" element={<ConflictResolutionPage />} />
          {demo && <Route path="/results" element={<SchedulePage />} />}
        </Route>

        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
  return demo ? <TournamentSetupProvider>{workspace}</TournamentSetupProvider> : workspace
}
