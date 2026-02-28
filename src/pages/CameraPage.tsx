import { useState, useRef } from 'react'
import { Camera, UtensilsCrossed, Dumbbell, Loader2 } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useDailyLog } from '../context/DailyLogContext'
import { Card } from '../components/Card'
import { analyzeMealImage, analyzeWOD, type MealAnalysisResult, type WODAnalysisResult } from '../lib/api'
import { insertWod } from '../lib/supabase'

type Tab = 'meal' | 'wod'

export function CameraPage() {
  const { profile } = useUser()
  const { addMeal, setBurned, addWod } = useDailyLog()
  const [tab, setTab] = useState<Tab>('meal')
  const [mealResult, setMealResult] = useState<MealAnalysisResult | null>(null)
  const [wodResult, setWodResult] = useState<WODAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wodInput, setWodInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setMealResult(null)
    setLoading(true)
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = reject
        r.readAsDataURL(file)
      })
      const result = await analyzeMealImage(dataUrl)
      setMealResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar la imagen')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  const handleAddMealToLog = () => {
    if (mealResult) {
      addMeal(Math.round(mealResult.calories), Math.round(mealResult.protein || 0))
      setMealResult(null)
    }
  }

  const handleAnalyzeWOD = async () => {
    if (!wodInput.trim()) return
    setError('')
    setWodResult(null)
    setLoading(true)
    try {
      const result = await analyzeWOD(wodInput.trim(), profile?.weight)
      setWodResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar el WOD')
    } finally {
      setLoading(false)
    }
  }

  const handleAddWODCalories = () => {
    if (wodResult) {
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
          source: 'text',
        })
      }
      setWodResult(null)
      setWodInput('')
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex rounded-2xl bg-white/5 p-1">
        <button
          type="button"
          onClick={() => setTab('meal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'meal' ? 'bg-card text-white shadow-card-glow' : 'text-gray-400'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Comida
        </button>
        <button
          type="button"
          onClick={() => setTab('wod')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            tab === 'wod' ? 'bg-card text-white shadow-card-glow' : 'text-gray-400'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          WOD
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {tab === 'meal' && (
        <>
          <Card>
            <p className="text-sm text-gray-400 mb-3">Sube una foto de tu plato para estimar calorías y proteínas.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full rounded-xl py-4 border-2 border-dashed border-white/20 text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
              {loading ? 'Analizando...' : 'Elegir foto'}
            </button>
          </Card>

          {mealResult && (
            <Card>
              <h3 className="font-bold text-white mb-3">Resumen de la comida</h3>
              {mealResult.description && (
                <p className="text-sm text-gray-400 mb-3">{mealResult.description}</p>
              )}
              <div className="flex gap-4 mb-3">
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(mealResult.calories)}</p>
                  <p className="text-xs text-gray-400">kcal</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(mealResult.protein)}</p>
                  <p className="text-xs text-gray-400">proteína (g)</p>
                </div>
              </div>
              {mealResult.items && mealResult.items.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {mealResult.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-gray-500">{item.calories} kcal · {item.protein}g prot</span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={handleAddMealToLog}
                className="w-full rounded-xl py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold"
              >
                Añadir al día
              </button>
            </Card>
          )}
        </>
      )}

      {tab === 'wod' && (
        <>
          <Card>
            <p className="text-sm text-gray-400 mb-3">Describe tu rutina (pizarra del gym, texto o lo que hiciste).</p>
            <textarea
              value={wodInput}
              onChange={(e) => setWodInput(e.target.value)}
              placeholder="Ej: 5 rounds: 10 pull-ups, 20 push-ups, 30 air squats. 400m run."
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px] resize-y"
              rows={4}
            />
            <button
              type="button"
              onClick={handleAnalyzeWOD}
              disabled={loading || !wodInput.trim()}
              className="mt-3 w-full rounded-xl py-2.5 bg-white/10 text-white font-medium hover:bg-white/15 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Dumbbell className="w-4 h-4" />}
              Analizar WOD
            </button>
          </Card>

          {wodResult && (
            <Card>
              <h3 className="font-bold text-white mb-2">{wodResult.description}</h3>
              {wodResult.exercises?.length > 0 && (
                <ul className="text-sm text-gray-400 mb-3 list-disc list-inside">
                  {wodResult.exercises.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              )}
              <p className="text-xl font-bold text-white mb-3">
                ~{wodResult.estimatedCaloriesBurned} kcal quemadas
              </p>
              <button
                type="button"
                onClick={handleAddWODCalories}
                className="w-full rounded-xl py-2.5 bg-white/10 text-gray-200 font-medium hover:bg-white/15"
              >
                Añadir a calorías quemadas
              </button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
