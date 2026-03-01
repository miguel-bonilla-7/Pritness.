import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import { updateNotificationPreference } from '../lib/supabase'
import { registerPushForProfile } from '../lib/push'

export function NotificationPrompt() {
  const { profile } = useUser()
  const { refetchProfile } = useAuth()
  const [choosing, setChoosing] = useState(false)

  const show = profile?.id && profile?.notification_prompt_shown === false

  const handleChoice = async (wants: boolean) => {
    if (!profile?.id || choosing) return
    setChoosing(true)
    try {
      await updateNotificationPreference(profile.id, wants)
      if (wants) {
        await registerPushForProfile(profile.id)
      }
      await refetchProfile()
    } finally {
      setChoosing(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center px-4 pb-24">
      <div
        className="absolute inset-0 bg-black/70"
        aria-hidden
      />
      <div
        className="relative w-full max-w-[320px] rounded-2xl px-5 py-4"
        style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-sm text-white/80 text-center mb-1">
          ¿Quieres recibir notificaciones?
        </p>
        <p className="text-xs text-white/40 text-center mb-4">
          Recordatorios de agua, comidas y ejercicio según tus metas
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleChoice(false)}
            disabled={choosing}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors touch-manipulation disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => handleChoice(true)}
            disabled={choosing}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors touch-manipulation disabled:opacity-50"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  )
}
