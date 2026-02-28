import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'
import { Card } from '../components/Card'
import { EditarPerfilModal } from '../components/EditarPerfilModal'

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

  return (
    <div className="p-4 space-y-5">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">{profile.name}</h2>
              <p className="text-xs text-gray-400">
                Objetivo: {profile.goal === 'perder_peso' ? 'Perder peso' : profile.goal === 'ganar_masa' ? 'Ganar masa' : 'Definir cuerpo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMostrarEditar(true)}
            className="rounded-xl p-2.5 bg-white/10 text-gray-300 hover:bg-white/15 transition-colors"
            title="Editar perfil"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-gray-400">Peso</p>
            <p className="font-semibold text-white">{profile.weight} kg</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-gray-400">Altura</p>
            <p className="font-semibold text-white">{profile.height} cm</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-gray-400">Calorías/día</p>
            <p className="font-semibold text-white">{profile.dailyCaloriesTarget}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-gray-400">Proteína (g)</p>
            <p className="font-semibold text-white">{profile.proteinTarget}</p>
          </div>
        </div>
      </Card>

      <EditarPerfilModal open={mostrarEditar} onClose={() => setMostrarEditar(false)} />

      <Card>
        <p className="text-sm text-gray-400 mb-3">Sesión conectada a Supabase.</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-xl py-2.5 bg-white/10 text-gray-300 font-medium hover:bg-white/15 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </Card>
    </div>
  )
}
