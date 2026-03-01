import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed, X, ChefHat, Flame, Zap, Wheat, Droplets, RefreshCw,
  Egg, Fish, Beef, Salad, Soup, GlassWater, Milk, Drumstick, Bird, Leaf,
  Utensils, Coffee, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useDailyLog } from '../context/DailyLogContext'
import { getAIMealSuggestions, type AIMealSuggestion } from '../lib/api'
import { getMenuSuggestions, type MealSuggestion } from '../lib/menuRecommender'

// ── Food preferences (persisted to localStorage) ─────────────────────────────
const PREFS_KEY = 'pritness_food_prefs'

interface FoodPrefs {
  disliked: string[]
  liked: string[]
}

function loadPrefs(): FoodPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return JSON.parse(raw) as FoodPrefs
  } catch {}
  return { disliked: [], liked: [] }
}

function savePrefs(prefs: FoodPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

type DisplayMeal = MealSuggestion

function aiToDisplay(s: AIMealSuggestion): DisplayMeal {
  return { ...s, image: s.imageCategory }
}

function fallbackToDisplay(s: MealSuggestion): DisplayMeal {
  return s
}

// ── Category visual map ──────────────────────────────────────────────────────
type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

interface CategoryVisual {
  gradient: [string, string]
  Icon: LucideIcon
}

const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  eggs:     { gradient: ['#f97316', '#f59e0b'], Icon: Egg },
  chicken:  { gradient: ['#ef4444', '#f97316'], Icon: Drumstick },
  fish:     { gradient: ['#3b82f6', '#06b6d4'], Icon: Fish },
  salad:    { gradient: ['#22c55e', '#14b8a6'], Icon: Salad },
  smoothie: { gradient: ['#a855f7', '#ec4899'], Icon: GlassWater },
  yogurt:   { gradient: ['#c084fc', '#ec4899'], Icon: Milk },
  quinoa:   { gradient: ['#14b8a6', '#a855f7'], Icon: Leaf },
  oats:     { gradient: ['#f59e0b', '#f97316'], Icon: Wheat },
  soup:     { gradient: ['#f59e0b', '#ef4444'], Icon: Soup },
  pasta:    { gradient: ['#f97316', '#a855f7'], Icon: Utensils },
  beef:     { gradient: ['#ef4444', '#7c3aed'], Icon: Beef },
  turkey:   { gradient: ['#f97316', '#ea580c'], Icon: Bird },
  coffee:   { gradient: ['#78350f', '#a16207'], Icon: Coffee },
  generic:  { gradient: ['#f97316', '#a855f7'], Icon: UtensilsCrossed },
}

function getCategoryVisual(imageCategory: string): CategoryVisual {
  const key = (imageCategory ?? 'generic').toLowerCase()
  return CATEGORY_VISUALS[key] ?? CATEGORY_VISUALS.generic
}

// ── Gradient icon tile ───────────────────────────────────────────────────────
function MealIconTile({
  imageCategory,
  size = 'card',
}: {
  imageCategory: string
  size?: 'card' | 'modal'
}) {
  const { gradient, Icon } = getCategoryVisual(imageCategory)
  const iconSize = size === 'modal' ? 56 : 32

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
      }}
    >
      <Icon size={iconSize} color="white" strokeWidth={1.5} />
    </div>
  )
}

