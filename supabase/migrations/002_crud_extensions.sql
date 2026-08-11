-- GastroGo: extensiones CRUD (kitchen, staff, mostrador, campos de cocina)
-- Ejecutar después de 001_initial_schema.sql

-- Rol cocina
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kitchen';

-- Perfiles activos (admin)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Mesas: mesero asignado y mostrador
ALTER TABLE tables ADD COLUMN IF NOT EXISTS assigned_waiter_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS is_counter BOOLEAN NOT NULL DEFAULT false;

-- Órdenes: timestamp envío a cocina
ALTER TABLE orders ADD COLUMN IF NOT EXISTS kitchen_sent_at TIMESTAMPTZ;

-- Ítems de orden: estado cocina
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS kitchen_status TEXT
  CHECK (kitchen_status IS NULL OR kitchen_status IN ('pending', 'ready'));
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;

-- Meseros / staff del restaurante (UI POS con color)
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'waiter',
  color TEXT NOT NULL DEFAULT '#3D6B4F',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_restaurant ON staff_members(restaurant_id);

ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_members_member_access" ON staff_members
  FOR ALL USING (restaurant_id IN (SELECT user_restaurant_ids()));

-- Políticas adicionales para perfiles (lectura entre miembros del mismo restaurante)
CREATE POLICY "profiles_select_restaurant_peers" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT rm.user_id FROM restaurant_members rm
      WHERE rm.restaurant_id IN (SELECT user_restaurant_ids())
    )
    OR id = auth.uid()
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Realtime staff
ALTER PUBLICATION supabase_realtime ADD TABLE staff_members;
