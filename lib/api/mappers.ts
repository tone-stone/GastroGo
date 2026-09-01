import type {
  DbMenuCategory,
  DbMenuItem,
  DbOrder,
  DbOrderItem,
  DbOrderWithItems,
  DbProfile,
  DbRestaurantMember,
  DbStaffMember,
  DbTable,
} from '@/types/database';
import type { AppUser, MenuCategory, MenuItem, Order, OrderItem, StaffMember, Table } from '@/types';

export function mapTable(row: DbTable): Table {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    number: row.number,
    name: row.name,
    capacity: row.capacity,
    status: row.status,
    zone: row.zone ?? undefined,
    assigned_waiter_id: row.assigned_waiter_id ?? undefined,
  };
}

export function mapCategory(row: DbMenuCategory): MenuCategory {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    name: row.name,
    sort_order: row.sort_order,
  };
}

export function mapMenuItem(row: DbMenuItem): MenuItem {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    category_id: row.category_id,
    name: row.name,
    description: row.description ?? undefined,
    price: Number(row.price),
    is_available: row.is_available,
  };
}

export function mapStaff(row: DbStaffMember): StaffMember {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    name: row.name,
    role: row.role,
    color: row.color,
  };
}

export function mapOrderItem(row: DbOrderItem): OrderItem {
  return {
    id: row.id,
    order_id: row.order_id,
    menu_item_id: row.menu_item_id,
    name: row.name,
    quantity: row.quantity,
    unit_price: Number(row.unit_price),
    notes: row.notes ?? undefined,
    kitchen_status: row.kitchen_status ?? undefined,
    ready_at: row.ready_at ?? undefined,
  };
}

export function mapOrder(row: DbOrder, items: DbOrderItem[]): Order {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    table_id: row.table_id,
    waiter_id: row.waiter_id ?? undefined,
    status: row.status,
    channel: row.channel,
    subtotal: Number(row.subtotal),
    tax: Number(row.tax),
    tip: Number(row.tip),
    discount: row.discount_type
      ? {
          type: row.discount_type,
          value: Number(row.discount_value ?? 0),
          amount: Number(row.discount_amount),
          reason: row.discount_reason ?? '',
          authorizedBy: row.discount_authorized_by ?? undefined,
        }
      : undefined,
    total: Number(row.total),
    payment_method: row.payment_method ?? undefined,
    kitchen_sent_at: row.kitchen_sent_at ?? undefined,
    created_at: row.created_at,
    closed_at: row.closed_at ?? undefined,
    external_ref: row.external_ref ?? undefined,
    pickup_name: row.pickup_name ?? undefined,
    pickup_time: row.pickup_time ?? undefined,
    packaging: row.packaging ?? undefined,
    prep_minutes: row.prep_minutes ?? undefined,
    items: items.map(mapOrderItem),
  };
}

export function mapOrderWithItems(row: DbOrderWithItems): Order {
  return mapOrder(row, row.order_items ?? []);
}

export function mapAppUser(profile: DbProfile, member: DbRestaurantMember): AppUser {
  return {
    id: profile.id,
    restaurant_id: member.restaurant_id,
    full_name: profile.full_name,
    email: profile.email,
    role: member.role,
    is_active: profile.is_active,
    created_at: profile.created_at,
  };
}

/** Convierte entidad de dominio → fila para insert/update en Supabase */
export function toDbOrder(order: Order): Omit<DbOrder, 'id' | 'created_at'> & { id?: string } {
  return {
    id: order.id,
    restaurant_id: order.restaurant_id,
    table_id: order.table_id,
    waiter_id: order.waiter_id ?? null,
    status: order.status,
    channel: order.channel,
    subtotal: order.subtotal,
    tax: order.tax,
    tip: order.tip,
    total: order.total,
    payment_method: order.payment_method ?? null,
    kitchen_sent_at: order.kitchen_sent_at ?? null,
    closed_at: order.closed_at ?? null,
    external_ref: order.external_ref ?? null,
    pickup_name: order.pickup_name ?? null,
    pickup_time: order.pickup_time ?? null,
    packaging: order.packaging ?? null,
    prep_minutes: order.prep_minutes ?? null,
    discount_type: order.discount?.type ?? null,
    discount_value: order.discount?.value ?? null,
    discount_amount: order.discount?.amount ?? 0,
    discount_reason: order.discount?.reason ?? null,
    discount_authorized_by: order.discount?.authorizedBy ?? null,
  };
}

export function toDbOrderItem(item: OrderItem): Omit<DbOrderItem, 'id'> & { id?: string } {
  return {
    id: item.id,
    order_id: item.order_id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    notes: item.notes ?? null,
    kitchen_status: item.kitchen_status ?? null,
    ready_at: item.ready_at ?? null,
  };
}