// ── Detail bottom sheet ──────────────────────────────────────────────────────
function MealDetailModal({ meal, onClose }: { meal: DisplayMeal; onClose: () => void }) {
  const { gradient } = getCategoryVisual(meal.image)

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />

        <motion.div
          className="relative w-full max-h-[92vh] flex flex-col rounded-t-3xl overflow-hidden"
          style={{ background: '#1a1a2e' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Gradient icon header */}
          <div className="relative h-44 shrink-0">
            <MealIconTile imageCategory={meal.image} size="modal" />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, #1a1a2e 0%, transparent 60%)' }}
            />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/30 flex items-center justify-center text-white"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Calorie badge */}
            <span
              className="absolute bottom-4 left-5 text-xs font-bold text-white px-3 py-1 rounded-full"
              style={{ background: `${gradient[0]}55`, border: `1px solid ${gradient[0]}88` }}
            >
              {meal.calories} kcal
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-8 pt-3 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white">{meal.label}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{meal.description}</p>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: <Flame className="w-4 h-4" />, value: meal.calories, label: 'kcal', color: 'text-orange-400' },
                { icon: <Zap className="w-4 h-4" />, value: `${meal.protein}g`, label: 'Proteína', color: 'text-purple-400' },
                { icon: <Wheat className="w-4 h-4" />, value: `${meal.carbs}g`, label: 'Carbos', color: 'text-yellow-400' },
                { icon: <Droplets className="w-4 h-4" />, value: `${meal.fat}g`, label: 'Grasa', color: 'text-blue-400' },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/6 py-3 px-1">
                  <span className={m.color}>{m.icon}</span>
                  <span className="text-sm font-bold text-white">{m.value}</span>
                  <span className="text-[10px] text-gray-400">{m.label}</span>
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                <h3 className="font-semibold text-white text-sm">Ingredientes</h3>
              </div>
              <ul className="space-y-2">
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recipe */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChefHat className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">Preparación</h3>
              </div>
              <ol className="space-y-3">
                {meal.recipe.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="snap-start shrink-0 rounded-2xl overflow-hidden animate-pulse"
      style={{ width: 'calc((100vw - 4rem) / 2.6)', background: '#1e1e30' }}
    >
      <div className="h-20 bg-white/8" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-white/10 rounded-full w-3/4" />
        <div className="h-2.5 bg-white/6 rounded-full w-full" />
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export function MenuRecommender() {
  const { profile } = useUser()
  const { eaten, burned } = useDailyLog()
  const [meals, setMeals] = useState<DisplayMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DisplayMeal | null>(null)
  const [prefs, setPrefs] = useState<FoodPrefs>(loadPrefs)

  const saveAndSetPrefs = useCallback((next: FoodPrefs) => {
    savePrefs(next)
    setPrefs(next)
  }, [])

  const handleLike = useCallback((meal: DisplayMeal) => {
    const current = loadPrefs()
    const next: FoodPrefs = {
      liked: [...new Set([...current.liked, meal.label])].slice(-30),
      disliked: current.disliked.filter((d) => d !== meal.label),
    }
    saveAndSetPrefs(next)
  }, [saveAndSetPrefs])

  const handleDislike = useCallback((meal: DisplayMeal) => {
    const current = loadPrefs()
    const next: FoodPrefs = {
      disliked: [...new Set([...current.disliked, meal.label])].slice(-30),
      liked: current.liked.filter((l) => l !== meal.label),
    }
    saveAndSetPrefs(next)
    setMeals((prev) => prev.filter((m) => m.label !== meal.label))
  }, [saveAndSetPrefs])

  const loadSuggestions = useCallback(async () => {
    if (!profile) return
    setLoading(true)

    const targetCal = profile.dailyCaloriesTarget
    const remainingCal = Math.max(0, targetCal - eaten + burned)
    const hour = new Date().getHours()

    let chatHistory: { role: string; content: string }[] = []
    try {
      const raw = localStorage.getItem('pritness_chat_history')
      if (raw) chatHistory = JSON.parse(raw) as { role: string; content: string }[]
    } catch {}

    const currentPrefs = loadPrefs()

    const aiSuggestions = await getAIMealSuggestions(
      remainingCal,
      profile.proteinTarget,
      hour,
      profile.goal ?? 'mantener peso',
      chatHistory,
      profile.country ?? '',
      currentPrefs.disliked
    )

    if (aiSuggestions.length >= 3) {
      setMeals(aiSuggestions.map(aiToDisplay))
    } else {
      const fallback = getMenuSuggestions(
        remainingCal,
        profile.proteinTarget,
        profile.carbsTarget,
        profile.fatTarget,
        hour
      )
      setMeals(fallback.map(fallbackToDisplay))
    }

    setLoading(false)
  }, [profile, eaten, burned])

  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  if (!profile) return null
  if (!loading && meals.length === 0) return null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <UtensilsCrossed className="w-4 h-4 text-orange-400" />
        <h2 className="font-bold text-white text-sm">Sugerencia del momento</h2>
        <button
          type="button"
          onClick={loadSuggestions}
          disabled={loading}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
          aria-label="Actualizar sugerencias"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        className="-mx-4 px-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : meals.map((meal, i) => {
              const { gradient } = getCategoryVisual(meal.image)
              const isLiked = prefs.liked.includes(meal.label)
              const isDisliked = prefs.disliked.includes(meal.label)
              return (
                <motion.div
                  key={i}
                  className="snap-start shrink-0 rounded-2xl overflow-hidden flex flex-col"
                  style={{ width: 'calc((100vw - 4rem) / 2.6)', background: '#1e1e30' }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                >
                  {/* Icon tile — tappable to open detail */}
                  <button
                    type="button"
                    onClick={() => setSelected(meal)}
                    className="relative w-full h-20 shrink-0 active:opacity-80 transition-opacity"
                  >
                    <MealIconTile imageCategory={meal.image} size="card" />
                    <span
                      className="absolute bottom-1.5 right-2 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: `${gradient[1]}70` }}
                    >
                      {meal.calories} kcal
                    </span>
                    {/* Feedback buttons — overlaid top-right */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleLike(meal)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                          isLiked ? 'bg-green-500/80 text-white' : 'bg-black/30 text-white/50 active:text-green-400'
                        }`}
                        aria-label="Me gusta"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDislike(meal)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${
                          isDisliked ? 'bg-red-500/80 text-white' : 'bg-black/30 text-white/50 active:text-red-400'
                        }`}
                        aria-label="No gracias"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </button>

                  {/* Info */}
                  <button
                    type="button"
                    onClick={() => setSelected(meal)}
                    className="px-2.5 pt-2 pb-2.5 flex flex-col gap-0.5 text-left w-full"
                  >
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">{meal.label}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      <span className="text-[9px] text-purple-300 font-medium">{meal.protein}g prot</span>
                      <span className="text-[9px] text-gray-500">·</span>
                      <span className="text-[9px] text-yellow-300 font-medium">{meal.carbs}g c</span>
                    </div>
                  </button>
                </motion.div>
              )
            })}
      </div>

      {selected && <MealDetailModal meal={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
