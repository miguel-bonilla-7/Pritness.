-- Pritness Supabase schema
-- Run this in the Supabase SQL editor to create tables and RLS.

-- Optional: enum for goal (can use text instead)
-- CREATE TYPE user_goal AS ENUM ('definir_masa', 'ganar_masa', 'perder_peso');

-- Profiles (extends auth.users via auth_id). username = login sin correo, único.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  height NUMERIC(5,2) NOT NULL,
  age INTEGER NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('definir_masa', 'ganar_masa', 'perder_peso')),
  sex TEXT CHECK (sex IN ('male', 'female')),
  tmb NUMERIC(8,2) NOT NULL,
  daily_calories_target INTEGER NOT NULL,
  protein_target INTEGER NOT NULL,
  carbs_target INTEGER NOT NULL,
  fat_target INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Si la tabla profiles ya existía sin username, ejecuta en Supabase SQL:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
-- UPDATE profiles p SET username = split_part(u.email, '@', 1) FROM auth.users u WHERE p.auth_id = u.id;
-- ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Meals / food log
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  name TEXT NOT NULL,
  calories NUMERIC(8,2) NOT NULL DEFAULT 0,
  protein NUMERIC(8,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(8,2) NOT NULL DEFAULT 0,
  fat NUMERIC(8,2) NOT NULL DEFAULT 0,
  source TEXT NOT NULL CHECK (source IN ('manual', 'ai_vision')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals(user_id, date);

-- Water logs
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount_ml INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, date);

-- Weight logs
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, date);

-- WODs (Work Of The Day)
CREATE TABLE IF NOT EXISTS wods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT,
  source TEXT NOT NULL CHECK (source IN ('photo', 'voice', 'text')),
  calories_burned INTEGER,
  raw_input_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wods_user_date ON wods(user_id, date);

-- RLS: enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wods ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/insert/update own by auth_id
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = auth_id);

-- Meals: by user_id (profile id). We need to join profile to get auth_id, or store auth_id in meals.
-- Simplest: meals.user_id references profiles(id), and we allow access when profile.auth_id = auth.uid()
CREATE POLICY "meals_select_own" ON meals FOR SELECT
  USING ((SELECT auth_id FROM profiles WHERE id = meals.user_id) = auth.uid());
CREATE POLICY "meals_insert_own" ON meals FOR INSERT
  WITH CHECK ((SELECT auth_id FROM profiles WHERE id = meals.user_id) = auth.uid());
CREATE POLICY "meals_update_own" ON meals FOR UPDATE
  USING ((SELECT auth_id FROM profiles WHERE id = meals.user_id) = auth.uid());
CREATE POLICY "meals_delete_own" ON meals FOR DELETE
  USING ((SELECT auth_id FROM profiles WHERE id = meals.user_id) = auth.uid());

-- Same pattern for water_logs, weight_logs, wods
CREATE POLICY "water_logs_select_own" ON water_logs FOR SELECT
  USING ((SELECT auth_id FROM profiles WHERE id = water_logs.user_id) = auth.uid());
CREATE POLICY "water_logs_insert_own" ON water_logs FOR INSERT
  WITH CHECK ((SELECT auth_id FROM profiles WHERE id = water_logs.user_id) = auth.uid());
CREATE POLICY "water_logs_update_own" ON water_logs FOR UPDATE
  USING ((SELECT auth_id FROM profiles WHERE id = water_logs.user_id) = auth.uid());
CREATE POLICY "water_logs_delete_own" ON water_logs FOR DELETE
  USING ((SELECT auth_id FROM profiles WHERE id = water_logs.user_id) = auth.uid());

CREATE POLICY "weight_logs_select_own" ON weight_logs FOR SELECT
  USING ((SELECT auth_id FROM profiles WHERE id = weight_logs.user_id) = auth.uid());
CREATE POLICY "weight_logs_insert_own" ON weight_logs FOR INSERT
  WITH CHECK ((SELECT auth_id FROM profiles WHERE id = weight_logs.user_id) = auth.uid());
CREATE POLICY "weight_logs_update_own" ON weight_logs FOR UPDATE
  USING ((SELECT auth_id FROM profiles WHERE id = weight_logs.user_id) = auth.uid());
CREATE POLICY "weight_logs_delete_own" ON weight_logs FOR DELETE
  USING ((SELECT auth_id FROM profiles WHERE id = weight_logs.user_id) = auth.uid());

CREATE POLICY "wods_select_own" ON wods FOR SELECT
  USING ((SELECT auth_id FROM profiles WHERE id = wods.user_id) = auth.uid());
CREATE POLICY "wods_insert_own" ON wods FOR INSERT
  WITH CHECK ((SELECT auth_id FROM profiles WHERE id = wods.user_id) = auth.uid());
CREATE POLICY "wods_update_own" ON wods FOR UPDATE
  USING ((SELECT auth_id FROM profiles WHERE id = wods.user_id) = auth.uid());
CREATE POLICY "wods_delete_own" ON wods FOR DELETE
  USING ((SELECT auth_id FROM profiles WHERE id = wods.user_id) = auth.uid());

-- Trigger to set updated_at on profiles
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
