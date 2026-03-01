import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import {
  insertWaterLog,
  insertWod as supabaseInsertWod,
  fetchTodayWaterMl,
  fetchTodayMealTotals,
  fetchTodayMeals,
  fetchAllWods,
  deleteMeal as supabaseDeleteMeal,
  deleteWod as supabaseDeleteWod,
  isSupabaseConfigured,
} from '../lib/supabase'

interface DailyTotals {
  eaten: number
  burned: number
  proteinEaten: number
  waterMl: number
}

export interface MealEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  date: string
  userInput?: string
  items?: { name: string; calories: number; protein: number; carbs?: number; fat?: number; portion?: string }[]
}

export interface WodEntry {
  id: string
  date: string
  description: string
  exercises: string[]
  estimatedCaloriesBurned: number
}

interface DailyLogContextValue extends DailyTotals {
  meals: MealEntry[]
  wods: WodEntry[]
  syncing: boolean
  setEaten: (v: number | ((prev: number) => number)) => void
  setBurned: (v: number | ((prev: number) => number)) => void
  setWaterMl: (v: number | ((prev: number) => number)) => void
  addMeal: (calories: number, protein?: number) => void
  addMealEntry: (entry: MealEntry) => void
  updateMeal: (id: string, updated: MealEntry) => void
  removeMeal: (id: string) => void
  addWater: (ml: number) => void
  addWod: (entry: Omit<WodEntry, 'id' | 'date'>) => void
  removeWod: (id: string) => void
  /** Called when a profile loads – fetches today's data from Supabase */
  syncFromDb: (profileId: string) => Promise<void>
  /** Pass profileId so writes go to Supabase */
  setProfileId: (id: string | null) => void
}

// Legacy localStorage keys – kept only as initial fallback for local-only mode
const LS_TOTALS = 'pritness_daily_totals'
const LS_WODS = 'pritness_wods'

const defaultTotals: DailyTotals = { eaten: 0, burned: 0, proteinEaten: 0, waterMl: 0 }

function lsLoadTotals(): DailyTotals {
  try {
    const s = localStorage.getItem(LS_TOTALS)
    if (s) return { ...defaultTotals, ...(JSON.parse(s) as Partial<DailyTotals>) }
  } catch { /* ignore */ }
  return defaultTotals
}

function lsLoadWods(): WodEntry[] {
  try {
    const s = localStorage.getItem(LS_WODS)
    if (s) return JSON.parse(s) as WodEntry[]
  } catch { /* ignore */ }
  return []
}

const DailyLogContext = createContext<DailyLogContextValue | null>(null)

