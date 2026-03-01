// Edge Function: envía notificaciones push programadas
// Invocar por cron (pg_cron + pg_net) cada hora
// Secrets: VAPID_KEYS_JSON (JSON con publicKey/privateKey en formato JWK), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@0.5'

const WATER_TARGET_ML = 2000

// Horarios en hora LOCAL del usuario: desayuno 8, agua 10, almuerzo 13, merienda 16, ejercicio 18, cena 20, proteína 22
const SCHEDULE: Record<number, { type: string; getMessage: (p: ProfileData, d: DayData) => string }> = {
  8: { type: 'breakfast', getMessage: (p) => `¡Buenos días, ${firstName(p.name)}! ☀️ ¿Ya desayunaste? Empieza el día con energía.` },
  10: { type: 'water', getMessage: (p, d) => `Hola ${firstName(p.name)}, 💧 ¿cómo va el agua? Llevas ${d.waterMl} ml de ${WATER_TARGET_ML} ml hoy.` },
  13: { type: 'lunch', getMessage: (p) => `${firstName(p.name)}, 🍽️ es hora del almuerzo. ¡Combina proteína y verduras!` },
  16: { type: 'snack', getMessage: (p) => `Merienda time, ${firstName(p.name)}. 🍎 Un snack saludable te da energía.` },
  18: { type: 'exercise', getMessage: (p) => `¿Listo para moverte, ${firstName(p.name)}? 💪 Registra tu entrenamiento en Pritness.` },
  20: { type: 'dinner', getMessage: (p) => `${firstName(p.name)}, 🌙 cena ligera y temprano ayuda a tu objetivo.` },
  22: {
    type: 'protein',
    getMessage: (p, d) => {
      const rest = p.proteinTarget - d.proteinEaten
      if (rest <= 0) return `${firstName(p.name)}, ¡llegaste a tu meta de proteína hoy! 🎉🥩`
      return `${firstName(p.name)}, te faltan ~${rest}g de proteína. 🥩 Una cena proteica o un batido pueden ayudar.`
    },
  },
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] || name
}

function getLocalHour(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      hour12: false,
      timeZone: timezone || 'UTC',
    })
    return parseInt(formatter.format(new Date()), 10)
  } catch {
    return new Date().getUTCHours()
  }
}

interface ProfileData {
  id: string
  name: string
  goal: string
  protein_target: number
  daily_calories_target: number
  timezone?: string | null
}

interface DayData {
  waterMl: number
  proteinEaten: number
  caloriesEaten: number
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url)
    const isTest = url.searchParams.get('test') === 'true'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const vapidKeysJson = Deno.env.get('VAPID_KEYS_JSON')
    if (!vapidKeysJson) {
      return new Response(JSON.stringify({ error: 'VAPID_KEYS_JSON not configured' }), { status: 500 })
    }

    const vapidKeys = await webpush.importVapidKeys(JSON.parse(vapidKeysJson))
    const appServer = await webpush.ApplicationServer.new({
      contactInformation: 'mailto:support@pritness.app',
      vapidKeys,
    })

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .limit(500)

    if (!subs?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userIds = [...new Set(subs.map((s) => s.user_id))]
    let query = supabase
      .from('profiles')
      .select('id, name, goal, protein_target, daily_calories_target, timezone')
      .in('id', userIds)
    if (!isTest) query = query.eq('wants_notifications', true)
    const { data: profiles } = await query

    if (!profiles?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const today = new Date().toISOString().slice(0, 10)
    let sent = 0

    for (const profile of profiles as ProfileData[]) {
      const userSubs = subs.filter((s) => s.user_id === profile.id)
      if (!userSubs.length) continue

      let body: string
      if (isTest) {
        body = `Prueba de Pritness 🧪 - ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
      } else {
        const tz = profile.timezone || 'UTC'
        const localHour = getLocalHour(tz)
        const slot = SCHEDULE[localHour]
        if (!slot) continue
        const [mealsRes, waterRes] = await Promise.all([
          supabase.from('meals').select('calories, protein').eq('user_id', profile.id).eq('date', today),
          supabase.from('water_logs').select('amount_ml').eq('user_id', profile.id).eq('date', today),
        ])
        const dayData: DayData = {
          waterMl: (waterRes.data ?? []).reduce((s, r) => s + (r.amount_ml || 0), 0),
          proteinEaten: (mealsRes.data ?? []).reduce((s, r) => s + (r.protein || 0), 0),
          caloriesEaten: (mealsRes.data ?? []).reduce((s, r) => s + (r.calories || 0), 0),
        }
        const p: ProfileData & { proteinTarget: number } = {
          ...profile,
          proteinTarget: profile.protein_target,
        }
        body = slot.getMessage(p, dayData)
      }

      const payload = JSON.stringify({ title: 'Pritness', body })

      for (const sub of userSubs) {
        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          })
          await subscriber.pushTextMessage(payload, {})
          sent++
        } catch (e) {
          console.warn('Push failed for', sub.endpoint, e)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
