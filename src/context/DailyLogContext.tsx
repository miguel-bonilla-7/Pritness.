import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
import {
  insertWaterLog,
  insertWod as supabaseInsertWod,
  fetchTodayWaterMl,
  fetchTodayMealTotals,
  fetchAllWods,
  isSupabaseConfigured,
} from '../lib/supabase'

interface DailyTotals {
  eaten: number
  burned: number
  proteinEaten: number
  waterMl: number
}

export interface WodEntry {
  id: string
  date: string
  description: string
  exercises: string[]
  estimatedCaloriesBurned: number
}

interface DailyLogContextValue extends DailyTotals {
  wods: WodEntry[]
  syncing: boolean
  setEaten: (v: number | ((prev: number) => number)) => void
  setBurned: (v: number | ((prev: number) => number)) => void
  setWaterMl: (v: number | ((prev: number) => number)) => void
  addMeal: (calories: number, protein?: number) => void
  addWater: (ml: number) => void
  addWod: (entry: Omit<WodEntry, 'id' | 'date'>) => void
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
      const [meals, waterMl, dbWods] = await Promise.all([
        fetchTodayMealTotals(profileId),
        fetchTodayWaterMl(profileId),
        fetchAllWods(profileId),
      ])

      setTotals({
        eaten: meals.calories,
        burned: 0,
        proteinEaten: meals.protein,
        waterMl,
      })

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
    // Meal inserts to Supabase happen in the page that calls insertMeal directly
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
    wods,
    syncing,
    setEaten,
    setBurned,
    setWaterMl,
    addMeal,
    addWater,
    addWod,
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
