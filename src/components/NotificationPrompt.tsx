import { useState } from 'react'
import { useUser } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import { updateNotificationPreference } from '../lib/supabase'
import { registerPushForProfile } from '../lib/push'

const LS_KEY = 'pritness_notification_answered'

function hasAnsweredForProfile(profileId: string): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return false
    const ids = JSON.parse(raw) as string[]
    return Array.isArray(ids) && ids.includes(profileId)
  } catch {
    return false
  }
}

function markAnsweredForProfile(profileId: string) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(profileId)) {
      ids.push(profileId)
      localStorage.setItem(LS_KEY, JSON.stringify(ids))
    }
  } catch {}
}

export function NotificationPrompt() {
  const { profile, setProfile } = useUser()
  const { refetchProfile } = useAuth()
  const [choosing, setChoosing] = useState(false)

  const fromDb = (profile?.notification_prompt_shown ?? false) === true
  const fromLs = profile?.id ? hasAnsweredForProfile(profile.id) : false
  const alreadyAnswered = fromDb || fromLs
  const show = profile?.id && !alreadyAnswered

  const handleChoice = async (wants: boolean) => {
    if (!profile?.id || choosing) return
    setChoosing(true)
    markAnsweredForProfile(profile.id)
    setProfile({ ...profile, notification_prompt_shown: true })
    try {
      const { error } = await updateNotificationPreference(profile.id, wants)
      if (!error) {
        if (wants) await registerPushForProfile(profile.id)
        await refetchProfile()
      }
    } catch (e) {
      console.warn('[NotificationPrompt] Error:', e)
    } finally {
      setChoosing(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" aria-hidden />
      <div
        className="relative z-10 w-full max-w-[320px] rounded-2xl px-5 py-4"
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice(true) }}
            disabled={choosing}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors touch-manipulation disabled:opacity-50 min-h-[44px]"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice(false) }}
            disabled={choosing}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors touch-manipulation disabled:opacity-50 min-h-[44px]"
          >
            No
          </button>
        </div>
      </div>
    </div>
  )
}
