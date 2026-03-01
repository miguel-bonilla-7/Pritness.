import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { User, Lock, Ruler, Weight, Calendar, Flame, Dumbbell, TrendingDown, X, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useUser, type Goal, type UserProfile } from '../context/UserContext'
import { PageSpinner } from '../components/PageSpinner'
import { supabase, insertProfile, insertWeightLog } from '../lib/supabase'
import { calculateTMB, getTargetsFromGoal } from '../lib/tmb'

type Mode = 'login' | 'register' | null

const GOALS: { value: Goal; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'definir_masa', label: 'Definir cuerpo', description: 'Marcar músculo y reducir grasa', icon: <Flame className="w-4 h-4" /> },
  { value: 'ganar_masa', label: 'Ganar masa muscular', description: 'Aumentar volumen y fuerza', icon: <Dumbbell className="w-4 h-4" /> },
  { value: 'perder_peso', label: 'Perder peso', description: 'Bajar de peso saludablemente', icon: <TrendingDown className="w-4 h-4" /> },
]

const inputBase =
  'w-full rounded-2xl bg-white/[0.07] border border-white/[0.09] pl-11 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-sm'

function Field({ icon, label, ...props }: { icon: React.ReactNode; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">{icon}</span>
        <input {...props} className={inputBase} />
      </div>
    </div>
  )
}

/* Animated aurora blob */
function Blob({ color, size, x, y, duration, delay = 0, opacity = 0.6, blur }: {
  color: string; size: number; x: number[]; y: number[]; duration: number; delay?: number; opacity?: number; blur?: number
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, background: color, filter: `blur(${blur ?? size * 0.38}px)`, opacity }}
      animate={{ x, y }}
      transition={{ duration, delay, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
    />
  )
}

