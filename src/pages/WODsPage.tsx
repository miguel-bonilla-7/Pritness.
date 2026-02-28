import { Dumbbell, Flame } from 'lucide-react'
import { Card } from '../components/Card'
import { useDailyLog } from '../context/DailyLogContext'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  const isToday = dateStr === today.toISOString().slice(0, 10)
  if (isToday) return 'Hoy'
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function WODsPage() {
  const { wods } = useDailyLog()

  if (wods.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-orange-400" />
          WODs
        </h2>
        <Card>
          <p className="text-gray-400 text-center py-8">
            Aún no has registrado ningún WOD. Ve a <strong>Cámara</strong>, pestaña WOD, describe tu entrenamiento y pulsa &quot;Añadir a calorías quemadas&quot; para que quede aquí.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Dumbbell className="w-6 h-6 text-orange-400" />
        Registro de WODs
      </h2>
      <p className="text-sm text-gray-400">Ejercicios que has registrado (desde Cámara → WOD).</p>
      <ul className="space-y-3">
        {wods.map((wod) => (
          <li key={wod.id}>
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{formatDate(wod.date)}</p>
                  <p className="font-medium text-white mt-0.5">{wod.description}</p>
                  {wod.exercises && wod.exercises.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-400 list-disc list-inside space-y-0.5">
                      {wod.exercises.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold text-white">{wod.estimatedCaloriesBurned}</span>
                  <span className="text-xs text-gray-400">kcal</span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
