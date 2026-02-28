import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { checkSupabaseConnection } from './lib/supabase'

checkSupabaseConnection().then((ok) => {
  console.debug('[Pritness] Supabase lista:', ok ? 'SÍ' : 'NO')
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
