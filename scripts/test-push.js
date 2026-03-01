/**
 * Envía una notificación push de prueba.
 * Uso: node scripts/test-push.js
 * Requiere: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {}
}

loadEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env')
  process.exit(1)
}

const fnUrl = `${url.replace(/\/$/, '')}/functions/v1/send-notifications?test=true`
console.log('Enviando notificación de prueba a', fnUrl)

const res = await fetch(fnUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  },
  body: '{}',
})

const data = await res.json().catch(() => ({}))
console.log('Respuesta:', res.status, data)
if (!res.ok) console.error('Error:', data)
