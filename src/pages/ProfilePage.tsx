import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'
import { EditarPerfilModal } from '../components/EditarPerfilModal'

const GOAL_LABEL: Record<string, string> = {
  perder_peso: 'Perder peso',
  ganar_masa: 'Ganar masa',
  definir: 'Definir cuerpo',
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { profile } = useUser()
  const [mostrarEditar, setMostrarEditar] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  if (!profile) return null

  const stats = [
    { label: 'Peso',         value: `${profile.weight} kg` },
    { label: 'Altura',       value: `${profile.height} cm` },
    { label: 'Calorías/día', value: String(profile.dailyCaloriesTarget) },
    { label: 'Proteína',     value: `${profile.proteinTarget} g` },
  ]

  return (
    <div className="p-5 space-y-8 overflow-auto min-h-0">

      {/* Identity row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-white">{profile.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{GOAL_LABEL[profile.goal] ?? profile.goal}</p>
        </div>
        <button
          type="button"
          onClick={() => setMostrarEditar(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-gray-500 active:bg-white/[0.08] transition-colors"
          aria-label="Editar perfil"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats */}
      <div className="space-y-0">
        {stats.map((s, i) => (
          <div key={s.label}>
            <div className="flex items-baseline justify-between py-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest">{s.label}</span>
              <span className="text-sm font-medium text-white">{s.value}</span>
            </div>
            {i < stats.length - 1 && <div className="h-px bg-white/[0.05]" />}
          </div>
        ))}
      </div>

      <EditarPerfilModal open={mostrarEditar} onClose={() => setMostrarEditar(false)} />

      {/* Sign out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full rounded-xl py-2.5 border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-gray-500 flex items-center justify-center gap-2 active:bg-white/[0.07] transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" />
        Cerrar sesión
      </button>
    </div>
  )
}
