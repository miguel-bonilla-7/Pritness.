import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { checkSupabaseConnection } from './lib/supabase'

// Limpiar localStorage de Pritness para que la primera pantalla sea siempre login/registro
const PRITNESS_KEYS = ['pritness_profile', 'pritness_daily_totals']
PRITNESS_KEYS.forEach((key) => {
  try {
    localStorage.removeItem(key)
    console.debug('[Pritness] localStorage limpiado:', key)
  } catch {}
})

// Depuración: comprobar conexión a Supabase al cargar la app
checkSupabaseConnection().then((ok) => {
  console.debug('[Pritness] Supabase lista:', ok ? 'SÍ' : 'NO')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
