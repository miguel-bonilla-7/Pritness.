import { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useUser } from './UserContext'
import type { UserProfile } from './UserContext'

/**
 * Sincroniza profileFromDb (Supabase) con UserContext.
 * - Si hay sesión y hay perfil en BD → actualizar perfil en contexto.
 * - Solo borrar perfil cuando la comprobación de sesión ha terminado Y no hay sesión (logout).
 *   Así no se borra el perfil al refrescar la página mientras getSession() aún no ha respondido.
 * - Si hay sesión pero la BD no devuelve perfil → mantener perfil en caché (localStorage).
 */
export function SyncProfileToUser() {
  const { session, profileFromDb, loading } = useAuth()
  const { setProfile } = useUser()

  useEffect(() => {
    if (loading) return
    if (!session) {
      setProfile(null)
      return
    }
    if (profileFromDb !== null) {
      setProfile(profileFromDb as UserProfile)
    }
  }, [loading, session, profileFromDb, setProfile])

  return null
}
