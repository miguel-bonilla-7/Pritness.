import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react'
import { Camera, Loader2, Flame } from 'lucide-react'
import { useUser } from './UserContext'
import { useDailyLog } from './DailyLogContext'
import { analyzeImageSmart, type MealAnalysisResult, type WODAnalysisResult } from '../lib/api'
import { insertWod } from '../lib/supabase'
import { Modal } from '../components/Modal'

type CameraResult = { type: 'meal'; data: MealAnalysisResult } | { type: 'wod'; data: WODAnalysisResult }

interface CameraContextValue {
  triggerCamera: () => void
}

const CameraContext = createContext<CameraContextValue | null>(null)

export function CameraProvider({ children }: { children: ReactNode }) {
  const { profile } = useUser()
  const { addMeal, setBurned, addWod } = useDailyLog()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<CameraResult | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const triggerCamera = useCallback(() => {
    setError('')
    setResult(null)
    inputRef.current?.click()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setResult(null)
    setModalOpen(true)
    setLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = reject
        r.readAsDataURL(file)
      })
      const analysis = await analyzeImageSmart(dataUrl)
      if (analysis.type === 'food') {
        setResult({ type: 'meal', data: analysis.meal })
      } else {
        setResult({ type: 'wod', data: analysis.wod })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar la imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = useCallback(() => {
    if (result?.type !== 'meal') return
    addMeal(Math.round(result.data.calories), Math.round(result.data.protein || 0))
    setResult(null)
    setModalOpen(false)
  }, [result, addMeal])

  const handleAddWOD = useCallback(() => {
    if (result?.type !== 'wod') return
    const { data } = result
    setBurned((prev) => prev + data.estimatedCaloriesBurned)
    addWod({
      description: data.description,
      exercises: data.exercises ?? [],
      estimatedCaloriesBurned: data.estimatedCaloriesBurned,
    })
    if (profile?.id) {
      const today = new Date().toISOString().slice(0, 10)
      insertWod(profile.id, {
        date: today,
        description: data.description,
        calories_burned: data.estimatedCaloriesBurned,
        source: 'photo',
      })
    }
    setResult(null)
    setModalOpen(false)
  }, [result, setBurned, addWod, profile?.id])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setResult(null)
    setError('')
  }, [])

  return (
    <CameraContext.Provider value={{ triggerCamera }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden
      />
      {children}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={loading ? 'Analizando...' : result ? (result.type === 'meal' ? 'Comida detectada' : 'Entrenamiento detectado') : error ? 'Error' : 'Cámara'}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
            <p className="text-sm">La IA está analizando la foto...</p>
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              type="button"
              onClick={triggerCamera}
              className="w-full rounded-xl py-3 bg-white/10 text-white font-medium flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Tomar otra foto
            </button>
          </div>
        )}

        {!loading && result?.type === 'meal' && (
          <div className="space-y-4">
            {result.data.description && (
              <p className="text-sm text-gray-400">{result.data.description}</p>
            )}
            <div className="flex gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(result.data.calories)}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(result.data.protein || 0)}</p>
                <p className="text-xs text-gray-400">proteína (g)</p>
              </div>
            </div>
            {result.data.items?.length > 0 && (
              <ul className="text-sm text-gray-400 space-y-1">
                {result.data.items.slice(0, 5).map((item, i) => (
                  <li key={i}>{item.name}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={handleAddMeal}
              className="w-full rounded-xl py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold"
            >
              Añadir al día
            </button>
            <button
              type="button"
              onClick={triggerCamera}
              className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-white"
            >
              Otra foto
            </button>
          </div>
        )}

        {!loading && result?.type === 'wod' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">{result.data.description}</p>
            {result.data.exercises?.length > 0 && (
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-0.5">
                {result.data.exercises.slice(0, 5).map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-xl font-bold text-white">~{result.data.estimatedCaloriesBurned} kcal</span>
            </div>
            <button
              type="button"
              onClick={handleAddWOD}
              className="w-full rounded-xl py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold"
            >
              Añadir a calorías quemadas
            </button>
            <button
              type="button"
              onClick={triggerCamera}
              className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-white"
            >
              Otra foto
            </button>
          </div>
        )}
      </Modal>
    </CameraContext.Provider>
  )
}

export function useCamera() {
  const ctx = useContext(CameraContext)
  if (!ctx) throw new Error('useCamera must be used within CameraProvider')
  return ctx
}
