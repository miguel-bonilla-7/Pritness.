import { motion } from 'framer-motion'

export type ProgressBarType = 'calories' | 'carbs' | 'fats' | 'protein' | 'water'

const gradientClasses: Record<ProgressBarType, string> = {
  calories: 'from-orange-500 to-yellow-500',
  carbs: 'from-pink-500 to-red-500',
  fats: 'from-yellow-500 to-orange-500',
  protein: 'from-blue-400 to-blue-800',
  water: 'from-slate-400 to-slate-600',
}

interface ProgressBarProps {
  value: number
  max: number
  type?: ProgressBarType
  className?: string
  showLabel?: boolean
}

export function ProgressBar({
  value,
  max,
  type = 'calories',
  className = '',
  showLabel = false,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div className={className}>
      <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradientClasses[type]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-400 mt-1">
          {value} / {max}
        </p>
      )}
    </div>
  )
}
