import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUser, type Goal, type UserProfile } from '../context/UserContext'
import { calculateTMB, getTargetsFromGoal } from '../lib/tmb'
import { insertProfile } from '../lib/supabase'
import { Card } from '../components/Card'

const GOALS: { value: Goal; label: string }[] = [
  { value: 'definir_masa', label: 'Definir cuerpo' },
  { value: 'ganar_masa', label: 'Ganar masa muscular' },
  { value: 'perder_peso', label: 'Perder peso' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { setProfile } = useUser()
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [goal, setGoal] = useState<Goal>('definir_masa')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseInt(age, 10)
    if (!name.trim()) {
      setError('Nombre requerido')
      return
    }
    if (isNaN(w) || w <= 0 || w > 300) {
      setError('Peso válido (kg)')
      return
    }
    if (isNaN(h) || h <= 0 || h > 250) {
      setError('Altura válida (cm)')
      return
    }
    if (isNaN(a) || a < 10 || a > 120) {
      setError('Edad válida')
      return
    }

    const tmb = calculateTMB(w, h, a, sex)
    const targets = getTargetsFromGoal(tmb, goal)

    const profileData: UserProfile = {
      name: name.trim(),
      weight: w,
      height: h,
      age: a,
      goal,
      sex,
      tmb,
      ...targets,
    }

    setSubmitting(true)
    try {
      if (session?.user?.id) {
        const email = session.user.email ?? ''
        const username = email.replace(/@pritness\.local$/i, '').trim() || 'user'
        const { data, error: insertErr } = await insertProfile(session.user.id, {
          username,
          name: profileData.name,
          weight: profileData.weight,
          height: profileData.height,
          age: profileData.age,
          goal: profileData.goal,
          sex: profileData.sex ?? null,
          tmb: profileData.tmb,
          daily_calories_target: profileData.dailyCaloriesTarget,
          protein_target: profileData.proteinTarget,
          carbs_target: profileData.carbsTarget,
          fat_target: profileData.fatTarget,
        })
        if (insertErr) {
          setError(insertErr.message)
          return
        }
        if (data) {
          profileData.id = data.id
          console.debug('[Pritness Onboarding] Perfil guardado en Supabase:', data.id)
        }
      }
      setProfile(profileData)
      navigate('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-app overflow-y-auto">
      <div className="p-4 py-6 flex flex-col items-center justify-center min-h-full">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">Pritness</h1>
        <p className="text-gray-400 text-center text-sm">Crea tu perfil para empezar</p>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Tu nombre"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Peso (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Altura (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Edad</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="25"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sexo</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSex('male')}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    sex === 'male' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Hombre
                </button>
                <button
                  type="button"
                  onClick={() => setSex('female')}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    sex === 'female' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Mujer
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Objetivo</label>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGoal(g.value)}
                    className={`w-full rounded-xl py-3 px-4 text-left text-sm font-medium transition-colors ${
                      goal === g.value ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black' : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3.5 bg-white text-black font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Empezar'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  )
}
