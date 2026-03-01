-- Para usuarios existentes: mostrar prompt de notificaciones la próxima vez que entren
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prompt_shown BOOLEAN DEFAULT false;
