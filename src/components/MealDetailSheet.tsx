import { useState } from 'react'
import { X, Pencil, Sparkles, Loader2, Fish, Egg, Beef, Leaf, Apple, Coffee, Wheat, GlassWater, Utensils, Flame, Soup, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type MealEntry } from '../context/DailyLogContext'
import { analyzeMealFromText } from '../lib/api'
import { useDailyLog } from '../context/DailyLogContext'
import { insertMeal, deleteMeal } from '../lib/supabase'
import { useUser } from '../context/UserContext'

// ── Food icon mapping ─────────────────────────────────────────────────────────
type IconDef = { icon: React.ReactNode; gradient: [string, string] }

function getMealIconDef(name: string): IconDef {
  const t = name.toLowerCase()
  if (/pescado|atún|salmón|tilapia|trucha|merluza|bacalao|sardina|camarón|mariscos?|langostino/.test(t))
    return { icon: <Fish className="w-5 h-5" />, gradient: ['#3b82f6', '#06b6d4'] }
  if (/huevo|tortilla|revuelto|omelette/.test(t))
    return { icon: <Egg className="w-5 h-5" />, gradient: ['#eab308', '#f97316'] }
  if (/pollo|pechuga|pavo|ave|pato|muslo/.test(t))
    return { icon: <Flame className="w-5 h-5" />, gradient: ['#f97316', '#ef4444'] }
  if (/carne|res|bistec|lomo|cerdo|ternera|hamburguesa|chuleta|costilla/.test(t))
    return { icon: <Beef className="w-5 h-5" />, gradient: ['#ef4444', '#7c3aed'] }
  if (/ensalada|verdura|vegetal|lechuga|espinaca|brócoli|zanahoria|tomate|pepino|aguacate|espárrag/.test(t))
    return { icon: <Leaf className="w-5 h-5" />, gradient: ['#22c55e', '#14b8a6'] }
  if (/fruta|manzana|naranja|banano|mango|fresa|pera|uva|sandía|melón|piña|durazno/.test(t))
    return { icon: <Apple className="w-5 h-5" />, gradient: ['#f97316', '#eab308'] }
  if (/batido|shake|smoothie|proteína|whey|suplemento/.test(t))
    return { icon: <GlassWater className="w-5 h-5" />, gradient: ['#a855f7', '#ec4899'] }
  if (/café|tea|té|bebida caliente|chocolate caliente|capuchino|latte/.test(t))
    return { icon: <Coffee className="w-5 h-5" />, gradient: ['#92400e', '#b45309'] }
  if (/arroz|pasta|pan|avena|cereal|granola|quinoa|arepas?|tortilla de maíz|pasta|fideos|macarrón/.test(t))
    return { icon: <Wheat className="w-5 h-5" />, gradient: ['#eab308', '#84cc16'] }
  if (/sopa|caldo|crema|sancocho|mondongo|menudo|cocido/.test(t))
    return { icon: <Soup className="w-5 h-5" />, gradient: ['#f97316', '#eab308'] }
  return { icon: <Utensils className="w-5 h-5" />, gradient: ['#f97316', '#7c3aed'] }
}

