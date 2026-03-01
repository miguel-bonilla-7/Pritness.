import { motion } from 'framer-motion'
import { useId } from 'react'

type RingColor = 'orange' | 'redorange' | 'purple'

const GRADIENTS: Record<RingColor, [string, string]> = {
  orange:    ['#f97316', '#fb923c'],
  redorange: ['#ea580c', '#f97316'],
  purple:    ['#a855f7', '#c084fc'],
}

const GLOW_COLORS: Record<RingColor, string> = {
  orange:    'rgba(249,115,22,0.25)',
  redorange: 'rgba(234,88,12,0.25)',
  purple:    'rgba(168,85,247,0.25)',
}

interface MiniProgressRingProps {
  value: number
  max: number
  label: string
  color: RingColor
  unit?: string
  subtitle?: string
  size?: number
  className?: string
}

export function MiniProgressRing({
  value,
  max,
  label,
  color,
  unit = '',
  subtitle,
  size = 80,
  className = '',
}: MiniProgressRingProps) {
  const id = useId().replace(/:/g, '')
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const strokeWidth = Math.max(5, Math.round(size * 0.09))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (pct / 100) * circumference
  const [c1, c2] = GRADIENTS[color]
  const glowColor = GLOW_COLORS[color]

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Ring */}
      <div
        className="relative rounded-full"
        style={{ width: size, height: size, boxShadow: `0 0 18px 2px ${glowColor}` }}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <defs>
            <linearGradient id={`miniRing-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/[0.06]"
          />
          {/* Progress */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#miniRing-${id})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold text-white tabular-nums leading-none"
            style={{ fontSize: Math.max(10, Math.round(size * 0.19)) }}
          >
            {Math.round(value)}{unit}
          </span>
        </div>
      </div>

      {/* Label + subtitle */}
      <div className="text-center">
        <p className="text-[11px] font-semibold text-gray-300 leading-tight">{label}</p>
        {subtitle && (
          <p className="text-[10px] text-gray-600 leading-tight mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
