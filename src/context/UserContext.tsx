import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type Goal = 'definir_masa' | 'ganar_masa' | 'perder_peso'

export interface UserProfile {
  id?: string
  name: string
  weight: number
  height: number
  age: number
  goal: Goal
  tmb: number
  dailyCaloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  sex?: 'male' | 'female'
}

interface UserContextValue {
  profile: UserProfile | null
  setProfile: (p: UserProfile | null) => void
  updateProfile: (p: Partial<UserProfile>) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null)

  const setProfile = useCallback((p: UserProfile | null) => {
    setProfileState(p)
    if (p) localStorage.setItem('pritness_profile', JSON.stringify(p))
    else localStorage.removeItem('pritness_profile')
  }, [])

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfileState((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...partial }
      localStorage.setItem('pritness_profile', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <UserContext.Provider value={{ profile, setProfile, updateProfile }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