export function getMealIconNode(name: string) {
  return getMealIconDef(name)
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

interface Props {
  meal: MealEntry | null
  onClose: () => void
  onUpdated: (updated: MealEntry) => void
}

function MacroPill({ icon, value, unit, color }: { icon: React.ReactNode; value: number; unit: string; color: string }) {
  return (
    <div className="flex-1 rounded-xl py-2 px-1.5 flex flex-col items-center gap-0.5" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
      <span style={{ color }} className="opacity-90">{icon}</span>
      <p className="text-base font-bold tabular-nums leading-none" style={{ color }}>{value}</p>
      <p className="text-[8px] text-white/40">{unit}</p>
    </div>
  )
}

export function MealDetailSheet({ meal, onClose, onUpdated }: Props) {
  const { profile } = useUser()
  const { updateMeal } = useDailyLog()
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const handleStartEdit = () => {
    setEditText(meal?.userInput ?? meal?.name ?? '')
    setEditing(true)
    setError('')
  }

  const handleReanalyze = async () => {
    if (!editText.trim() || !meal) return
    setError('')
    setAnalyzing(true)
    try {
      const result = await analyzeMealFromText(editText.trim())
      const today = new Date().toISOString().slice(0, 10)
      const updated: MealEntry = {
        ...meal,
        name: result.description || meal.name,
        calories: Math.round(result.calories || 0),
        protein: Math.round(result.protein || 0),
        carbs: Math.round(result.carbs || 0),
        fat: Math.round(result.fat || 0),
        userInput: editText.trim(),
        items: result.items?.map(item => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: (item as { carbs?: number }).carbs,
          fat: (item as { fat?: number }).fat,
          portion: (item as { portion?: string }).portion,
        })),
      }
      // Actualiza en la UI (resta lo viejo, suma lo nuevo)
      updateMeal(meal.id, updated)

      if (profile?.id) {
        // Elimina la anterior en BD si tiene id de Supabase (UUID)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(meal.id)) {
          await deleteMeal(meal.id)
        }
        await insertMeal(profile.id, {
          meal_type: meal.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
          name: updated.name,
          calories: updated.calories,
          protein: updated.protein,
          carbs: updated.carbs,
          fat: updated.fat,
          source: 'ai_vision',
        })
      }

      onUpdated(updated)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al re-analizar')
    } finally {
      setAnalyzing(false)
    }
  }

  if (!meal) return null
  const { icon, gradient } = getMealIconDef(meal.name)

  return (
    <AnimatePresence>
      {meal && (
        <>
          <motion.div key="bd" className="fixed inset-0 z-40 bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />

          <motion.div key="sheet"
            className="fixed inset-x-0 z-50 bg-[#0a0a0a] rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
              maxHeight: 'calc(100dvh - 6.5rem - env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2 pb-0.5 shrink-0">
              <div className="w-8 h-0.5 rounded-full bg-white/15" />
            </div>

            <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 overflow-hidden">
              {/* Header compacto */}
              <div className="flex items-center justify-between gap-2 shrink-0 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate leading-tight">{meal.name}</p>
                    <p className="text-white/30 text-[10px] uppercase tracking-wider">{MEAL_TYPE_LABEL[meal.meal_type] ?? meal.meal_type}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.07] flex items-center justify-center text-white/40 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Macros con iconos */}
              <div className="flex gap-1.5 shrink-0 mb-3">
                <MacroPill icon={<Flame className="w-3.5 h-3.5" />} value={meal.calories} unit="kcal" color="#f97316" />
                <MacroPill icon={<Beef className="w-3.5 h-3.5" />} value={meal.protein} unit="g" color="#a855f7" />
                <MacroPill icon={<Wheat className="w-3.5 h-3.5" />} value={meal.carbs} unit="g" color="#3b82f6" />
                <MacroPill icon={<Egg className="w-3.5 h-3.5" />} value={meal.fat} unit="g" color="#eab308" />
              </div>

              {!editing ? (
                <>
                  {/* Items compactos — en una fila de chips */}
                  {meal.items && meal.items.length > 0 && (
                    <div className="shrink-0 mb-2 flex flex-wrap gap-1.5">
                      {meal.items.slice(0, 4).map((item, i) => (
                        <div key={i} className="rounded-lg px-2.5 py-1.5 bg-white/[0.06] border border-white/[0.08] max-w-[48%]">
                          <p className="text-[11px] text-white/80 truncate">{item.name}</p>
                          <p className="text-[9px] text-white/40 tabular-nums">{item.calories} kcal · {item.protein}g prot</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lo que describiste — compacto */}
                  {meal.userInput && (
                    <div className="shrink-0 mb-2 flex gap-2 rounded-xl px-3 py-2 bg-white/[0.04] border border-white/[0.06]">
                      <MessageSquare className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-white/50 leading-snug line-clamp-2">{meal.userInput}</p>
                    </div>
                  )}

                  <div className="flex-1 min-h-0" />
                  {/* Botón editar */}
                  <button
                    onClick={handleStartEdit}
                    className="shrink-0 rounded-xl py-2.5 flex items-center justify-center gap-2 border border-white/[0.1] bg-white/[0.05] text-sm font-medium text-white/80"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar y re-analizar
                  </button>
                </>
              ) : (
                /* Formulario edición compacto */
                <div className="flex-1 flex flex-col min-h-0 gap-2">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl bg-white/[0.06] border border-white/[0.09] px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 resize-none shrink-0"
                    placeholder="Describe lo que comiste..."
                  />
                  {error && <p className="text-red-400 text-xs shrink-0">{error}</p>}
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-1.5 border border-white/[0.09] bg-white/[0.04] text-sm text-white/50">
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                    <button onClick={handleReanalyze} disabled={analyzing || !editText.trim()}
                      className="flex-1 rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg,#f97316,#7c3aed)' }}>
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {analyzing ? 'Analizando...' : 'Re-analizar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
