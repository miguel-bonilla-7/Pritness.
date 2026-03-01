# Notificaciones push – configuración

## 1. Migración de base de datos

Ejecuta en el SQL Editor de Supabase:

- `supabase/migrations/add_push_notifications.sql` (incluye wants_notifications y notification_prompt_shown)

## 2. Claves VAPID

Genera las claves (una sola vez):

```bash
npx web-push generate-vapid-keys
```

O con Deno:

```bash
deno run https://raw.githubusercontent.com/negrel/webpush/master/cmd/generate-vapid-keys.ts
```

Guarda la clave **pública** en `.env` del frontend:

```
VITE_VAPID_PUBLIC_KEY=tu_clave_publica_base64url
```

Para la Edge Function, exporta las claves en formato JWK y guárdalas como secreto:

```bash
supabase secrets set VAPID_KEYS_JSON='{"publicKey":{...},"privateKey":{...}}'
```

(Puedes usar `exportVapidKeys` de @negrel/webpush para generar el JSON.)

## 3. Desplegar Edge Function

```bash
supabase functions deploy send-notifications
```

## 4. Programar cron (cada hora)

En Supabase SQL Editor, con pg_cron y pg_net habilitados:

```sql
select cron.schedule(
  'send-pritness-notifications',
  '0 * * * *',  -- cada hora en punto
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

Antes, crea los secretos en Vault:

```sql
select vault.create_secret('https://TU_PROJECT_REF.supabase.co', 'project_url');
select vault.create_secret('TU_ANON_KEY', 'anon_key');
```

## 5. Horarios de notificaciones (hora local del usuario)

Las notificaciones se envían según la **hora del teléfono** de cada usuario. La app guarda la zona horaria (ej. America/Bogota) al abrir la app o al registrarse.

| Hora local | Tipo      | Mensaje                          |
|------------|-----------|----------------------------------|
| 8:00       | Desayuno  | Recordatorio desayuno            |
| 10:00      | Agua      | Progreso de agua del día         |
| 13:00      | Almuerzo  | Recordatorio almuerzo            |
| 16:00      | Merienda  | Recordatorio merienda            |
| 18:00      | Ejercicio | Recordatorio entrenamiento       |
| 20:00      | Cena      | Recordatorio cena                |
| 22:00      | Proteína  | Proteína restante o meta cumplida|
