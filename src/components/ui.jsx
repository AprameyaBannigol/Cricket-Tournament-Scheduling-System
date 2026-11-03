/**
 * ══════════════════════════════════════════════════════════════
 *  TOURNAMENT HUB — UI Component Library (Light Theme)
 * ══════════════════════════════════════════════════════════════
 *  Clean, restrained, enterprise components for cricket management.
 */

import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { motionPresets } from '../design/tokens'

/* ─── Card ─────────────────────────────────────────────────── */
export function Card({
  children,
  className,
  variant = 'default',
  hover = true,
  ...props
}) {
  const variants = {
    default: 'bg-white border border-slate-200/90 rounded-xl shadow-xs',
    subtle: 'bg-slate-50/70 border border-slate-200/80 rounded-xl',
    raised: 'bg-white border border-slate-200 rounded-xl shadow-sm',
    accent: 'bg-white border border-emerald-200/90 rounded-xl shadow-xs',
    highlight: 'bg-white border border-slate-200 rounded-xl shadow-xs',
    live: 'bg-white border border-emerald-300 rounded-xl shadow-xs',
  }

  return (
    <div
      className={clsx(
        variants[variant] || variants.default,
        hover && 'transition-all duration-150 hover:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/* ─── Badge ────────────────────────────────────────────────── */
const badgeStyles = {
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  victory: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
  live:    'bg-amber-50 text-amber-800 border border-amber-200/80',
  error:   'bg-red-50 text-red-700 border border-red-200/80',
  defeat:  'bg-red-50 text-red-700 border border-red-200/80',
  info:    'bg-blue-50 text-blue-700 border border-blue-200/80',
  pending: 'bg-blue-50 text-blue-700 border border-blue-200/80',
  purple:  'bg-purple-50 text-purple-700 border border-purple-200/80',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200/90',
  dark:    'bg-slate-900 text-white border border-slate-800',
  arena:   'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  torch:   'bg-amber-50 text-amber-800 border border-amber-200/80',
  cricket: 'bg-emerald-600 text-white font-medium',
}

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  size = 'md',
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-xs px-3 py-1 font-semibold',
  }

  const dotColors = {
    success: 'bg-emerald-500',
    victory: 'bg-emerald-500',
    completed: 'bg-emerald-500',
    warning: 'bg-amber-500',
    live:    'bg-amber-500',
    error:   'bg-red-500',
    defeat:  'bg-red-500',
    info:    'bg-blue-500',
    pending: 'bg-blue-500',
    purple:  'bg-purple-500',
    neutral: 'bg-slate-400',
    dark:    'bg-emerald-400',
    arena:   'bg-emerald-500',
    torch:   'bg-amber-500',
    cricket: 'bg-white',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-medium leading-none tracking-normal select-none',
        badgeStyles[variant] || badgeStyles.neutral,
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            dotColors[variant] || 'bg-slate-400'
          )}
        />
      )}
      {children}
    </span>
  )
}

/* ─── Button ───────────────────────────────────────────────── */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    className,
    disabled = false,
    ...props
  },
  ref
) {
  const variants = {
    primary:
      'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs font-semibold focus:ring-2 focus:ring-emerald-600/30',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium shadow-xs focus:ring-2 focus:ring-slate-300',
    outline:
      'bg-transparent hover:bg-emerald-50/70 text-emerald-800 border border-emerald-300 font-semibold focus:ring-2 focus:ring-emerald-600/20',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-xs font-semibold focus:ring-2 focus:ring-red-600/30',
    soft:
      'bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-medium',
  }

  const sizes = {
    xs: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
  }

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
  }

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size]} className="shrink-0" />}
      {children}
      {IconRight && <IconRight size={iconSizes[size]} className="shrink-0" />}
    </button>
  )
})

/* ─── Simplified & Clean KPI Stat Card ─────────────────────── */
export function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  className,
}) {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200/90 rounded-xl p-4.5 shadow-xs flex flex-col justify-between transition-all duration-150 hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
            <Icon size={16} />
          </div>
        )}
      </div>

      <div className="mt-1">
        <p className="font-score text-2xl font-bold text-slate-900 tracking-tight leading-none">{value}</p>
        {helper && (
          <p className="text-xs text-slate-500 mt-2 font-medium truncate">{helper}</p>
        )}
      </div>
    </div>
  )
}

/* ─── Section Header ───────────────────────────────────────── */
export function SectionHeader({
  title,
  subtitle,
  tag,
  action,
  className,
}) {
  return (
    <div className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5', className)}>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
          {tag && (
            <Badge variant="neutral" size="sm">
              {tag}
            </Badge>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ─── Avatar ───────────────────────────────────────────────── */
export function Avatar({ name, initials, size = 'md', className, color = 'bg-slate-700' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs font-semibold',
    md: 'w-9 h-9 text-xs font-bold',
    lg: 'w-11 h-11 text-sm font-bold',
    xl: 'w-14 h-14 text-base font-bold',
  }

  const computedInitials =
    initials ||
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'TH'

  return (
    <div
      className={clsx(
        sizes[size],
        color,
        'rounded-lg flex items-center justify-center font-sans text-white shrink-0 shadow-xs ring-1 ring-black/5 select-none',
        className
      )}
      title={name}
    >
      {computedInitials}
    </div>
  )
}

/* ─── Progress Bar ─────────────────────────────────────────── */
export function ProgressBar({
  value,
  max = 100,
  color = 'emerald',
  height = 'h-2',
  className,
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const colorMap = {
    emerald: 'bg-emerald-600',
    arena:   'bg-emerald-600',
    indigo:  'bg-indigo-600',
    blue:    'bg-blue-600',
    pending: 'bg-blue-600',
    amber:   'bg-amber-500',
    torch:   'bg-amber-500',
    red:     'bg-red-500',
    defeat:  'bg-red-500',
    slate:   'bg-slate-700',
  }

  return (
    <div className={clsx('w-full bg-slate-100 rounded-full overflow-hidden', height, className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-300', colorMap[color] || 'bg-emerald-600')}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

/* ─── Input Field ──────────────────────────────────────────── */
export const Input = forwardRef(function Input(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 rounded-lg focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-xs',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  )
})

/* ─── Tooltip ──────────────────────────────────────────────── */
export function Tooltip({ children, text }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-850 text-white text-[11px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-850" />
      </div>
    </div>
  )
}

/* ─── Divider ──────────────────────────────────────────────── */
export function Divider({ className }) {
  return <hr className={clsx('border-0 border-t border-slate-200/80 my-4', className)} />
}

/* ─── Empty State ──────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white border border-slate-200/80 rounded-xl">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-3 text-slate-500">
          <Icon size={20} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-3.5 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