export function DailyLogProvider({ children }: { children: ReactNode }) {
  const [totals, setTotals] = useState<DailyTotals>(
    isSupabaseConfigured ? defaultTotals : lsLoadTotals
  )
  const [meals, setMeals] = useState<MealEntry[]>([])
  const [wods, setWods] = useState<WodEntry[]>(lsLoadWods)
  const [syncing, setSyncing] = useState(false)
  const profileIdRef = useRef<string | null>(null)

  const setProfileId = useCallback((id: string | null) => {
    profileIdRef.current = id
  }, [])

  const syncFromDb = useCallback(async (profileId: string) => {
    if (!isSupabaseConfigured) return
    profileIdRef.current = profileId
    setSyncing(true)
    try {
      const [mealTotals, mealRows, waterMl, dbWods] = await Promise.all([
        fetchTodayMealTotals(profileId),
        fetchTodayMeals(profileId),
        fetchTodayWaterMl(profileId),
        fetchAllWods(profileId),
      ])

      setTotals({
        eaten: mealTotals.calories,
        burned: 0,
        proteinEaten: mealTotals.protein,
        waterMl,
      })

      setMeals(mealRows.map(r => ({
        id: r.id,
        name: r.name,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        meal_type: r.meal_type,
        date: r.date,
      })))

      // Map DB wod rows to WodEntry shape
      const mapped: WodEntry[] = dbWods.map((w) => ({
        id: w.id ?? `wod-${w.date}`,
        date: w.date,
        description: w.description ?? '',
        exercises: w.description ? w.description.split(',').map((s) => s.trim()).filter(Boolean) : [],
        estimatedCaloriesBurned: w.calories_burned ?? 0,
      }))
      setWods(mapped)
    } catch (e) {
      console.error('[DailyLog] syncFromDb error:', e)
    } finally {
      setSyncing(false)
    }
  }, [])

  const setEaten = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => ({ ...t, eaten: Math.max(0, typeof v === 'function' ? v(t.eaten) : v) })),
    []
  )

  const setBurned = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => ({ ...t, burned: Math.max(0, typeof v === 'function' ? v(t.burned) : v) })),
    []
  )

  const setWaterMl = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => ({ ...t, waterMl: Math.max(0, typeof v === 'function' ? v(t.waterMl) : v) })),
    []
  )

  const addMeal = useCallback((calories: number, protein?: number) => {
    setTotals((t) => ({
      ...t,
      eaten: t.eaten + calories,
      proteinEaten: t.proteinEaten + (protein ?? 0),
    }))
  }, [])

  const addMealEntry = useCallback((entry: MealEntry) => {
    setMeals((prev) => [entry, ...prev])
    setTotals((t) => ({
      ...t,
      eaten: t.eaten + entry.calories,
      proteinEaten: t.proteinEaten + entry.protein,
    }))
  }, [])

  const updateMeal = useCallback((id: string, updated: MealEntry) => {
    setMeals((prev) => {
      const found = prev.find(m => m.id === id)
      if (!found) return prev
      setTotals((t) => ({
        ...t,
        eaten: Math.max(0, t.eaten - found.calories + updated.calories),
        proteinEaten: Math.max(0, t.proteinEaten - found.protein + updated.protein),
      }))
      return prev.map(m => (m.id === id ? updated : m))
    })
  }, [])

  const removeMeal = useCallback((id: string) => {
    setMeals((prev) => {
      const found = prev.find(m => m.id === id)
      if (found) {
        setTotals((t) => ({
          ...t,
          eaten: Math.max(0, t.eaten - found.calories),
          proteinEaten: Math.max(0, t.proteinEaten - found.protein),
        }))
      }
      return prev.filter(m => m.id !== id)
    })
    supabaseDeleteMeal(id).catch(e => console.error('[DailyLog] deleteMeal failed:', e))
  }, [])

  const removeWod = useCallback((id: string) => {
    setWods((prev) => {
      const found = prev.find(w => w.id === id)
      if (found) {
        setBurned((prev) => Math.max(0, prev - found.estimatedCaloriesBurned))
      }
      return prev.filter(w => w.id !== id)
    })
    supabaseDeleteWod(id).catch(e => console.error('[DailyLog] deleteWod failed:', e))
  }, [])

  const addWater = useCallback((ml: number) => {
    setTotals((t) => ({ ...t, waterMl: t.waterMl + ml }))
    const pid = profileIdRef.current
    if (pid && isSupabaseConfigured) {
      insertWaterLog(pid, ml).catch((e) =>
        console.error('[DailyLog] insertWaterLog failed:', e)
      )
    }
  }, [])

  const addWod = useCallback((entry: Omit<WodEntry, 'id' | 'date'>) => {
    const date = new Date().toISOString().slice(0, 10)
    const newEntry: WodEntry = { ...entry, id: `wod-${Date.now()}`, date }
    setWods((prev) => [newEntry, ...prev])

    const pid = profileIdRef.current
    if (pid && isSupabaseConfigured) {
      supabaseInsertWod(pid, {
        date,
        description: entry.description,
        calories_burned: entry.estimatedCaloriesBurned,
        source: 'text',
      }).catch((e) => console.error('[DailyLog] insertWod failed:', e))
    } else {
      // Fallback: persist WODs to localStorage in local-only mode
      setWods((prev) => {
        try { localStorage.setItem(LS_WODS, JSON.stringify(prev)) } catch { /* ignore */ }
        return prev
      })
    }
  }, [])

  const value: DailyLogContextValue = {
    ...totals,
    meals,
    wods,
    syncing,
    setEaten,
    setBurned,
    setWaterMl,
    addMeal,
    addMealEntry,
    updateMeal,
    removeMeal,
    addWater,
    addWod,
    removeWod,
    syncFromDb,
    setProfileId,
  }

  return (
    <DailyLogContext.Provider value={value}>
      {children}
    </DailyLogContext.Provider>
  )
}

export function useDailyLog() {
  const ctx = useContext(DailyLogContext)
  if (!ctx) throw new Error('useDailyLog must be used within DailyLogProvider')
  return ctx
}
