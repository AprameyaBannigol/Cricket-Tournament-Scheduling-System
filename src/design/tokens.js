/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — Design Tokens (Light Theme)
 * ══════════════════════════════════════════════════════════════
 *
 *  Centralised JS constants mirroring the CSS custom properties.
 *  Used for inline styles, Framer Motion, and dynamic theming.
 */

export const colors = {
  slate: {
    950: '#0F1A2E',
    900: '#1A2540',
    800: '#293755',
    700: '#374B6A',
    600: '#4A6080',
    500: '#64748B',
    400: '#8896A7',
    300: '#B0BCCC',
    200: '#D1D9E4',
    100: '#E8ECF2',
    50:  '#F1F4F8',
  },
  cricket: {
    700: '#15803D',
    600: '#16A34A',
    500: '#22C55E',
    400: '#4ADE80',
    300: '#86EFAC',
    100: '#DCFCE7',
    50:  '#F0FDF4',
  },
  navy: {
    950: '#0A1128',
    900: '#111B3C',
    800: '#1A2650',
    700: '#243365',
    600: '#2E4179',
  },
  status: {
    success: { fg: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    warning: { fg: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    error:   { fg: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    info:    { fg: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  },
  surface: {
    base:    '#F8F9FB',
    card:    '#FFFFFF',
    inset:   '#F1F4F8',
    sidebar: '#111B3C',
  },
  border: {
    default: '#E2E8F0',
    light:   '#F1F4F8',
    strong:  '#CBD5E1',
  },
}

export const typography = {
  fontFamily: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    display: '2.25rem',
    h1:      '1.875rem',
    h2:      '1.5rem',
    h3:      '1.25rem',
    body:    '1rem',
    caption: '0.875rem',
    micro:   '0.75rem',
  },
}

export const shadows = {
  xs:        '0 1px 2px rgba(15,26,46,0.04)',
  card:      '0 1px 3px rgba(15,26,46,0.06), 0 1px 2px rgba(15,26,46,0.04)',
  cardHover: '0 4px 12px rgba(15,26,46,0.08), 0 2px 4px rgba(15,26,46,0.04)',
  dropdown:  '0 10px 25px rgba(15,26,46,0.12), 0 4px 10px rgba(15,26,46,0.06)',
}

// Framer Motion presets — restrained for professional feel
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  staggerChildren: {
    animate: { transition: { staggerChildren: 0.05 } },
  },
}
