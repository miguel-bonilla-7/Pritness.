import type { Goal } from '../context/UserContext'

/**
 * Mifflin-St Jeor TMB (kcal/day)
 * Men: 10*weight(kg) + 6.25*height(cm) - 5*age + 5
 * Women: 10*weight + 6.25*height - 5*age - 161
 */
export function calculateTMB(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'male' | 'female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

/**
 * Daily calorie target and macro targets (g) based on goal.
 * - perder_peso: deficit ~15%, higher protein
 * - ganar_masa: surplus ~10%, balanced
 * - definir_masa: maintain, balanced
 */
export function getTargetsFromGoal(
  tmb: number,
  goal: Goal
): {
  dailyCaloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
} {
  let multiplier: number
  let proteinPct: number
  let carbsPct: number
  let fatPct: number

  switch (goal) {
    case 'perder_peso':
      multiplier = 0.85
      proteinPct = 0.3
      carbsPct = 0.45
      fatPct = 0.25
      break
    case 'ganar_masa':
      multiplier = 1.1
      proteinPct = 0.25
      carbsPct = 0.5
      fatPct = 0.25
      break
    case 'definir_masa':
    default:
      multiplier = 1
      proteinPct = 0.25
      carbsPct = 0.5
      fatPct = 0.25
      break
  }

  const dailyCaloriesTarget = Math.round(tmb * multiplier)
  const proteinKcal = dailyCaloriesTarget * proteinPct
  const carbsKcal = dailyCaloriesTarget * carbsPct
  const fatKcal = dailyCaloriesTarget * fatPct

  return {
    dailyCaloriesTarget,
    proteinTarget: Math.round(proteinKcal / 4),
    carbsTarget: Math.round(carbsKcal / 4),
    fatTarget: Math.round(fatKcal / 9),
  }
}
