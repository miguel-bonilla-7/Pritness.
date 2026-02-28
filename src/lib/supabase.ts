import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (isConfigured) {
  console.debug('[Pritness] Supabase config encontrada:', { url: supabaseUrl, keyLength: supabaseAnonKey?.length })
} else {
  console.warn('[Pritness] Supabase NO configurada. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Comprueba conexión a Supabase y deja mensajes en consola */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isConfigured) {
    console.debug('[Pritness] checkSupabaseConnection: omitido (Sin config)')
    return false
  }
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('[Pritness] Supabase getSession error:', error.message)
      return false
    }
    console.debug('[Pritness] Supabase conectada. Sesión:', session ? 'activa' : 'ninguna')
    return true
  } catch (err) {
    console.error('[Pritness] Supabase conexión fallida:', err)
    return false
  }
}

export { isConfigured as isSupabaseConfigured }

/** Perfil tal como viene de la tabla profiles */
export interface DbProfile {
  id: string
  auth_id: string
  username: string
  name: string
  weight: number
  height: number
  age: number
  goal: string
  sex: string | null
  tmb: number
  daily_calories_target: number
  protein_target: number
  carbs_target: number
  fat_target: number
  created_at: string
  updated_at: string
}

/** Obtiene el perfil del usuario actual (auth_id) desde Supabase */
export async function fetchProfileByAuthId(authId: string): Promise<DbProfile | null> {
  if (!isConfigured) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle()
    if (error) {
      console.error('[Pritness] fetchProfile error:', error.message)
      return null
    }
    if (data) console.debug('[Pritness] Perfil cargado desde Supabase:', data.id)
    return data as DbProfile
  } catch (err) {
    console.error('[Pritness] fetchProfile exception:', err)
    return null
  }
}

/** Inserta un perfil en Supabase (auth_id del usuario logueado). username = nombre de usuario para login (sin correo). */
export async function insertProfile(
  authId: string,
  profile: {
    username: string
    name: string
    weight: number
    height: number
    age: number
    goal: string
    sex: string | null
    tmb: number
    daily_calories_target: number
    protein_target: number
    carbs_target: number
    fat_target: number
  }
): Promise<{ data: DbProfile | null; error: Error | null }> {
  if (!isConfigured) return { data: null, error: new Error('Supabase no configurada') }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        auth_id: authId,
        username: profile.username.trim().toLowerCase().replace(/\s+/g, ''),
        name: profile.name,
        weight: profile.weight,
        height: profile.height,
        age: profile.age,
        goal: profile.goal,
        sex: profile.sex,
        tmb: profile.tmb,
        daily_calories_target: profile.daily_calories_target,
        protein_target: profile.protein_target,
        carbs_target: profile.carbs_target,
        fat_target: profile.fat_target,
      })
      .select()
      .single()
    if (error) {
      console.error('[Pritness] insertProfile error:', error.message)
      return { data: null, error: new Error(error.message) }
    }
    console.debug('[Pritness] Perfil creado en Supabase:', (data as DbProfile).id)
    return { data: data as DbProfile, error: null }
  } catch (err) {
    console.error('[Pritness] insertProfile exception:', err)
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Actualiza el perfil en Supabase */
export async function updateProfileInDb(
  profileId: string,
  updates: {
    username?: string
    name?: string
    weight?: number
    height?: number
    age?: number
    goal?: string
    sex?: string | null
    tmb?: number
    daily_calories_target?: number
    protein_target?: number
    carbs_target?: number
    fat_target?: number
  }
): Promise<{ data: DbProfile | null; error: Error | null }> {
  if (!isConfigured) return { data: null, error: new Error('Supabase no configurada') }
  const payload = { ...updates }
  if (payload.username !== undefined) {
    payload.username = payload.username.trim().toLowerCase().replace(/\s+/g, '')
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', profileId)
      .select()
      .single()
    if (error) {
      console.error('[Pritness] updateProfile error:', error.message)
      return { data: null, error: new Error(error.message) }
    }
    console.debug('[Pritness] Perfil actualizado en Supabase:', profileId)
    return { data: data as DbProfile, error: null }
  } catch (err) {
    console.error('[Pritness] updateProfile exception:', err)
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Inserta una comida en el historial (tabla meals) */
export async function insertMeal(
  profileId: string,
  meal: {
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    name: string
    calories: number
    protein: number
    carbs?: number
    fat?: number
    source?: 'manual' | 'ai_vision'
  }
): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null }
  try {
    const today = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('meals').insert({
      user_id: profileId,
      date: today,
      meal_type: meal.meal_type,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs ?? 0,
      fat: meal.fat ?? 0,
      source: meal.source ?? 'manual',
    })
    if (error) {
      console.error('[Pritness] insertMeal error:', error.message)
      return { error: new Error(error.message) }
    }
    console.debug('[Pritness] Comida guardada en Supabase')
    return { error: null }
  } catch (err) {
    console.error('[Pritness] insertMeal exception:', err)
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Mapea fila de Supabase al tipo UserProfile de la app */
export function mapDbProfileToUserProfile(db: DbProfile): {
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
} {
  return {
    id: db.id,
    name: db.name,
    weight: Number(db.weight),
    height: Number(db.height),
    age: db.age,
    goal: db.goal as 'definir_masa' | 'ganar_masa' | 'perder_peso',
    tmb: Number(db.tmb),
    dailyCaloriesTarget: db.daily_calories_target,
    proteinTarget: db.protein_target,
    carbsTarget: db.carbs_target,
    fatTarget: db.fat_target,
    sex: db.sex === 'male' || db.sex === 'female' ? db.sex : undefined,
  }
}
