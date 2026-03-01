import { useState } from 'react'
import {
  Loader2, Dumbbell, Flame, Zap, Activity, Waves,
  Bike, Wind, HeartPulse, Footprints, Timer, Mountain,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDailyLog } from '../context/DailyLogContext'
import { useUser } from '../context/UserContext'
import { analyzeWOD } from '../lib/api'
import { SwipeToDelete } from '../components/SwipeToDelete'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const isToday = dateStr === today.toISOString().slice(0, 10)
  if (isToday) return 'Hoy'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Exercise category detection ──────────────────────────────────────────────
type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

interface WodVisual {
  gradient: [string, string]
  Icon: LucideIcon
  label: string
}

const WOD_CATEGORIES: { keywords: string[]; visual: WodVisual }[] = [
  {
    keywords: ['run', 'sprint', '400m', '800m', '1k', '5k', 'corr', 'metros', 'meter'],
    visual: { gradient: ['#f97316', '#ef4444'], Icon: Footprints, label: 'Cardio' },
  },
  {
    keywords: ['bike', 'cicl', 'cycling', 'bicicleta'],
    visual: { gradient: ['#22c55e', '#14b8a6'], Icon: Bike, label: 'Ciclismo' },
  },
  {
    keywords: ['swim', 'nadar', 'nado', 'pool', 'lap'],
    visual: { gradient: ['#3b82f6', '#06b6d4'], Icon: Waves, label: 'Natación' },
  },
  {
    keywords: ['row', 'remo', 'erg', 'rowing'],
    visual: { gradient: ['#06b6d4', '#3b82f6'], Icon: Activity, label: 'Remo' },
  },
  {
    keywords: ['pull', 'push', 'ring', 'rope', 'handstand', 'muscle', 'toes', 'bar', 'calisthenic', 'gymnastic'],
    visual: { gradient: ['#a855f7', '#7c3aed'], Icon: Zap, label: 'Calistenia' },
  },
  {
    keywords: ['deadlift', 'squat', 'press', 'snatch', 'clean', 'jerk', 'bench', 'peso', 'barbell', 'kg', 'lb', 'lift'],
    visual: { gradient: ['#ef4444', '#a855f7'], Icon: Dumbbell, label: 'Levantamiento' },
  },
  {
    keywords: ['hiit', 'interval', 'tabata', 'amrap', 'emom', 'wod', 'crossfit', 'circuit', 'round'],
    visual: { gradient: ['#f97316', '#a855f7'], Icon: Flame, label: 'HIIT' },
  },
  {
    keywords: ['hike', 'trail', 'mountain', 'cerro', 'senderismo', 'treking'],
    visual: { gradient: ['#84cc16', '#22c55e'], Icon: Mountain, label: 'Senderismo' },
  },
  {
    keywords: ['yoga', 'stretch', 'pilates', 'flex', 'mobility'],
    visual: { gradient: ['#c084fc', '#ec4899'], Icon: HeartPulse, label: 'Movilidad' },
  },
  {
    keywords: ['walk', 'caminar', 'caminata'],
    visual: { gradient: ['#f59e0b', '#f97316'], Icon: Wind, label: 'Caminata' },
  },
]

const DEFAULT_VISUAL: WodVisual = {
  gradient: ['#f97316', '#7c3aed'],
  Icon: Timer,
  label: 'Entrenamiento',
}

function getWodVisual(description: string, exercises: string[]): WodVisual {
  const text = [description, ...(exercises ?? [])].join(' ').toLowerCase()
  for (const { keywords, visual } of WOD_CATEGORIES) {
    if (keywords.some((kw) => text.includes(kw))) return visual
  }
  return DEFAULT_VISUAL
}

interface WodAddBlockProps {
  wodInput: string
  setWodInput: (v: string) => void
  loading: boolean
  setLoading: (v: boolean) => void
  error: string
  setError: (v: string) => void
  lastResult: { description: string; exercises: string[]; estimatedCaloriesBurned: number } | null
  setLastResult: (v: { description: string; exercises: string[]; estimatedCaloriesBurned: number } | null) => void
  onAddWod: (entry: { description: string; exercises: string[]; estimatedCaloriesBurned: number }) => void
  onSetBurned: (fn: (prev: number) => number) => void
  userWeightKg?: number
}

