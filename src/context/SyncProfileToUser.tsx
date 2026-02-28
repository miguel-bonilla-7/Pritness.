import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useUser } from './UserContext'
import type { UserProfile } from './UserContext'

/** Sincroniza profileFromDb (Supabase) con UserContext para que la app use un solo perfil */
export function SyncProfileToUser() {
  const { profileFromDb } = useAuth()
  const { setProfile } = useUser()

  useEffect(() => {
    setProfile(profileFromDb as UserProfile | null)
  }, [profileFromDb, setProfile])

  return null
}
