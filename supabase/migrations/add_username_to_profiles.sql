-- Migración: añadir columna username a profiles (para proyectos que ya tenían la tabla).
-- Ejecuta esto en el SQL Editor de Supabase si profiles ya existía sin username.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Rellena username desde el email de auth (usuario@pritness.local -> usuario)
UPDATE profiles p
SET username = lower(split_part(u.email, '@', 1))
FROM auth.users u
WHERE p.auth_id = u.id AND (p.username IS NULL OR p.username = '');

-- Para filas sin email o sin match, usa un valor por defecto para poder poner NOT NULL
UPDATE profiles SET username = 'user_' || substr(id::text, 1, 8) WHERE username IS NULL OR username = '';

ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
