export type DbUserRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';
export type DbTableStatus = 'free' | 'occupied' | 'bill_requested' | 'reserved';
export type DbOrderStatus = 'open' | 'sent_to_kitchen' | 'ready' | 'paid' | 'cancelled';
export type DbPaymentMethod = 'cash' | 'card' | 'transfer';
export type DbKitchenStatus = 'pending' | 'ready';

export interface DbOrganization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface DbRestaurant {
  id: string;
  organization_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  created_at: string;
}

export interface DbProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbRestaurantMember {
  restaurant_id: string;
  user_id: string;
  role: DbUserRole;
}

export interface DbTable {
  id: string;
  restaurant_id: string;
  number: number;
  name: string;
  capacity: number;
  status: DbTableStatus;
  zone: string | null;
  assigned_waiter_id: string | null;
  is_counter: boolean;
}

export interface DbMenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface DbMenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
}

export interface DbStaffMember {
  id: string;
  restaurant_id: string;
  profile_id: string | null;
  name: string;
  role: DbUserRole;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface DbOrder {
  id: string;
  restaurant_id: string;
  table_id: string;
  waiter_id: string | null;
  status: DbOrderStatus;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  payment_method: DbPaymentMethod | null;
  kitchen_sent_at: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  kitchen_status: DbKitchenStatus | null;
  ready_at: string | null;
}

/** Filas con relaciones anidadas (select con join) */
export interface DbOrderWithItems extends DbOrder {
  order_items: DbOrderItem[];
}

export interface Database {
  public: {
    Tables: {
      organizations: { Row: DbOrganization; Insert: Omit<DbOrganization, 'id' | 'created_at'>; Update: Partial<DbOrganization> };
      restaurants: { Row: DbRestaurant; Insert: Omit<DbRestaurant, 'id' | 'created_at'>; Update: Partial<DbRestaurant> };
      profiles: { Row: DbProfile; Insert: Omit<DbProfile, 'created_at'>; Update: Partial<DbProfile> };
      restaurant_members: { Row: DbRestaurantMember; Insert: DbRestaurantMember; Update: Partial<DbRestaurantMember> };
      tables: { Row: DbTable; Insert: Omit<DbTable, 'id'>; Update: Partial<DbTable> };
      menu_categories: { Row: DbMenuCategory; Insert: Omit<DbMenuCategory, 'id'>; Update: Partial<DbMenuCategory> };
      menu_items: { Row: DbMenuItem; Insert: Omit<DbMenuItem, 'id'>; Update: Partial<DbMenuItem> };
      staff_members: { Row: DbStaffMember; Insert: Omit<DbStaffMember, 'id' | 'created_at'>; Update: Partial<DbStaffMember> };
      orders: { Row: DbOrder; Insert: Omit<DbOrder, 'id' | 'created_at'>; Update: Partial<DbOrder> };
      order_items: { Row: DbOrderItem; Insert: Omit<DbOrderItem, 'id'>; Update: Partial<DbOrderItem> };
    };
  };
}
