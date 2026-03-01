import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '../context/UserContext'
import { useDailyLog, type MealEntry } from '../context/DailyLogContext'
import { Card } from '../components/Card'
import { ProgressArc } from '../components/ProgressArc'
import { MenuRecommender } from '../components/MenuRecommender'
import { LogMealModal } from '../components/LogMealModal'
import { LogDrinkModal } from '../components/LogDrinkModal'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { MealDetailSheet, getMealIconNode } from '../components/MealDetailSheet'

const WATER_TARGET_ML = 2000

function getBmiCategory(bmi: number): { label: string; position: number } {
  if (bmi < 18.5) return { label: 'Underweight', position: 0 }
  if (bmi < 25) return { label: 'Normal', position: 25 }
  if (bmi < 30) return { label: 'Overweight', position: 58 }
  return { label: 'Obese', position: 88 }
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
  snack: 'Snack',
}

export function DashboardPage() {
  const { profile } = useUser()
  const { eaten, burned, proteinEaten, waterMl, meals, removeMeal } = useDailyLog()
  const [showLogMeal, setShowLogMeal] = useState(false)
  const [showLogDrink, setShowLogDrink] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null)

  if (!profile) return null

  const targetCal = profile.dailyCaloriesTarget
  const heightM = profile.height / 100
  const bmi = heightM > 0 ? profile.weight / (heightM * heightM) : 0
  const bmiCategory = getBmiCategory(bmi)

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = profile.name.split(/\s+/)[0]

  return (
    <div className="p-4 space-y-4 overflow-auto min-h-0 overscroll-contain">

      {/* ── Hero section ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative"
      >
        {/* Greeting */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500">
            {greeting}, <span className="text-white font-medium">{firstName}</span>
          </p>
        </div>

        {/* Main arc — protein is the hero metric */}
        <div className="relative flex justify-center mt-8">
          <ProgressArc
            value={proteinEaten}
            max={Math.max(profile.proteinTarget, 1)}
            size={240}
            strokeWidth={13}
            centerValue={`${proteinEaten}g`}
            centerLabel="proteína"
          />
        </div>

        {/* Bars — calories & water */}
        <div className="flex flex-col gap-4 mt-6 px-1">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[11px] text-gray-500 uppercase tracking-widest">Calorías</span>
              <span className="text-[11px] text-gray-500">{eaten} / {targetCal} kcal</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((eaten - burned) / targetCal) * 100)}%` }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[11px] text-gray-500 uppercase tracking-widest">Agua</span>
              <span className="text-[11px] text-gray-500">{waterMl} / {WATER_TARGET_ML} ml</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/[0.07] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white/50"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (waterMl / WATER_TARGET_ML) * 100)}%` }}
                transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.08 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          onClick={() => setShowLogMeal(true)}
          className="w-full flex flex-row items-center justify-center gap-2 rounded-xl py-3.5 px-4 border border-white/10 bg-white/[0.04] active:bg-white/[0.08] active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" />
            <path d="M21 15v7" />
          </svg>
          <span className="text-xs font-medium text-white/80 whitespace-nowrap">Registrar comida</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLogDrink(true)}
          className="w-full flex flex-row items-center justify-center gap-2 rounded-xl py-3.5 px-4 border border-white/10 bg-white/[0.04] active:bg-white/[0.08] active:scale-95 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
          </svg>
          <span className="text-xs font-medium text-white/80 whitespace-nowrap">Registrar agua</span>
        </button>
      </div>

      <MenuRecommender />

      {/* Weight / BMI */}
      <Card>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <p className="text-3xl font-light text-white tabular-nums">{profile.weight} <span className="text-base text-gray-500">kg</span></p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">Peso registrado</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-light text-white tabular-nums">{bmi.toFixed(1)}</p>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mt-0.5">IMC</p>
          </div>
        </div>
        <div className="relative h-[3px] rounded-full overflow-hidden bg-white/[0.07]">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-blue-500/50" />
            <div className="flex-1 bg-green-500/50" />
            <div className="flex-1 bg-yellow-500/50" />
            <div className="flex-1 bg-orange-500/50" />
            <div className="flex-1 bg-red-500/50" />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-white rounded-full -translate-x-1/2"
            style={{ left: `${bmiCategory.position}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 mt-1.5 uppercase tracking-widest">
          <span>Bajo</span>
          <span>Normal</span>
          <span>Sobrepeso</span>
          <span>Obeso</span>
        </div>
      </Card>

      {/* ── Qué comiste hoy ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between px-0.5">
          <p className="text-sm font-semibold text-white">Qué comiste hoy</p>
          {meals.length > 0 && (
            <p className="text-[10px] text-white/25 uppercase tracking-widest">desliza para eliminar</p>
          )}
        </div>

        {meals.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] px-4 py-6 text-center">
            <p className="text-white/25 text-sm">Aún no has registrado comidas hoy</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {meals.map((meal) => {
              const { icon, gradient } = getMealIconNode(meal.name)
              return (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SwipeToDelete onDelete={() => removeMeal(meal.id)} onTap={() => setSelectedMeal(meal)}>
                    <div className="w-full bg-[#111111] border border-white/[0.07] rounded-2xl px-4 py-3.5 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{meal.name}</p>
                        <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-widest">
                          {MEAL_TYPE_LABEL[meal.meal_type] ?? meal.meal_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-light text-white tabular-nums">{meal.calories}</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest">kcal</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-light text-white tabular-nums">{meal.protein}g</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest">prot</p>
                        </div>
                      </div>
                    </div>
                  </SwipeToDelete>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>

      <LogMealModal open={showLogMeal} onClose={() => setShowLogMeal(false)} />
      <LogDrinkModal open={showLogDrink} onClose={() => setShowLogDrink(false)} />
      <MealDetailSheet
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onUpdated={(updated) => setSelectedMeal(updated)}
      />
    </div>
  )
}
