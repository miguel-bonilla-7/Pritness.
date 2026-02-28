import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Modal } from './Modal'
import { useDailyLog } from '../context/DailyLogContext'
import { useUser } from '../context/UserContext'
import { analyzeMealFromText, type MealAnalysisResult } from '../lib/api'
import { insertMeal } from '../lib/supabase'

interface LogMealModalProps {
  open: boolean
  onClose: () => void
}

function getMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

export function LogMealModal({ open, onClose }: LogMealModalProps) {
  const { addMeal } = useDailyLog()
  const { profile } = useUser()
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<MealAnalysisResult | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleAnalizar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!texto.trim()) return
    setError('')
    setResultado(null)
    setCargando(true)
    try {
      const res = await analyzeMealFromText(texto.trim())
      setResultado(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar. Revisa tu API key.')
    } finally {
      setCargando(false)
    }
  }

  const handleAñadirAMisDatos = async () => {
    if (!resultado) return
    setGuardando(true)
    try {
      const cal = Math.round(resultado.calories || 0)
      const prot = Math.round(resultado.protein || 0)
      addMeal(cal, prot)
      if (profile?.id) {
        const mealType = getMealType()
        await insertMeal(profile.id, {
          meal_type: mealType,
          name: resultado.description || 'Comida',
          calories: cal,
          protein: prot,
          carbs: resultado.carbs,
          fat: resultado.fat,
          source: 'ai_vision',
        })
      }
      setTexto('')
      setResultado(null)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const handleCerrar = () => {
    setTexto('')
    setResultado(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleCerrar} title="Registrar comida con IA">
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Escribe lo que comiste y la IA calculará las calorías y proteínas. Por ejemplo: &quot;Arroz con pollo y ensalada&quot;, &quot;Café con leche y tostada&quot;.
        </p>
        <form onSubmit={handleAnalizar} className="space-y-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="¿Qué comiste? Describe los platos..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px] resize-y"
            rows={3}
            disabled={cargando}
          />
          <button
            type="submit"
            disabled={cargando || !texto.trim()}
            className="w-full rounded-xl py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cargando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analizar con IA
              </>
            )}
          </button>
        </form>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {resultado && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-xs text-gray-400">{resultado.description}</p>
            <div className="flex gap-4">
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(resultado.calories || 0)}</p>
                <p className="text-xs text-gray-400">kcal</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(resultado.protein || 0)}</p>
                <p className="text-xs text-gray-400">proteína (g)</p>
              </div>
            </div>
            {resultado.items && resultado.items.length > 0 && (
              <ul className="text-sm text-gray-400 space-y-1">
                {resultado.items.map((item, i) => (
                  <li key={i}>
                    {item.name}: {item.calories} kcal, {item.protein} g prot
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={handleAñadirAMisDatos}
              disabled={guardando}
              className="w-full rounded-xl py-2.5 bg-white/15 text-white font-medium hover:bg-white/20 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Añadir a mis datos'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
