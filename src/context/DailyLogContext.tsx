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
  setEaten: (v: number | ((prev: number) => number)) => void
  setBurned: (v: number | ((prev: number) => number)) => void
  setWaterMl: (v: number | ((prev: number) => number)) => void
  setWeightKg: (v: number | ((prev: number) => number)) => void
  addMeal: (calories: number, protein?: number, carbs?: number, fat?: number) => void
  addWater: (ml: number) => void
  logWeight: (kg: number) => void
}

const STORAGE_KEY = 'pritness_daily_totals'

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

function saveTotals(t: DailyTotals) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
  } catch {}
}

const DailyLogContext = createContext<DailyLogContextValue | null>(null)

export function DailyLogProvider({ children }: { children: ReactNode }) {
  const [totals, setTotals] = useState<DailyTotals>(loadTotals)

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

  const value: DailyLogContextValue = {
    ...totals,
    setEaten,
    setBurned,
    setWaterMl,
    setWeightKg,
    addMeal,
    addWater,
    logWeight,
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
