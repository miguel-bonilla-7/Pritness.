import { useState } from 'react'
import { Dumbbell, Flame, Loader2, PlusCircle } from 'lucide-react'
import { Card } from '../components/Card'
import { useDailyLog } from '../context/DailyLogContext'
import { useUser } from '../context/UserContext'
import { analyzeWOD } from '../lib/api'
import { insertWod } from '../lib/supabase'

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
  profileId?: string
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
  profileId,
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
    if (profileId) {
      const today = new Date().toISOString().slice(0, 10)
      insertWod(profileId, {
        date: today,
        description: lastResult.description,
        calories_burned: lastResult.estimatedCaloriesBurned,
        source: 'text',
      })
    }
    setLastResult(null)
    setWodInput('')
  }

  return (
    <Card>
      <h3 className="font-medium text-white mb-2 flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-orange-400" />
        Añadir WOD aquí
      </h3>
      <p className="text-sm text-gray-400 mb-3">Describe tu rutina (pizarra del gym, texto o lo que hiciste).</p>
      <textarea
        value={wodInput}
        onChange={(e) => setWodInput(e.target.value)}
        placeholder="Ej: 5 rounds: 10 pull-ups, 20 push-ups, 30 air squats. 400m run."
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px] resize-y text-sm"
        rows={3}
      />
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loading || !wodInput.trim()}
          className="flex-1 rounded-xl py-2.5 bg-white/10 text-white font-medium hover:bg-white/15 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
          Analizar WOD
        </button>
        {lastResult && (
          <button
            type="button"
            onClick={handleAddToLog}
            className="flex-1 rounded-xl py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold text-sm"
          >
            Añadir ~{lastResult.estimatedCaloriesBurned} kcal
          </button>
        )}
      </div>
      {lastResult && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-sm font-medium text-white">{lastResult.description}</p>
          {lastResult.exercises?.length > 0 && (
            <ul className="text-xs text-gray-400 mt-1 list-disc list-inside">
              {lastResult.exercises.slice(0, 4).map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </Card>
  )
}

export function WODsPage() {
  const { profile } = useUser()
  const { wods, setBurned, addWod } = useDailyLog()
  const [wodInput, setWodInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastResult, setLastResult] = useState<{ description: string; exercises: string[]; estimatedCaloriesBurned: number } | null>(null)

  if (wods.length === 0) {
    return (
      <div className="p-4 space-y-4 overflow-auto min-h-0">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-orange-400" />
          WODs
        </h2>
        <Card>
          <p className="text-gray-400 text-center py-6">
            Aún no has registrado ningún WOD. Regístralo aquí abajo o ve a <strong>Cámara</strong> y sube una foto / describe tu entrenamiento.
          </p>
        </Card>
        <WodAddBlock
          wodInput={wodInput}
          setWodInput={setWodInput}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          lastResult={lastResult}
          setLastResult={setLastResult}
          onAddWod={addWod}
          onSetBurned={(fn) => setBurned(fn)}
          profileId={profile?.id}
          userWeightKg={profile?.weight}
        />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-auto min-h-0">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Dumbbell className="w-6 h-6 text-orange-400" />
        Registro de WODs
      </h2>
      <p className="text-sm text-gray-400">Registra un WOD aquí o revisa los que ya guardaste.</p>

      <WodAddBlock
        wodInput={wodInput}
        setWodInput={setWodInput}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
        lastResult={lastResult}
        setLastResult={setLastResult}
        onAddWod={addWod}
        onSetBurned={(fn) => setBurned(fn)}
        profileId={profile?.id}
        userWeightKg={profile?.weight}
      />

      <ul className="space-y-3">
        {wods.map((wod) => (
          <li key={wod.id}>
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{formatDate(wod.date)}</p>
                  <p className="font-medium text-white mt-0.5">{wod.description}</p>
                  {wod.exercises && wod.exercises.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-400 list-disc list-inside space-y-0.5">
                      {wod.exercises.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold text-white">{wod.estimatedCaloriesBurned}</span>
                  <span className="text-xs text-gray-400">kcal</span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
