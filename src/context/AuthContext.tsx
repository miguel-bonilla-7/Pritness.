import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, fetchProfileByAuthId, mapDbProfileToUserProfile } from '../lib/supabase'

/** Supabase usa email; internamente usamos usuario@pritness.local para no pedir correo */
const USUARIO_EMAIL_SUFFIX = '@pritness.local'

function usuarioAEmail(usuario: string): string {
  return usuario.trim().toLowerCase().replace(/\s+/g, '') + USUARIO_EMAIL_SUFFIX
}

export interface AuthProfile {
  id: string
  name: string
  weight: number
  height: number
  age: number
  goal: 'definir_masa' | 'ganar_masa' | 'perder_peso'
  tmb: number
  dailyCaloriesTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  sex?: 'male' | 'female'
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profileFromDb: AuthProfile | null
  profileLoading: boolean
  loading: boolean
  configured: boolean
  signIn: (usuario: string, password: string) => Promise<{ error: Error | null }>
  signUp: (usuario: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refetchProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profileFromDb, setProfileFromDb] = useState<AuthProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(isSupabaseConfigured)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      console.debug('[Pritness Auth] Supabase no configurada, omitiendo auth')
      setLoading(false)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data: { session: s }, error }) => {
      if (!mounted) return
      if (error) {
        console.error('[Pritness Auth] getSession error:', error)
        setSession(null)
      } else {
        console.debug('[Pritness Auth] Sesión inicial:', s ? s.user.email : 'ninguna')
        setSession(s)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return
      console.debug('[Pritness Auth] onAuthStateChange:', event, s?.user?.email ?? 'sin sesión')
      setSession(s)
      if (!s) setProfileFromDb(null)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Wait until the initial session check is done before making any routing decisions
    if (loading) return

    if (!session?.user?.id || !isSupabaseConfigured) {
      setProfileFromDb(null)
      setProfileLoading(false)
      return
    }
    let mounted = true
    setProfileLoading(true)
    console.debug('[Pritness Auth] Cargando perfil desde Supabase para auth_id:', session.user.id)
    fetchProfileByAuthId(session.user.id)
      .then((db) => {
        if (!mounted) return
        if (db) {
          const mapped = mapDbProfileToUserProfile(db)
          setProfileFromDb(mapped)
          console.debug('[Pritness Auth] Perfil cargado:', mapped.name)
        } else {
          setProfileFromDb(null)
          console.debug('[Pritness Auth] Sin perfil en BD, usuario debe completar onboarding')
        }
      })
      .catch(() => {
        if (mounted) setProfileFromDb(null)
      })
      .finally(() => {
        if (mounted) setProfileLoading(false)
      })
    return () => { mounted = false }
  }, [loading, session?.user?.id])

  const signIn = useCallback(async (usuario: string, password: string) => {
    if (!isSupabaseConfigured) {
      console.warn('[Pritness Auth] signIn omitido: Supabase no configurada')
      return { error: new Error('Supabase no configurada') }
    }
    const email = usuarioAEmail(usuario)
    console.debug('[Pritness Auth] signIn intentando usuario:', usuario)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) console.error('[Pritness Auth] signIn error:', error.message)
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signUp = useCallback(async (usuario: string, password: string) => {
    if (!isSupabaseConfigured) {
      console.warn('[Pritness Auth] signUp omitido: Supabase no configurada')
      return { error: new Error('Supabase no configurada') }
    }
    const email = usuarioAEmail(usuario)
    console.debug('[Pritness Auth] signUp intentando usuario:', usuario)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) console.error('[Pritness Auth] signUp error:', error.message)
    return { error: error ? new Error(error.message) : null }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    console.debug('[Pritness Auth] signOut')
    await supabase.auth.signOut()
  }, [])

  const refetchProfile = useCallback(async () => {
    if (!session?.user?.id || !isSupabaseConfigured) return
    setProfileLoading(true)
    try {
      const db = await fetchProfileByAuthId(session.user.id)
      if (db) {
        const mapped = mapDbProfileToUserProfile(db)
        setProfileFromDb(mapped)
      } else setProfileFromDb(null)
    } finally {
      setProfileLoading(false)
    }
  }, [session?.user?.id])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profileFromDb,
    profileLoading,
    loading,
    configured: isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    refetchProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
