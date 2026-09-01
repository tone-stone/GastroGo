export type UserRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';

export type KitchenItemStatus = 'pending' | 'ready';

export type TableStatus = 'free' | 'occupied' | 'bill_requested' | 'reserved';

export type OrderStatus = 'open' | 'sent_to_kitchen' | 'ready' | 'paid' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mp' | 'apple';

export type OrderChannel = 'dine_in' | 'takeaway' | 'didi' | 'uber';

export type DiscountType = 'percent' | 'fixed' | 'comp';

export interface OrderDiscount {
  type: DiscountType;
  value: number;
  amount: number;
  reason: string;
  authorizedBy?: string;
}

export type Packaging = 'bag' | 'box' | 'no_cutlery';

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface Restaurant {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface RestaurantMember {
  restaurant_id: string;
  user_id: string;
  role: UserRole;
}

export interface Table {
  id: string;
  restaurant_id: string;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
  zone?: string;
  assigned_waiter_id?: string;
}

export interface StaffMember {
  id: string;
  restaurant_id: string;
  name: string;
  role: UserRole;
  color: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  kitchen_status?: KitchenItemStatus;
  ready_at?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  waiter_id?: string;
  status: OrderStatus;
  channel: OrderChannel;
  subtotal: number;
  tax: number;
  tip: number;
  discount?: OrderDiscount;
  total: number;
  payment_method?: PaymentMethod;
  items: OrderItem[];
  created_at: string;
  kitchen_sent_at?: string;
  closed_at?: string;
  external_ref?: string;
  pickup_name?: string;
  pickup_time?: string;
  packaging?: Packaging;
  prep_minutes?: number;
}

export interface Session {
  user: Profile | null;
  restaurants: Restaurant[];
  activeRestaurantId: string | null;
  role: UserRole;
  staffMemberId: string | null;
}

export interface AppUser {
  id: string;
  restaurant_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type ShiftStatus = 'open' | 'closed';

export interface CashMovement {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface Shift {
  id: string;
  restaurant_id: string;
  opened_at: string;
  opened_by?: string;
  opening_float: number;
  withdrawals: CashMovement[];
  status: ShiftStatus;
  closed_at?: string;
  closed_by?: string;
  counted_bills?: Record<number, number>;
  counted_total?: number;
  cash_expected?: number;
  difference?: number;
  sales_total?: number;
  sales_count?: number;
  tips_total?: number;
}
