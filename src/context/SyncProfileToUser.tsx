import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useUser } from './UserContext'
import type { UserProfile } from './UserContext'

/**
 * Sincroniza profileFromDb (Supabase) con UserContext.
 * - Si hay sesión y hay perfil en BD → actualizar perfil en contexto.
 * - Si NO hay sesión (logout) → borrar perfil.
 * - Si hay sesión pero la BD no devuelve perfil → NO borrar; mantener el perfil en caché (localStorage)
 *   para no mandar al usuario a onboarding cada vez que salga y vuelva.
 */
export function SyncProfileToUser() {
  const { session, profileFromDb, profileLoading } = useAuth()
  const { setProfile } = useUser()

  useEffect(() => {
    if (!session) {
      setProfile(null)
      return
    }
    if (profileFromDb !== null) {
      setProfile(profileFromDb as UserProfile)
    }
    // Si hay sesión y profileFromDb es null (BD sin perfil o error): no hacer setProfile(null),
    // así se mantiene el perfil cargado desde localStorage y no rebota a onboarding.
  }, [session, profileFromDb, profileLoading, setProfile])

  return null
}