export function AuthPage() {
  const navigate = useNavigate()
  const { configured, loading, session, signIn, signUp } = useAuth()
  const { setProfile } = useUser()
  const [mode, setMode] = useState<Mode>(null)
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [goal, setGoal] = useState<Goal>('definir_masa')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const close = () => { setMode(null); setError('') }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!usuario.trim() || !password) { setError('Usuario y contraseña requeridos'); return }
    setSubmitting(true)
    try {
      const { error: err } = await signIn(usuario.trim(), password)
      if (err) setError(err.message)
      else navigate('/dashboard', { replace: true })
    } finally { setSubmitting(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!usuario.trim() || !password) { setError('Usuario y contraseña requeridos'); return }
    if (!name.trim()) { setError('Nombre requerido'); return }
    const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age, 10)
    if (isNaN(w) || w <= 0 || w > 300) { setError('Ingresa un peso válido (kg)'); return }
    if (isNaN(h) || h <= 0 || h > 250) { setError('Ingresa una altura válida (cm)'); return }
    if (isNaN(a) || a < 10 || a > 120) { setError('Ingresa una edad válida'); return }
    setSubmitting(true)
    try {
      const { error: err } = await signUp(usuario.trim(), password)
      if (err) { setError(err.message); return }
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s?.user?.id) { setError('No se pudo iniciar sesión. Intenta de nuevo.'); return }
      const username = usuario.trim().toLowerCase().replace(/\s+/g, '')
      const tmb = calculateTMB(w, h, a, sex)
      const targets = getTargetsFromGoal(tmb, goal)
      const profileData: UserProfile = { name: name.trim(), weight: w, height: h, age: a, goal, sex, tmb, ...targets }
      const { data: inserted, error: insertErr } = await insertProfile(s.user.id, {
        username, name: profileData.name, weight: profileData.weight, height: profileData.height,
        age: profileData.age, goal: profileData.goal, sex: profileData.sex ?? null, tmb: profileData.tmb,
        daily_calories_target: profileData.dailyCaloriesTarget, protein_target: profileData.proteinTarget,
        carbs_target: profileData.carbsTarget, fat_target: profileData.fatTarget,
      })
      if (insertErr) { setError(insertErr.message); return }
      if (inserted) {
        profileData.id = inserted.id
        await insertWeightLog(inserted.id, profileData.weight)
      }
      setProfile(profileData)
      navigate('/dashboard', { replace: true })
    } finally { setSubmitting(false) }
  }

  if (loading) return <PageSpinner />
  if (session) return <Navigate to="/dashboard" replace />
  if (!configured) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <h1 className="text-white font-bold text-xl">Configura Supabase</h1>
          <div className="bg-white/5 rounded-2xl p-4 font-mono text-xs text-white/40 space-y-1 text-left">
            <p>VITE_SUPABASE_URL=tu-url</p>
            <p>VITE_SUPABASE_ANON_KEY=tu-key</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-black">

      {/* ── HERO: animated aurora gradient ── */}
      <div className="relative flex-1 overflow-hidden flex flex-col items-center justify-center">
        {/* Blobs */}
        {/* Círculos lentos y constantes — rutas cerradas para loop sin salto */}
        <Blob color="#f97316" size={280} opacity={0.65}
          x={[-60, 40, 120, 60, -40, -120, -60]} y={[-80, -120, 0, 100, 120, 40, -80]}
          duration={18} delay={0} />
        <Blob color="#7c3aed" size={320} opacity={0.6}
          x={[80, 160, 80, -40, -120, -40, 80]} y={[60, -40, -120, -80, 20, 120, 60]}
          duration={22} delay={2} />
        <Blob color="#a855f7" size={220} opacity={0.55}
          x={[20, 120, 160, 60, -60, -140, 20]} y={[120, 60, -40, -120, -60, 40, 120]}
          duration={16} delay={4} />
        <Blob color="#ec4899" size={180} opacity={0.5}
          x={[-100, -20, 80, 140, 60, -60, -100]} y={[40, -80, -120, 0, 100, 140, 40]}
          duration={20} delay={1} />
        <Blob color="#eab308" size={160} opacity={0.5}
          x={[60, 140, 60, -60, -140, -60, 60]} y={[-100, 20, 120, 100, 0, -100, -100]}
          duration={14} delay={3} />
        <Blob color="#06b6d4" size={200} opacity={0.45}
          x={[-140, -40, 60, 140, 40, -80, -140]} y={[20, 120, 100, -20, -120, -80, 20]}
          duration={25} delay={0} />
        <Blob color="#f97316" size={140} opacity={0.4} blur={50}
          x={[100, 0, -100, -60, 60, 140, 100]} y={[80, 160, 80, -60, -120, -20, 80]}
          duration={12} delay={6} />

        {/* Vignette overlay so text is always readable */}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)' }} />

        {/* Brand text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 text-center select-none"
        >
          <h1 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
            Pritness
          </h1>
          <p className="text-white/50 text-base font-medium mt-3 tracking-wide">
            El lugar donde pri hace ejercicio
          </p>
        </motion.div>
      </div>

      {/* ── BOTTOM PANEL: buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        className="relative z-10 bg-black px-6 pt-8 pb-10 space-y-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode('login')}
          className="w-full rounded-2xl py-4 font-bold text-black text-base flex items-center justify-between px-5 bg-white"
          style={{ boxShadow: '0 4px 24px rgba(255,255,255,0.15)' }}
        >
          <span>Iniciar sesión</span>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setMode('register')}
          className="w-full rounded-2xl py-4 font-bold text-black text-base flex items-center justify-between px-5 bg-white"
          style={{ boxShadow: '0 4px 24px rgba(255,255,255,0.15)' }}
        >
          <span>Registrarse</span>
          <ChevronRight className="w-5 h-5 opacity-50" />
        </motion.button>
      </motion.div>

      {/* ── BOTTOM SHEET: form ── */}
      <AnimatePresence>
        {mode !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-20 bg-black/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              className="fixed inset-x-0 bottom-0 z-30 bg-[#0a0a0a] rounded-t-3xl overflow-hidden"
              style={{ maxHeight: '92vh', borderTop: '1px solid rgba(255,255,255,0.08)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4">
                <div>
                  <h2 className="text-white font-bold text-xl">
                    {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </h2>
                  <p className="text-white/30 text-sm mt-0.5">
                    {mode === 'login' ? 'Bienvenido de vuelta' : 'Configura tu perfil'}
                  </p>
                </div>
                <button onClick={close} className="w-9 h-9 rounded-full bg-white/[0.07] flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable form */}
              <div className="overflow-y-auto px-6 pb-10" style={{ maxHeight: 'calc(92vh - 110px)' }}>
                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">

                  <Field icon={<User className="w-4 h-4" />} label="Usuario" type="text" autoComplete="username"
                    value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="tu_usuario" />

                  <Field icon={<Lock className="w-4 h-4" />} label="Contraseña"
                    type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

                  {mode === 'register' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <Field icon={<User className="w-4 h-4" />} label="Nombre completo" type="text"
                        value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Peso (kg)', icon: <Weight className="w-3.5 h-3.5" />, val: weight, set: setWeight, placeholder: '70', step: '0.1' },
                          { label: 'Altura (cm)', icon: <Ruler className="w-3.5 h-3.5" />, val: height, set: setHeight, placeholder: '175' },
                          { label: 'Edad', icon: <Calendar className="w-3.5 h-3.5" />, val: age, set: setAge, placeholder: '25' },
                        ].map(({ label, icon, val, set, placeholder, step }) => (
                          <div key={label} className="space-y-1.5">
                            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest px-0.5">{label}</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20">{icon}</span>
                              <input type="number" step={step} value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                                className="w-full rounded-xl bg-white/[0.07] border border-white/[0.09] pl-8 pr-2 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-all text-sm" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Sexo */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1">Sexo</label>
                        <div className="flex gap-2">
                          {(['male', 'female'] as const).map(s => (
                            <motion.button whileTap={{ scale: 0.96 }} key={s} type="button" onClick={() => setSex(s)}
                              className="flex-1 rounded-2xl py-3 text-sm font-semibold transition-all duration-200"
                              style={{
                                background: sex === s ? 'linear-gradient(135deg,#f97316,#7c3aed)' : 'rgba(255,255,255,0.06)',
                                color: sex === s ? '#fff' : 'rgba(255,255,255,0.35)',
                                border: sex === s ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              }}>
                              {s === 'male' ? 'Hombre' : 'Mujer'}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Objetivo */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest px-1">Objetivo</label>
                        <div className="space-y-2">
                          {GOALS.map(g => {
                            const active = goal === g.value
                            return (
                              <motion.button whileTap={{ scale: 0.98 }} key={g.value} type="button" onClick={() => setGoal(g.value)}
                                className="w-full rounded-2xl px-4 py-3.5 text-left flex items-center gap-3 transition-all duration-200"
                                style={{
                                  background: active ? 'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(124,58,237,0.15))' : 'rgba(255,255,255,0.04)',
                                  border: active ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.07)',
                                }}>
                                <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ background: active ? 'linear-gradient(135deg,#f97316,#7c3aed)' : 'rgba(255,255,255,0.07)', color: active ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                                  {g.icon}
                                </span>
                                <div>
                                  <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-white/50'}`}>{g.label}</p>
                                  <p className={`text-xs mt-0.5 ${active ? 'text-white/45' : 'text-white/25'}`}>{g.description}</p>
                                </div>
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {error && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={submitting}
                    className="w-full rounded-2xl py-4 font-bold text-white text-sm tracking-wide disabled:opacity-50 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#f97316 0%,#7c3aed 100%)', boxShadow: '0 4px 24px rgba(249,115,22,0.25)' }}>
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Cargando...
                      </span>
                    ) : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
