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
  const { addMealEntry } = useDailyLog()
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
      const carbs = Math.round(resultado.carbs || 0)
      const fat = Math.round(resultado.fat || 0)
      const mealType = getMealType()
      const today = new Date().toISOString().slice(0, 10)
      let mealId = `meal-${Date.now()}`
      if (profile?.id) {
        const { error } = await insertMeal(profile.id, {
          meal_type: mealType,
          name: resultado.description || 'Comida',
          calories: cal,
          protein: prot,
          carbs,
          fat,
          source: 'ai_vision',
        })
        if (!error) {
          // fetch the new id from DB — use timestamp as fallback
        }
      }
      addMealEntry({
        id: mealId,
        name: resultado.description || 'Comida',
        calories: cal,
        protein: prot,
        carbs,
        fat,
        meal_type: mealType,
        date: today,
        userInput: texto.trim(),
        items: resultado.items?.map(item => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: (item as { carbs?: number }).carbs,
          fat: (item as { fat?: number }).fat,
          portion: (item as { portion?: string }).portion,
        })),
      })
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
    <Modal open={open} onClose={handleCerrar} title="Registrar comida">
      <div className="space-y-3">
        <form onSubmit={handleAnalizar} className="space-y-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="¿Qué comiste?"
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20 min-h-[80px] resize-none"
            rows={3}
            disabled={cargando}
          />
          <button
            type="submit"
            disabled={cargando || !texto.trim()}
            className="w-full rounded-xl py-2.5 border border-white/10 bg-white/[0.04] text-xs font-medium text-white/70 flex items-center justify-center gap-1.5 disabled:opacity-30 active:bg-white/[0.08] transition-colors"
          >
            {cargando ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analizando...</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" />Analizar con IA</>
            )}
          </button>
        </form>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        {resultado && (
          <div className="space-y-3 pt-1">
            <p className="text-[11px] text-gray-500">{resultado.description}</p>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-light text-white tabular-nums">{Math.round(resultado.calories || 0)}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">kcal</p>
              </div>
              <div>
                <p className="text-2xl font-light text-white tabular-nums">{Math.round(resultado.protein || 0)}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">proteína g</p>
              </div>
            </div>
            {resultado.items && resultado.items.length > 0 && (
              <ul className="space-y-0.5">
                {resultado.items.map((item, i) => (
                  <li key={i} className="text-[11px] text-gray-500">
                    {item.name} · {item.calories} kcal · {item.protein}g prot
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={handleAñadirAMisDatos}
              disabled={guardando}
              className="w-full rounded-xl py-2.5 border border-white/10 bg-white/[0.04] text-xs font-medium text-white/80 disabled:opacity-30 active:bg-white/[0.08] transition-colors"
            >
              {guardando ? 'Guardando...' : 'Añadir'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}
