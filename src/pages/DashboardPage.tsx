import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, Droplets, Scale, Target } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useDailyLog } from '../context/DailyLogContext'
import { Card } from '../components/Card'
import { ProgressBar } from '../components/ProgressBar'
import { ProgressRing } from '../components/ProgressRing'
import { MenuRecommender } from '../components/MenuRecommender'
import { LogMealModal } from '../components/LogMealModal'
import { LogDrinkModal } from '../components/LogDrinkModal'
import { LogWeightModal } from '../components/LogWeightModal'

const WATER_TARGET_ML = 2000

function getBmiCategory(bmi: number): { label: string; position: number } {
  if (bmi < 18.5) return { label: 'Underweight', position: 0 }
  if (bmi < 25) return { label: 'Normal', position: 25 }
  if (bmi < 30) return { label: 'Overweight', position: 58 }
  return { label: 'Obese', position: 88 }
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useUser()
  const {
    eaten,
    burned,
    proteinEaten,
    waterMl,
    weightKg,
    weightStartKg,
  } = useDailyLog()
  const [showLogMeal, setShowLogMeal] = useState(false)
  const [showLogDrink, setShowLogDrink] = useState(false)
  const [showLogWeight, setShowLogWeight] = useState(false)

  useEffect(() => {
    if (!profile) {
      navigate('/onboarding', { replace: true })
      return
    }
  }, [profile, navigate])

  if (!profile) return null

  const targetCal = profile.dailyCaloriesTarget
  const remaining = Math.max(0, targetCal - eaten + burned)
  const waterPct = Math.min(100, (waterMl / WATER_TARGET_ML) * 100)
  const heightM = profile.height / 100
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0
  const bmiCategory = getBmiCategory(bmi)
  const weightDiff = weightKg - weightStartKg

  return (
    <div className="p-4 space-y-5">
      {/* Tus metas diarias - arriba en la interfaz */}
      <Card className="border-orange-500/30 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-orange-400">
            <Target className="w-5 h-5" />
          </span>
          <h2 className="font-bold text-white">Tus metas diarias</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">Objetivos que debes alcanzar cada día (según tu peso, altura, edad y objetivo)</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{targetCal.toLocaleString()}</p>
            <p className="text-xs text-gray-400">kcal</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{profile.proteinTarget}</p>
            <p className="text-xs text-gray-400">g proteína</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-300">{profile.carbsTarget}</p>
            <p className="text-xs text-gray-400">g carbos</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-300">{profile.fatTarget}</p>
            <p className="text-xs text-gray-400">g grasa</p>
          </div>
        </div>
      </Card>

      {/* Calorie Tracker */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-orange-400">
              <Flame className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-white">Calorie Tracker</h2>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Meta: <span className="text-white font-medium">{targetCal.toLocaleString()} kcal</span>
          {' · '}
          <span className="text-white font-medium">{profile.proteinTarget} g</span> proteína
        </p>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-400">Calorías consumidas</p>
            <p className="text-xl font-bold text-white">+{eaten.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Calorías quemadas</p>
            <p className="text-xl font-bold text-white">-{burned}</p>
          </div>
        </div>
        <ProgressBar value={eaten - burned} max={targetCal} type="calories" />
        <p className="text-xs text-gray-400 mt-2">Restantes {remaining.toLocaleString()} kcal</p>

        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400 mb-1">Proteína consumida</p>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xl font-bold text-white">{proteinEaten} <span className="text-sm font-normal text-gray-400">/ {profile.proteinTarget} g</span></p>
          </div>
          <ProgressBar value={proteinEaten} max={Math.max(profile.proteinTarget, 1)} type="protein" className="mt-1" />
        </div>

        <button
          type="button"
          onClick={() => setShowLogMeal(true)}
          className="mt-4 w-full rounded-xl py-2.5 bg-white/10 text-gray-200 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          Registrar comida &gt;
        </button>
      </Card>

      {/* Water Minder */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">
              <Droplets className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-white">Water Minder</h2>
          </div>
          <span className="text-xs text-gray-400">0 <Flame className="w-3 h-3 inline" /></span>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing value={waterMl} max={WATER_TARGET_ML} size={100} strokeWidth={8} />
          <div className="flex-1">
            <p className="text-2xl font-bold text-white">{Math.round(waterPct)}%</p>
            <p className="text-sm text-gray-400">{waterMl} / {WATER_TARGET_ML} ml</p>
            <button
              type="button"
              onClick={() => setShowLogDrink(true)}
              className="mt-3 w-full rounded-xl py-2.5 bg-white/10 text-gray-200 text-sm font-medium hover:bg-white/15 transition-colors"
            >
              Log Drink &gt;
            </button>
          </div>
        </div>
      </Card>

      {/* Weight Tracker */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              <Scale className="w-5 h-5" />
            </span>
            <h2 className="font-bold text-white">Weight Tracker</h2>
          </div>
          <span className="text-xs text-gray-400">
            {weightDiff <= 0 ? '' : '+'}{weightDiff} kg
          </span>
        </div>
        <div className="mb-3">
          <p className="text-3xl font-bold text-white">{bmi.toFixed(1)}</p>
          <p className="text-xs text-gray-400">YOUR BMI</p>
        </div>
        <div className="relative h-3 rounded-full overflow-hidden bg-white/5">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-blue-500/60" />
            <div className="flex-1 bg-green-500/60" />
            <div className="flex-1 bg-yellow-500/60" />
            <div className="flex-1 bg-orange-500/60" />
            <div className="flex-1 bg-red-500/60" />
          </div>
          <div
            className="absolute top-0 bottom-0 w-1 bg-white rounded-full -translate-x-1/2"
            style={{ left: `${bmiCategory.position}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>Underweight</span>
          <span>Normal</span>
          <span>Overweight</span>
          <span>Obese</span>
        </div>
        <button
          type="button"
          onClick={() => setShowLogWeight(true)}
          className="mt-4 w-full rounded-xl py-2.5 bg-white/10 text-gray-200 text-sm font-medium hover:bg-white/15 transition-colors"
        >
          Log Weight &gt;
        </button>
      </Card>

      <MenuRecommender />

      <LogMealModal open={showLogMeal} onClose={() => setShowLogMeal(false)} />
      <LogDrinkModal open={showLogDrink} onClose={() => setShowLogDrink(false)} />
      <LogWeightModal open={showLogWeight} onClose={() => setShowLogWeight(false)} />
    </div>
  )
}
