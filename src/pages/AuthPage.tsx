import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUser, type Goal, type UserProfile } from '../context/UserContext'
import { Card } from '../components/Card'
import { PageSpinner } from '../components/PageSpinner'
import { supabase, insertProfile } from '../lib/supabase'
import { calculateTMB, getTargetsFromGoal } from '../lib/tmb'

type Mode = 'login' | 'register'

const GOALS: { value: Goal; label: string }[] = [
  { value: 'definir_masa', label: 'Definir cuerpo' },
  { value: 'ganar_masa', label: 'Ganar masa muscular' },
  { value: 'perder_peso', label: 'Perder peso' },
]

const USUARIO_EMAIL_SUFFIX = '@pritness.local'
function usuarioAEmail(usuario: string): string {
  return usuario.trim().toLowerCase().replace(/\s+/g, '') + USUARIO_EMAIL_SUFFIX
}

export function AuthPage() {
  const navigate = useNavigate()
  const { configured, loading, session, signIn, signUp } = useAuth()
  const { setProfile } = useUser()
  const [mode, setMode] = useState<Mode>('login')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [goal, setGoal] = useState<Goal>('definir_masa')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!usuario.trim() || !password) {
      setError('Usuario y contraseña requeridos')
      return
    }
    setSubmitting(true)
    try {
      const { error: err } = await signIn(usuario.trim(), password)
      if (err) setError(err.message)
      else navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!usuario.trim() || !password) {
      setError('Usuario y contraseña requeridos')
      return
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Nombre requerido')
        return
      }
      const w = parseFloat(weight)
      const h = parseFloat(height)
      const a = parseInt(age, 10)
      if (isNaN(w) || w <= 0 || w > 300) {
        setError('Peso válido (kg)')
        return
      }
      if (isNaN(h) || h <= 0 || h > 250) {
        setError('Altura válida (cm)')
        return
      }
      if (isNaN(a) || a < 10 || a > 120) {
        setError('Edad válida (10-120)')
        return
      }
    }

    setSubmitting(true)
    try {
      const { error: err } = await signUp(usuario.trim(), password)
      if (err) {
        setError(err.message)
        return
      }
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (!newSession?.user?.id) {
        setError('No se pudo iniciar la sesión. Intenta de nuevo.')
        return
      }

      const username = usuario.trim().toLowerCase().replace(/\s+/g, '')
      const w = parseFloat(weight)
      const h = parseFloat(height)
      const a = parseInt(age, 10)
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

      const { data: inserted, error: insertErr } = await insertProfile(newSession.user.id, {
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
      if (inserted) profileData.id = inserted.id
      setProfile(profileData)
      navigate('/dashboard', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = mode === 'login' ? handleLogin : handleRegister

  if (loading) {
    return <PageSpinner message="Comprobando sesión..." />
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  if (!configured) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-4">
        <Card className="max-w-md">
          <h1 className="text-xl font-bold text-white mb-2">Pritness</h1>
          <p className="text-gray-400 text-sm mb-4">
            Configura Supabase para usar inicio de sesión. Añade en <code className="bg-white/10 px-1 rounded">.env</code>:
          </p>
          <ul className="text-gray-500 text-xs space-y-1 font-mono">
            <li>VITE_SUPABASE_URL=tu-url</li>
            <li>VITE_SUPABASE_ANON_KEY=tu-key</li>
          </ul>
          <p className="text-gray-500 text-xs mt-4">
            Abre la consola del navegador (F12) para mensajes de depuración de Supabase.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-6 py-4">
        <h1 className="text-2xl font-bold text-white text-center">Pritness</h1>
        <p className="text-gray-400 text-center text-sm">
          {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta y tu perfil en un solo paso'}
        </p>

        <Card>
          <div className="flex rounded-xl bg-white/5 p-1 mb-4">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-card text-white shadow-card-glow' : 'text-gray-400'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'register' ? 'bg-card text-white shadow-card-glow' : 'text-gray-400'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Usuario</label>
              <input
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Tu nombre de usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="••••••••"
              />
            </div>

            {mode === 'register' && (
              <>
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
              </>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta e ir al inicio'}
            </button>
          </form>
        </Card>

        <p className="text-gray-500 text-xs text-center">
          Sesión guardada en este dispositivo. Revisa la consola (F12) para depuración.
        </p>
      </div>
    </div>
  )
}
