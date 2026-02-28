# Pritness – PWA AI Fitness (Dark Mode)

PWA de nutrición y fitness con IA: seguimiento de calorías, agua, peso, recomendador de menú, visión IA para comidas y WOD, y chatbot.

## Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS, Framer Motion, Lucide Icons
- React Router
- Supabase (opcional): auth y persistencia
- IA: Groq (recomendado), Google Gemini o OpenAI (visión y chat)

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Sin API keys el onboarding y el dashboard funcionan con datos locales; la cámara y el chat usan respuestas de demo hasta que configures las variables de entorno.

## Variables de entorno

Copia `.env.example` a `.env` y rellena (opcional):

- **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` para auth y sincronización.
- **IA:** `VITE_GROQ_API_KEY` (recomendado), o `VITE_GEMINI_API_KEY` / `VITE_OPENAI_API_KEY` para análisis de fotos de comida, WOD y chatbot.

## Base de datos (Supabase)

En el SQL Editor de tu proyecto Supabase ejecuta el contenido de `supabase/schema.sql` para crear tablas (`profiles`, `meals`, `water_logs`, `weight_logs`, `wods`) y políticas RLS.

### Evitar "Email rate limit exceeded"

La app usa **usuario y contraseña** (no correo). Para que no aparezca el error de límite de envío de emails:

1. Entra en el **Dashboard de Supabase** → tu proyecto.
2. Ve a **Authentication** → **Providers** → **Email**.
3. **Desactiva "Confirm email"** (o "Enable email confirmations").
4. Guarda.

Así Supabase no enviará correos de confirmación al registrarse y no se agotará el límite. Los usuarios quedarán autoconfirmados al crear la cuenta.

## Build y PWA

```bash
npm run build
npm run preview
```

El build genera un Service Worker y un manifest para instalar la PWA. En producción, el SW hace caché para uso offline.

## Estructura

- `src/components/` – Card, ProgressBar, ProgressRing, BottomNav, modales de registro
- `src/context/` – UserContext (perfil, TMB, macros), DailyLogContext (totales del día)
- `src/pages/` – Onboarding, Dashboard, Camera, Chat, Profile, Trends
- `src/lib/` – TMB/macros, recomendador de menú, API IA, cliente Supabase
- `supabase/schema.sql` – Esquema y RLS para Supabase
