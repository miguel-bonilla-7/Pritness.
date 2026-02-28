import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DailyTotals {
  eaten: number
  burned: number
  proteinEaten: number
  waterMl: number
  weightKg: number
  weightStartKg: number
}

interface DailyLogContextValue extends DailyTotals {
  wods: WodEntry[]
  setEaten: (v: number | ((prev: number) => number)) => void
  setBurned: (v: number | ((prev: number) => number)) => void
  setWaterMl: (v: number | ((prev: number) => number)) => void
  setWeightKg: (v: number | ((prev: number) => number)) => void
  addMeal: (calories: number, protein?: number, carbs?: number, fat?: number) => void
  addWater: (ml: number) => void
  logWeight: (kg: number) => void
  addWod: (entry: Omit<WodEntry, 'id' | 'date'>) => void
}

const STORAGE_KEY = 'pritness_daily_totals'
const WODS_STORAGE_KEY = 'pritness_wods'

export interface WodEntry {
  id: string
  date: string
  description: string
  exercises: string[]
  estimatedCaloriesBurned: number
}

const defaultTotals: DailyTotals = {
  eaten: 0,
  burned: 0,
  proteinEaten: 0,
  waterMl: 0,
  weightKg: 0,
  weightStartKg: 0,
}

function loadTotals(): DailyTotals {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) {
      const parsed = JSON.parse(s) as Partial<DailyTotals>
      return { ...defaultTotals, ...parsed }
    }
  } catch {}
  return defaultTotals
}

function loadWods(): WodEntry[] {
  try {
    const s = localStorage.getItem(WODS_STORAGE_KEY)
    if (s) return JSON.parse(s) as WodEntry[]
  } catch {}
  return []
}

function saveWods(w: WodEntry[]) {
  try {
    localStorage.setItem(WODS_STORAGE_KEY, JSON.stringify(w))
  } catch {}
}

function saveTotals(t: DailyTotals) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  } catch {}
}

const DailyLogContext = createContext<DailyLogContextValue | null>(null)

export function DailyLogProvider({ children }: { children: ReactNode }) {
  const [totals, setTotals] = useState<DailyTotals>(loadTotals)
  const [wods, setWods] = useState<WodEntry[]>(loadWods)

  const setEaten = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => {
        const next = typeof v === 'function' ? v(t.eaten) : v
        const out = { ...t, eaten: Math.max(0, next) }
        saveTotals(out)
        return out
      }),
    []
  )
  const setBurned = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => {
        const next = typeof v === 'function' ? v(t.burned) : v
        const out = { ...t, burned: Math.max(0, next) }
        saveTotals(out)
        return out
      }),
    []
  )
  const setWaterMl = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => {
        const next = typeof v === 'function' ? v(t.waterMl) : v
        const out = { ...t, waterMl: Math.max(0, next) }
        saveTotals(out)
        return out
      }),
    []
  )
  const setWeightKg = useCallback(
    (v: number | ((prev: number) => number)) =>
      setTotals((t) => {
        const next = typeof v === 'function' ? v(t.weightKg) : v
        const out = { ...t, weightKg: next }
        saveTotals(out)
        return out
      }),
    []
  )

  const addMeal = useCallback((calories: number, protein?: number) => {
    setTotals((t) => {
      const out = {
        ...t,
        eaten: t.eaten + calories,
        proteinEaten: t.proteinEaten + (protein ?? 0),
      }
      saveTotals(out)
      return out
    })
  }, [])

  const addWater = useCallback((ml: number) => {
    setTotals((t) => {
      const out = { ...t, waterMl: t.waterMl + ml }
      saveTotals(out)
      return out
    })
  }, [])

  const logWeight = useCallback((kg: number) => {
    setTotals((t) => {
      const out = { ...t, weightKg: kg }
      saveTotals(out)
      return out
    })
  }, [])

  const addWod = useCallback((entry: Omit<WodEntry, 'id' | 'date'>) => {
    const date = new Date().toISOString().slice(0, 10)
    const newEntry: WodEntry = {
      ...entry,
      id: `wod-${Date.now()}`,
      date,
    }
    setWods((prev) => {
      const next = [newEntry, ...prev]
      saveWods(next)
      return next
    })
  }, [])

  const value: DailyLogContextValue = {
    ...totals,
    wods,
    setEaten,
    setBurned,
    setWaterMl,
    setWeightKg,
    addMeal,
    addWater,
    logWeight,
    addWod,
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
