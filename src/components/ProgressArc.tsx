import { motion } from 'framer-motion'

interface ProgressArcProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  centerValue: string
  centerLabel: string
  leftLabel?: string
  rightLabel?: string
}

export function ProgressArc({
  value,
  max,
  size = 220,
  strokeWidth = 14,
  className = '',
  centerValue,
  centerLabel,
  leftLabel,
  rightLabel,
}: ProgressArcProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const radius = size / 2 - strokeWidth
  const halfCircleLength = Math.PI * radius
  const offset = halfCircleLength - (pct / 100) * halfCircleLength
  const arcY = radius + strokeWidth
  const svgHeight = radius + strokeWidth * 2

  return (
    <div className={`flex flex-col items-center w-full max-w-[280px] ${className}`}>
      {/* SVG + overlaid number inside the arc dome */}
      <div className="relative w-full flex justify-center" style={{ height: svgHeight }}>
        <svg
          width={size}
          height={svgHeight}
          viewBox={`0 0 ${size} ${svgHeight}`}
          className="overflow-visible shrink-0 block"
          aria-hidden
        >
          {/* Track */}
          <path
            d={`M ${strokeWidth} ${arcY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${arcY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/[0.07]"
          />

          {/* Progress */}
          <motion.path
            d={`M ${strokeWidth} ${arcY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${arcY}`}
            fill="none"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={halfCircleLength}
            initial={{ strokeDashoffset: halfCircleLength }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </svg>

        {/* Number + label floating inside the dome */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
          <p className="text-5xl font-black text-white tabular-nums leading-none tracking-tighter">
            {centerValue}
          </p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest py-2">{centerLabel}</p>
        </div>
      </div>

      {(leftLabel != null || rightLabel != null) && (
        <div className="flex justify-between w-full mt-2 px-1">
          <span className="text-[11px] text-gray-500">{leftLabel ?? ''}</span>
          <span className="text-[11px] text-gray-500">{rightLabel ?? ''}</span>
        </div>
      )}
    </div>
  )
}
