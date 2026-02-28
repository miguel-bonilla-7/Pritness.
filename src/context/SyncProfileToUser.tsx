import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useUser } from './UserContext'
import type { UserProfile } from './UserContext'

/** Sincroniza profileFromDb (Supabase) con UserContext. No borra el perfil en caché mientras se carga. */
export function SyncProfileToUser() {
  const { profileFromDb, profileLoading } = useAuth()
  const { setProfile } = useUser()

  useEffect(() => {
    if (profileFromDb !== null) {
      setProfile(profileFromDb as UserProfile)
      return
    }
    if (!profileLoading) {
      setProfile(null)
    }
  }, [profileFromDb, profileLoading, setProfile])

  return null
}
