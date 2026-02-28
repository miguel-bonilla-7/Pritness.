import { useUser } from '../context/UserContext'
import { useDailyLog } from '../context/DailyLogContext'
import { getMenuSuggestions } from '../lib/menuRecommender'
import { Card } from './Card'
import { UtensilsCrossed } from 'lucide-react'

export function MenuRecommender() {
  const { profile } = useUser()
  const { eaten, burned } = useDailyLog()
  if (!profile) return null

  const targetCal = profile.dailyCaloriesTarget
  const remainingCal = Math.max(0, targetCal - eaten + burned)
  const hour = new Date().getHours()
  const suggestions = getMenuSuggestions(
    remainingCal,
    profile.proteinTarget,
    profile.carbsTarget,
    profile.fatTarget,
    hour
  )

  if (suggestions.length === 0) return null

  return (
    <Card>
        <div className="flex items-center gap-2 mb-3">
          <UtensilsCrossed className="w-5 h-5 text-orange-400" />
          <h2 className="font-bold text-white">Sugerencia del momento</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Son las {hour}:00, te quedan ~{remainingCal} kcal. Opciones que encajan con tus macros:
        </p>
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="rounded-xl bg-white/5 p-3">
              <p className="font-medium text-white text-sm">{s.label}</p>
              <p className="text-xs text-gray-400">{s.description}</p>
              <p className="text-xs text-gray-500 mt-1">{s.calories} kcal · {s.protein}g proteína</p>
            </li>
          ))}
        </ul>
      </Card>
  )
}
