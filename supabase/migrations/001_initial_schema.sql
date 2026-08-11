-- GastroGo: esquema inicial multi-tenant
-- Ejecutar en Supabase SQL Editor

-- Organizaciones (franquicias / grupos)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurantes / sucursales
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Perfiles de usuario (vinculados a auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membresía usuario ↔ restaurante con rol
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier', 'waiter');

CREATE TABLE restaurant_members (
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'waiter',
  PRIMARY KEY (restaurant_id, user_id)
);

-- Mesas
CREATE TYPE table_status AS ENUM ('free', 'occupied', 'bill_requested', 'reserved');

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  number INT NOT NULL,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status table_status NOT NULL DEFAULT 'free',
  zone TEXT,
  UNIQUE (restaurant_id, number)
);

-- Menú
CREATE TABLE menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true
);

-- Órdenes
CREATE TYPE order_status AS ENUM ('open', 'sent_to_kitchen', 'ready', 'paid', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id),
  waiter_id UUID REFERENCES profiles(id),
  status order_status NOT NULL DEFAULT 'open',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method payment_method,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  notes TEXT
);

-- Índices
CREATE INDEX idx_restaurants_org ON restaurants(organization_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper: restaurantes del usuario autenticado
CREATE OR REPLACE FUNCTION user_restaurant_ids()
RETURNS SETOF UUID AS $$
  SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas básicas (ajustar según necesidad)
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "restaurants_member_access" ON restaurants
  FOR ALL USING (id IN (SELECT user_restaurant_ids()));

CREATE POLICY "members_own" ON restaurant_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tables_member_access" ON tables
  FOR ALL USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "menu_categories_member_access" ON menu_categories
  FOR ALL USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "menu_items_member_access" ON menu_items
  FOR ALL USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "orders_member_access" ON orders
  FOR ALL USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "order_items_via_order" ON order_items
  FOR ALL USING (
    order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT user_restaurant_ids()))
  );

-- Realtime para comandas en vivo
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
