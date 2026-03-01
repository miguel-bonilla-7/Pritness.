import { savePushSubscription } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? ''

/** Convierte base64 URL-safe a Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export interface PushSubscriptionJson {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** Solicita permiso y suscripción push. Retorna la suscripción si OK, null si denegado o error. */
export async function requestPushSubscription(): Promise<PushSubscriptionJson | null> {
  if (!VAPID_PUBLIC_KEY || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    const registration = await navigator.serviceWorker.ready
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') return null

    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      const p = existing.getKey('p256dh')
      const a = existing.getKey('auth')
      if (!p || !a) return null
      return {
        endpoint: existing.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p as ArrayBuffer))),
          auth: btoa(String.fromCharCode(...new Uint8Array(a as ArrayBuffer))),
        },
      }
    }

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })

    const p256dh = sub.getKey('p256dh')
    const auth = sub.getKey('auth')
    if (!p256dh || !auth) return null

    return {
      endpoint: sub.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh as ArrayBuffer))),
        auth: btoa(String.fromCharCode(...new Uint8Array(auth as ArrayBuffer))),
      },
    }
  } catch {
    return null
  }
}

/** Registra la suscripción push en Supabase para el perfil dado */
export async function registerPushForProfile(profileId: string): Promise<boolean> {
  const sub = await requestPushSubscription()
  if (!sub) return false
  const { error } = await savePushSubscription(profileId, sub)
  return !error
}
