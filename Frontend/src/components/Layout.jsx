import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { scheduleWorkspacePath } from '../api/schedules'
import { CalendarDays, ChevronDown, Menu, Moon, Plus, Sun, Trophy, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const managementLinks = [
  { label: 'Teams', to: '/teams' },
  { label: 'Stadiums', to: '/stadiums' },
  { label: 'Officials', to: '/officials' },
  { label: 'Generate schedule', to: '/schedule/generate' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Match results', to: '/results' },
  { label: 'Conflicts', to: '/schedule/conflicts' },
  { label: 'Standings', to: '/standings' },
  { label: 'Analytics', to: '/analytics' },
]

const resourcePaths = new Set(['/teams', '/stadiums', '/officials', '/schedule/generate'])

export default function Layout({ children, demo }) {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const roles = auth?.user?.roles ?? []
  const hasManagementRole = roles.some((role) => ['ADMIN', 'ORGANIZER', 'TEAM_MANAGER'].includes(role))
  const tournamentId = demo ? null : (
    pathname.match(/^\/tournaments\/(\d+)(?:\/edit)?\/?$/)?.[1]
    ?? new URLSearchParams(search).get('tournament')
  )
  const versionId = tournamentId ? new URLSearchParams(search).get('version') : null
  const schedulePath = scheduleWorkspacePath('/schedule', tournamentId, versionId)
  const [lightTheme, setLightTheme] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const isLanding = pathname === '/'
  const showWorkspaceSubnav = !isLanding && pathname !== '/tournaments'

  return (
    <div className={`site-shell ${lightTheme ? 'theme-light' : ''}`}>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="TournamentHub home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Trophy size={17} strokeWidth={2.2} /></span>
          <span>Tournament<span className="brand-accent">Hub</span></span>
        </Link>
        <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`header-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
          {(!roles.includes('VIEWER') || roles.some((role) => ['ADMIN', 'ORGANIZER'].includes(role))) &&
            <NavLink to="/tournaments/create" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
              <Plus size={15} /> Create a Tournament
            </NavLink>}
          <NavLink to="/tournaments" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Trophy size={15} /> Find Tournaments
          </NavLink>
          {!isLanding && (!roles.includes('VIEWER') || hasManagementRole) && (
            <details className="manage-menu">
              <summary>Manage <ChevronDown size={14} /></summary>
              <div className="manage-menu-popover">
                {managementLinks.map((item) => (
                  <Link key={item.to}
                    to={item.to === '/schedule' ? schedulePath : tournamentId && resourcePaths.has(item.to)
                      ? scheduleWorkspacePath(item.to, tournamentId) : item.to}
                    onClick={() => setMenuOpen(false)}>{item.label}</Link>
                ))}
              </div>
            </details>
          )}
          <button className="theme-toggle" type="button" aria-label={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'} title={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'} onClick={() => setLightTheme(!lightTheme)}>
            {lightTheme ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <a className="nav-link" href={demo ? '/' : '/demo'}>{demo ? 'Live workspace' : 'Demo mode'}</a>
          {!demo && auth?.user?.roles?.includes('ADMIN') && <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>Admin Dashboard</NavLink>}
          {!demo && auth?.user?.roles?.includes('ORGANIZER') && <NavLink to="/organizer" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>Organizer Dashboard</NavLink>}
          {!demo && auth?.user?.roles?.includes('TEAM_MANAGER') && <NavLink to="/team-manager" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>Team Manager</NavLink>}
          {!demo && auth?.user?.roles?.includes('VIEWER') && <NavLink to="/viewer" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>Viewer Dashboard</NavLink>}
          {!auth?.user
            ? <Link className="login-link" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
            : <><span className="login-link" title={auth.user.roles.join(', ')}>{auth.user.email}</span><button className="login-link" type="button" onClick={async () => { setLogoutError(''); try { await auth.logout(); setMenuOpen(false); navigate('/login', { replace: true }) } catch { setLogoutError('Could not log out. Please retry.') } }}>Log out</button></>}
        </nav>
      </header>
      {logoutError && <p className="form-message" role="alert">{logoutError}</p>}
      {showWorkspaceSubnav && (
        <div className="workspace-subnav">
          <Link to="/dashboard">Workspace</Link>
          <span>/</span>
          <span>{managementLinks.find((item) => item.to === pathname)?.label || (pathname.startsWith('/tournaments/') ? 'Tournament' : pathname === '/login' ? 'Log in' : 'Cricket operations')}</span>
          <Link className="subnav-schedule" to={schedulePath}><CalendarDays size={14} /> Match schedule</Link>
        </div>
      )}
      <main className={isLanding ? 'landing-main' : 'app-content'}>{children}</main>
      {isLanding && <footer className="site-footer"><Link className="brand footer-brand" to="/"><span className="brand-mark"><Trophy size={15} /></span><span>Tournament<span className="brand-accent">Hub</span></span></Link><span>Cricket tournaments, thoughtfully organized.</span><Link to="/login">Organizer log in</Link></footer>}
    </div>
  )
}
