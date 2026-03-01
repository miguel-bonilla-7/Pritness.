import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { useUser, type Goal, type UserProfile } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import { calculateTMB, getTargetsFromGoal } from '../lib/tmb'
import { updateProfileInDb } from '../lib/supabase'
import { mapDbProfileToUserProfile } from '../lib/supabase'

const OBJETIVOS: { value: Goal; label: string }[] = [
  { value: 'definir_masa', label: 'Definir cuerpo' },
  { value: 'ganar_masa', label: 'Ganar masa muscular' },
  { value: 'perder_peso', label: 'Perder peso' },
]

interface EditarPerfilModalProps {
  open: boolean
  onClose: () => void
}

export function EditarPerfilModal({ open, onClose }: EditarPerfilModalProps) {
  const { profile, setProfile } = useUser()
  const { refetchProfile } = useAuth()
  const [nombre, setNombre] = useState('')
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [edad, setEdad] = useState('')
  const [sexo, setSexo] = useState<'male' | 'female'>('male')
  const [objetivo, setObjetivo] = useState<Goal>('definir_masa')
  const [pais, setPais] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (profile && open) {
      setNombre(profile.name)
      setPeso(String(profile.weight))
      setAltura(String(profile.height))
      setEdad(String(profile.age))
      setSexo(profile.sex ?? 'male')
      setObjetivo(profile.goal)
      setPais(profile.country ?? '')
    }
  }, [profile, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return
    setError('')
    const w = parseFloat(peso.replace(',', '.'))
    const h = parseFloat(altura.replace(',', '.'))
    const a = parseInt(edad, 10)
    if (!nombre.trim()) {
      setError('Nombre obligatorio')
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

    const tmb = calculateTMB(w, h, a, sexo)
    const targets = getTargetsFromGoal(tmb, objetivo)

    setGuardando(true)
    try {
      const { data, error: err } = await updateProfileInDb(profile.id, {
        name: nombre.trim(),
        weight: w,
        height: h,
        age: a,
        sex: sexo,
        goal: objetivo,
        tmb,
        daily_calories_target: targets.dailyCaloriesTarget,
        protein_target: targets.proteinTarget,
        carbs_target: targets.carbsTarget,
        fat_target: targets.fatTarget,
      })
      if (err) {
        setError(err.message)
        return
      }
      const actualizado: UserProfile = {
        ...profile,
        name: nombre.trim(),
        weight: w,
        height: h,
        age: a,
        sex: sexo,
        goal: objetivo,
        country: pais.trim() || undefined,
        tmb,
        dailyCaloriesTarget: targets.dailyCaloriesTarget,
        proteinTarget: targets.proteinTarget,
        carbsTarget: targets.carbsTarget,
        fatTarget: targets.fatTarget,
      }
      if (data) {
        const mapeado = mapDbProfileToUserProfile(data)
        setProfile({ ...mapeado, id: profile.id })
      } else {
        setProfile(actualizado)
      }
      await refetchProfile()
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Tu nombre"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Peso (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Altura (cm)</label>
            <input
              type="text"
              inputMode="numeric"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Edad</label>
            <input
              type="text"
              inputMode="numeric"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="25"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">País</label>
          <input
            type="text"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
            placeholder="Colombia, México, España..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sexo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSexo('male')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                sexo === 'male' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Hombre
            </button>
            <button
              type="button"
              onClick={() => setSexo('female')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                sexo === 'female' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              Mujer
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Objetivo</label>
          <div className="space-y-2">
            {OBJETIVOS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setObjetivo(o.value)}
                className={`w-full rounded-xl py-3 px-4 text-left text-sm font-medium transition-colors ${
                  objetivo === o.value ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-black' : 'bg-white/5 text-gray-300'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={guardando}
          className="w-full rounded-xl py-3.5 bg-white text-black font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </Modal>
  )
}
