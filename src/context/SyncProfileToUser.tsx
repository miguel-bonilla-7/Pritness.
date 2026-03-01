import { useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useUser } from './UserContext'
import { useDailyLog } from './DailyLogContext'
import type { UserProfile } from './UserContext'

/**
 * Bridges Supabase auth state → UserContext and DailyLogContext.
 *
 * - Syncs profileFromDb → UserContext whenever it changes.
 * - Calls syncFromDb when a profile ID first appears so today's
 *   meals/water/WODs are fetched from Supabase (cross-device support).
 * - Clears state on logout.
 */
export function SyncProfileToUser() {
  const { session, profileFromDb, loading } = useAuth()
  const { setProfile } = useUser()
  const { syncFromDb, setProfileId } = useDailyLog()
  const lastSyncedId = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!session) {
      setProfile(null)
      setProfileId(null)
      lastSyncedId.current = null
      return
    }

    if (profileFromDb !== null) {
      setProfile(profileFromDb as UserProfile)
      setProfileId(profileFromDb.id)

      // Only sync from DB once per profile load (not on every re-render)
      if (lastSyncedId.current !== profileFromDb.id) {
        lastSyncedId.current = profileFromDb.id
        syncFromDb(profileFromDb.id)
      }
    }
  }, [loading, session, profileFromDb, setProfile, syncFromDb, setProfileId])

  return null
}
