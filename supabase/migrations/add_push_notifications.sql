-- Notificaciones push: preferencia y suscripciones
-- Ejecutar en Supabase SQL Editor

-- Preferencia de notificaciones en perfil
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_notifications BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prompt_shown BOOLEAN DEFAULT false;
-- Zona horaria del usuario (ej. America/Bogota) para notificaciones a su hora local
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Suscripciones push (Web Push API)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own" ON push_subscriptions FOR SELECT
  USING ((SELECT auth_id FROM profiles WHERE id = push_subscriptions.user_id) = auth.uid());
CREATE POLICY "push_subscriptions_insert_own" ON push_subscriptions FOR INSERT
  WITH CHECK ((SELECT auth_id FROM profiles WHERE id = push_subscriptions.user_id) = auth.uid());
CREATE POLICY "push_subscriptions_delete_own" ON push_subscriptions FOR DELETE
  USING ((SELECT auth_id FROM profiles WHERE id = push_subscriptions.user_id) = auth.uid());
