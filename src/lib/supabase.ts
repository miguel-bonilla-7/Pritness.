import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (isConfigured) {
  console.debug('[Pritness] Supabase config encontrada:', { url: supabaseUrl, keyLength: supabaseAnonKey?.length })
} else {
  console.warn('[Pritness] Supabase NO configurada. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    ...(typeof window !== 'undefined' && { storage: window.localStorage }),
  },
})

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
      const message = (error as { code?: string }).code === '23505'
        ? 'Ese nombre de usuario ya está en uso. Elige otro.'
        : error.message
      return { data: null, error: new Error(message) }
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

/** Inserta un WOD en Supabase */
export async function insertWod(
  profileId: string,
  wod: { date: string; description: string; calories_burned: number; source?: 'photo' | 'voice' | 'text' }
): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null }
  try {
    const { error } = await supabase.from('wods').insert({
      user_id: profileId,
      date: wod.date,
      description: wod.description,
      calories_burned: wod.calories_burned,
      source: wod.source ?? 'text',
    })
    if (error) {
      console.error('[Pritness] insertWod error:', error.message)
      return { error: new Error(error.message) }
    }
    return { error: null }
  } catch (err) {
    console.error('[Pritness] insertWod exception:', err)
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Lista WODs del usuario desde Supabase (opcional) */
export async function fetchWods(profileId: string, limit = 50): Promise<{ date: string; description: string | null; calories_burned: number | null }[]> {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('wods')
      .select('date, description, calories_burned')
      .eq('user_id', profileId)
      .order('date', { ascending: false })
      .limit(limit)
    if (error) return []
    return (data ?? []) as { date: string; description: string | null; calories_burned: number | null }[]
  } catch {
    return []
  }
}

/** Inserta un registro de agua en water_logs */
export async function insertWaterLog(
  profileId: string,
  amountMl: number
): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null }
  const today = new Date().toISOString().slice(0, 10)
  try {
    const { error } = await supabase.from('water_logs').insert({
      user_id: profileId,
      date: today,
      amount_ml: amountMl,
    })
    if (error) {
      console.error('[Pritness] insertWaterLog error:', error.message)
      return { error: new Error(error.message) }
    }
    console.debug('[Pritness] Agua guardada en Supabase:', amountMl, 'ml')
    return { error: null }
  } catch (err) {
    console.error('[Pritness] insertWaterLog exception:', err)
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Obtiene el total de agua (ml) del día actual para un perfil */
export async function fetchTodayWaterMl(profileId: string): Promise<number> {
  if (!isConfigured) return 0
  const today = new Date().toISOString().slice(0, 10)
  try {
    const { data, error } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', profileId)
      .eq('date', today)
    if (error) return 0
    return (data ?? []).reduce((sum, r) => sum + (Number(r.amount_ml) || 0), 0)
  } catch {
    return 0
  }
}

/** Obtiene el total de calorías y proteínas del día actual para un perfil */
export async function fetchTodayMealTotals(
  profileId: string
): Promise<{ calories: number; protein: number }> {
  if (!isConfigured) return { calories: 0, protein: 0 }
  const today = new Date().toISOString().slice(0, 10)
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('calories, protein')
      .eq('user_id', profileId)
      .eq('date', today)
    if (error) return { calories: 0, protein: 0 }
    return (data ?? []).reduce(
      (sum, r) => ({
        calories: sum.calories + (Number(r.calories) || 0),
        protein: sum.protein + (Number(r.protein) || 0),
      }),
      { calories: 0, protein: 0 }
    )
  } catch {
    return { calories: 0, protein: 0 }
  }
}

/** Obtiene los WODs del usuario desde Supabase (para historial completo) */
export async function fetchAllWods(profileId: string): Promise<{
  id?: string
  date: string
  description: string | null
  calories_burned: number | null
}[]> {
  if (!isConfigured) return []
  try {
    const { data, error } = await supabase
      .from('wods')
      .select('id, date, description, calories_burned')
      .eq('user_id', profileId)
      .order('date', { ascending: false })
      .limit(100)
    if (error) return []
    return (data ?? []) as { id?: string; date: string; description: string | null; calories_burned: number | null }[]
  } catch {
    return []
  }
}

/** Inserta un registro de peso (weight_logs) */
export async function insertWeightLog(
  profileId: string,
  weightKg: number,
  date?: string
): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null }
  const d = date ?? new Date().toISOString().slice(0, 10)
  try {
    const { error } = await supabase.from('weight_logs').insert({
      user_id: profileId,
      date: d,
      weight_kg: weightKg,
    })
    if (error) {
      console.error('[Pritness] insertWeightLog error:', error.message)
      return { error: new Error(error.message) }
    }
    console.debug('[Pritness] Peso guardado en Supabase:', weightKg, 'kg')
    return { error: null }
  } catch (err) {
    console.error('[Pritness] insertWeightLog exception:', err)
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Obtiene las comidas individuales de hoy */
export async function fetchTodayMeals(profileId: string): Promise<{
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  meal_type: string
  date: string
}[]> {
  if (!isConfigured) return []
  const today = new Date().toISOString().slice(0, 10)
  try {
    const { data, error } = await supabase
      .from('meals')
      .select('id, name, calories, protein, carbs, fat, meal_type, date')
      .eq('user_id', profileId)
      .eq('date', today)
      .order('created_at', { ascending: false })
    if (error) return []
    return (data ?? []) as { id: string; name: string; calories: number; protein: number; carbs: number; fat: number; meal_type: string; date: string }[]
  } catch {
    return []
  }
}

/** Elimina una comida por id */
export async function deleteMeal(mealId: string): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null }
  try {
    const { error } = await supabase.from('meals').delete().eq('id', mealId)
    if (error) return { error: new Error(error.message) }
    return { error: null }
  } catch (err) {
    return { error: err instanceof Error ? err : new Error(String(err)) }
  }
}

/** Elimina un WOD por id */
export async function deleteWod(wodId: string): Promise<{ error: Error | null }> {
  if (!isConfigured) return { error: null }
  try {
    const { error } = await supabase.from('wods').delete().eq('id', wodId)
    if (error) return { error: new Error(error.message) }
    return { error: null }
  } catch (err) {
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
