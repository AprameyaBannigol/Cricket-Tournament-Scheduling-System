/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — App Router & Setup Context Provider
 * ══════════════════════════════════════════════════════════════
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import {
  ConflictResolutionPage,
  CreateTournamentPage,
  GenerateSchedulePage,
  LandingPage,
  LoginPage,
  StandingsPage,
  TournamentOverviewPage,
} from './pages/WorkspacePages'
import Dashboard from './pages/Dashboard'
import TournamentsPage from './pages/Tournaments'
import TeamsPage from './pages/Teams'
import SchedulePage, { ScheduleVersionsPage } from './pages/Schedule'
import AnalyticsPage from './pages/Analytics'
import SettingsPage from './pages/Settings'

// Setup Workflow Pages
import TournamentDetailsPage from './pages/setup/TournamentDetailsPage'
import MatchConfigPage from './pages/setup/MatchConfigPage'
import StadiumRegistrationPage from './pages/setup/StadiumRegistrationPage'
import OfficialsRegistrationPage from './pages/setup/OfficialsRegistrationPage'
import AvailabilityConfigPage from './pages/setup/AvailabilityConfigPage'
import ConstraintsPage from './pages/setup/ConstraintsPage'

// Setup Context
import { TournamentSetupProvider } from './context/TournamentSetupContext'

export default function App() {
  return (
    <TournamentSetupProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Setup Workflow Steps */}
          <Route path="/setup/details" element={<TournamentDetailsPage />} />
          <Route path="/setup/match-config" element={<MatchConfigPage />} />
          <Route path="/setup/constraints" element={<ConstraintsPage />} />

          {/* Core Tournament Management */}
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/create" element={<CreateTournamentPage />} />
          <Route path="/tournaments/new" element={<TournamentDetailsPage />} />
          <Route path="/tournaments/:id" element={<TournamentOverviewPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/matches" element={<MatchConfigPage />} />

          {/* Resource Registrations */}
          <Route path="/stadiums" element={<StadiumRegistrationPage />} />
          <Route path="/officials" element={<OfficialsRegistrationPage />} />
          <Route path="/availability" element={<AvailabilityConfigPage />} />

          {/* Scheduling Operations */}
          <Route path="/schedule/generate" element={<GenerateSchedulePage />} />
          <Route path="/schedule/conflicts" element={<ConflictResolutionPage />} />
          <Route path="/standings" element={<StandingsPage />} />
          <Route path="/generator" element={<ConstraintsPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/results" element={<SchedulePage />} />
          <Route path="/versions" element={<ScheduleVersionsPage />} />

          {/* System */}
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </TournamentSetupProvider>
  )
}
