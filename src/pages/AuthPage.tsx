import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/Card'

type Mode = 'login' | 'register'

export function AuthPage() {
  const { configured, loading, session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!usuario.trim() || !password) {
      setError('Usuario y contraseña requeridos')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(usuario.trim(), password)
        if (err) setError(err.message)
      } else {
        const { error: err } = await signUp(usuario.trim(), password)
        if (err) setError(err.message)
        else setSuccess('Cuenta creada. Completa tu perfil en el siguiente paso.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-gray-400">Comprobando sesión...</p>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
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
    <div className="min-h-screen bg-app flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">Pritness</h1>
        <p className="text-gray-400 text-center text-sm">Inicia sesión o regístrate con usuario y contraseña</p>

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
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </Card>

        <p className="text-gray-500 text-xs text-center">
          Solo conectado a Supabase. Revisa la consola (F12) para depuración.
        </p>
      </div>
    </div>
  )
}
