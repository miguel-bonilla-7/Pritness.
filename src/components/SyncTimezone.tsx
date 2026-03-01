import { useEffect, useRef } from 'react'
import { useUser } from '../context/UserContext'
import { updateProfileInDb } from '../lib/supabase'

/** Sincroniza la zona horaria del dispositivo al perfil para notificaciones a su hora local */
export function SyncTimezone() {
  const { profile } = useUser()
  const lastTzRef = useRef<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!tz || tz === lastTzRef.current || tz === profile.timezone) return
      lastTzRef.current = tz
      updateProfileInDb(profile.id, { timezone: tz })
    } catch {}
  }, [profile?.id, profile?.timezone])

  return null
}
