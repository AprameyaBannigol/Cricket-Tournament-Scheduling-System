import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, ChevronDown, Menu, Moon, Plus, Sun, Trophy, X } from 'lucide-react'

const managementLinks = [
  { label: 'Teams', to: '/teams' },
  { label: 'Stadiums', to: '/stadiums' },
  { label: 'Officials', to: '/officials' },
  { label: 'Generate schedule', to: '/schedule/generate' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Match results', to: '/results' },
  { label: 'Conflicts', to: '/schedule/conflicts' },
  { label: 'Standings', to: '/standings' },
]

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const [lightTheme, setLightTheme] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
          <NavLink to="/tournaments/create" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Plus size={15} /> Create a Tournament
          </NavLink>
          <NavLink to="/tournaments" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
            <Trophy size={15} /> Find Tournaments
          </NavLink>
          {!isLanding && (
            <details className="manage-menu">
              <summary>Manage <ChevronDown size={14} /></summary>
              <div className="manage-menu-popover">
                {managementLinks.map((item) => <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
              </div>
            </details>
          )}
          <button className="theme-toggle" type="button" aria-label={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'} title={lightTheme ? 'Switch to dark theme' : 'Switch to light theme'} onClick={() => setLightTheme(!lightTheme)}>
            {lightTheme ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <Link className="login-link" to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
        </nav>
      </header>
      {showWorkspaceSubnav && (
        <div className="workspace-subnav">
          <Link to="/dashboard">Workspace</Link>
          <span>/</span>
          <span>{managementLinks.find((item) => item.to === pathname)?.label || (pathname.startsWith('/tournaments/') ? 'Tournament' : pathname === '/login' ? 'Log in' : 'Cricket operations')}</span>
          <Link className="subnav-schedule" to="/schedule"><CalendarDays size={14} /> Match schedule</Link>
        </div>
      )}
      <main className={isLanding ? 'landing-main' : 'app-content'}>{children}</main>
      {isLanding && <footer className="site-footer"><Link className="brand footer-brand" to="/"><span className="brand-mark"><Trophy size={15} /></span><span>Tournament<span className="brand-accent">Hub</span></span></Link><span>Cricket tournaments, thoughtfully organized.</span><Link to="/login">Organizer log in</Link></footer>}
    </div>
  )
}
