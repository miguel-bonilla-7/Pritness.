import { useState, useRef, useEffect } from 'react'
import { Camera, Loader2, Flame } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useDailyLog } from '../context/DailyLogContext'
import { Card } from '../components/Card'
import { analyzeImageSmart, type MealAnalysisResult, type WODAnalysisResult } from '../lib/api'
import { insertWod } from '../lib/supabase'

export function CameraPage() {
  const { profile } = useUser()
  const { addMeal, setBurned, addWod } = useDailyLog()
  const [mealResult, setMealResult] = useState<MealAnalysisResult | null>(null)
  const [wodResult, setWodResult] = useState<WODAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const openCamera = () => cameraInputRef.current?.click()

  useEffect(() => {
    const t = setTimeout(openCamera, 200)
    return () => clearTimeout(t)
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setMealResult(null)
    setWodResult(null)
    setLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = reject
        r.readAsDataURL(file)
      })
      const result = await analyzeImageSmart(dataUrl)
      if (result.type === 'food') {
        setMealResult(result.meal)
      } else {
        setWodResult(result.wod)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar la imagen')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMeal = () => {
    if (!mealResult) return
    addMeal(Math.round(mealResult.calories), Math.round(mealResult.protein || 0))
    setMealResult(null)
  }

  const handleAddWOD = () => {
    if (!wodResult) return
    setBurned((prev) => prev + wodResult.estimatedCaloriesBurned)
    addWod({
      description: wodResult.description,
      exercises: wodResult.exercises ?? [],
      estimatedCaloriesBurned: wodResult.estimatedCaloriesBurned,
    })
    if (profile?.id) {
      const today = new Date().toISOString().slice(0, 10)
      insertWod(profile.id, {
        date: today,
        description: wodResult.description,
        calories_burned: wodResult.estimatedCaloriesBurned,
        source: 'photo',
      })
    }
    setWodResult(null)
  }

  return (
    <div className="p-4 overflow-auto min-h-0 flex flex-col items-center justify-center">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {loading && (
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
          <p className="text-sm">Analizando foto...</p>
        </div>
      )}

      {!loading && error && (
        <Card className="w-full max-w-sm">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={openCamera}
            className="w-full rounded-xl py-3 bg-white/10 text-white font-medium flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Abrir cámara
          </button>
        </Card>
      )}

      {!loading && mealResult && (
        <Card className="w-full max-w-sm space-y-4">
          <h3 className="font-bold text-white">Comida detectada</h3>
          {mealResult.description && (
            <p className="text-sm text-gray-400">{mealResult.description}</p>
          )}
          <div className="flex gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{Math.round(mealResult.calories)}</p>
              <p className="text-xs text-gray-400">kcal</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{Math.round(mealResult.protein || 0)}</p>
              <p className="text-xs text-gray-400">proteína (g)</p>
            </div>
          </div>
          {mealResult.items?.length > 0 && (
            <ul className="text-sm text-gray-400 space-y-1">
              {mealResult.items.slice(0, 5).map((item, i) => (
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
            onClick={openCamera}
            className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-white"
          >
            Otra foto
          </button>
        </Card>
      )}

      {!loading && wodResult && (
        <Card className="w-full max-w-sm space-y-4">
          <h3 className="font-bold text-white">Entrenamiento detectado</h3>
          <p className="text-sm text-gray-400">{wodResult.description}</p>
          {wodResult.exercises?.length > 0 && (
            <ul className="text-sm text-gray-400 list-disc list-inside space-y-0.5">
              {wodResult.exercises.slice(0, 5).map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xl font-bold text-white">~{wodResult.estimatedCaloriesBurned} kcal</span>
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
            onClick={openCamera}
            className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-white"
          >
            Otra foto
          </button>
        </Card>
      )}

      {!loading && !error && !mealResult && !wodResult && (
        <button
          type="button"
          onClick={openCamera}
          className="rounded-xl py-4 px-8 border-2 border-dashed border-white/20 text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
        >
          <Camera className="w-8 h-8" />
          <span className="font-medium">Abrir cámara</span>
        </button>
      )}
    </div>
  )
}