function WodAddBlock({
  wodInput,
  setWodInput,
  loading,
  setLoading,
  error,
  setError,
  lastResult,
  setLastResult,
  onAddWod,
  onSetBurned,
  userWeightKg,
}: WodAddBlockProps) {
  const handleAnalyze = async () => {
    if (!wodInput.trim()) return
    setError('')
    setLastResult(null)
    setLoading(true)
    try {
      const result = await analyzeWOD(wodInput.trim(), userWeightKg)
      setLastResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar el WOD')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToLog = () => {
    if (!lastResult) return
    onSetBurned((prev) => prev + lastResult.estimatedCaloriesBurned)
    onAddWod(lastResult)
    setLastResult(null)
    setWodInput('')
  }

  return (
    <div className="space-y-3">
      <textarea
        value={wodInput}
        onChange={(e) => setWodInput(e.target.value)}
        placeholder="Describe tu entrenamiento..."
        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 min-h-[80px] resize-none"
        rows={3}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !wodInput.trim()}
          className="flex-1 rounded-xl py-2.5 border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-white/70 disabled:opacity-30 flex items-center justify-center gap-1.5 active:bg-white/[0.08] transition-colors"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Analizar
        </button>
        {lastResult && (
          <button
            type="button"
            onClick={handleAddToLog}
            className="flex-1 rounded-xl py-2.5 border border-white/[0.08] bg-white/[0.04] text-xs font-medium text-white/70 active:bg-white/[0.08] transition-colors"
          >
            + {lastResult.estimatedCaloriesBurned} kcal quemadas
          </button>
        )}
      </div>
      {lastResult && (
        <div className="pt-2 space-y-1">
          <p className="text-xs text-gray-400">{lastResult.description}</p>
          {lastResult.exercises?.length > 0 && (
            <ul className="space-y-0.5">
              {lastResult.exercises.slice(0, 4).map((ex, i) => (
                <li key={i} className="text-[11px] text-gray-500">· {ex}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}

export function WODsPage() {
  const { profile } = useUser()
  const { wods, setBurned, addWod, removeWod } = useDailyLog()
  const [wodInput, setWodInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<{ description: string; exercises: string[]; estimatedCaloriesBurned: number } | null>(null)

  const addBlock = (
    <WodAddBlock
      wodInput={wodInput} setWodInput={setWodInput}
      loading={loading} setLoading={setLoading}
      error={error} setError={setError}
      lastResult={lastResult} setLastResult={setLastResult}
      onAddWod={addWod} onSetBurned={(fn) => setBurned(fn)}
      userWeightKg={profile?.weight}
    />
  )

  if (wods.length === 0) {
    return (
      <div className="p-5 space-y-6 overflow-auto min-h-0 overscroll-contain">
        <p className="text-sm font-medium text-white">Entrenamiento</p>
        {addBlock}
        <p className="text-[11px] text-gray-600 text-center">Describe lo que hiciste y la IA estimará las calorías quemadas.</p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-6 overflow-auto min-h-0 overscroll-contain">
      <p className="text-sm font-medium text-white">Entrenamiento</p>
      {addBlock}

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between px-0.5">
          <p className="text-[10px] text-white/25 uppercase tracking-widest">desliza para eliminar</p>
        </div>
        <AnimatePresence initial={false}>
          {wods.map((wod) => {
            const { gradient, Icon, label } = getWodVisual(wod.description, wod.exercises)
            return (
              <motion.div
                key={wod.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SwipeToDelete onDelete={() => removeWod(wod.id)}>
                  <div className="rounded-2xl overflow-hidden" style={{ background: '#16161f' }}>
                    {/* Color strip with icon */}
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ background: `linear-gradient(135deg, ${gradient[0]}22 0%, ${gradient[1]}11 100%)`,
                               borderBottom: `1px solid ${gradient[0]}22` }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                      >
                        <Icon size={18} color="white" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">{label}</p>
                        <p className="text-[10px] text-white/40">{formatDate(wod.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-light text-white tabular-nums">{wod.estimatedCaloriesBurned}</p>
                        <p className="text-[9px] uppercase tracking-widest" style={{ color: gradient[0] }}>kcal</p>
                      </div>
                    </div>
                    {/* Description + exercises */}
                    <div className="px-4 py-3 space-y-1.5">
                      <p className="text-xs text-white/60 leading-snug">{wod.description}</p>
                      {wod.exercises?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {wod.exercises.slice(0, 5).map((ex, j) => (
                            <span key={j} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: `${gradient[0]}18`, color: gradient[0] }}>
                              {ex}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </SwipeToDelete>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
