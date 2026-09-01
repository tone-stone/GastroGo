import type {
  DbCashMovement,
  DbMenuCategory,
  DbMenuItem,
  DbOrder,
  DbOrderItem,
  DbOrderWithItems,
  DbProfile,
  DbRestaurantMember,
  DbShift,
  DbShiftWithMovements,
  DbStaffMember,
  DbTable,
} from '@/types/database';
import type { AppUser, CashMovement, MenuCategory, MenuItem, Order, OrderItem, Shift, StaffMember, Table } from '@/types';

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

export function mapCashMovement(row: DbCashMovement): CashMovement {
  return {
    id: row.id,
    amount: Number(row.amount),
    reason: row.reason,
    created_at: row.created_at,
  };
}

function billsFromDb(bills: Record<string, number> | null): Record<number, number> | undefined {
  if (!bills) return undefined;
  return Object.fromEntries(Object.entries(bills).map(([k, v]) => [Number(k), v]));
}

function billsToDb(bills?: Record<number, number>): Record<string, number> | null {
  if (!bills) return null;
  return Object.fromEntries(Object.entries(bills).map(([k, v]) => [k, v]));
}

export function mapShift(row: DbShift, movements: DbCashMovement[]): Shift {
  return {
    id: row.id,
    restaurant_id: row.restaurant_id,
    opened_at: row.opened_at,
    opened_by: row.opened_by ?? undefined,
    opening_float: Number(row.opening_float),
    withdrawals: movements.map(mapCashMovement),
    status: row.status,
    closed_at: row.closed_at ?? undefined,
    closed_by: row.closed_by ?? undefined,
    counted_bills: billsFromDb(row.counted_bills),
    counted_total: row.counted_total !== null ? Number(row.counted_total) : undefined,
    cash_expected: row.cash_expected !== null ? Number(row.cash_expected) : undefined,
    difference: row.difference !== null ? Number(row.difference) : undefined,
    sales_total: row.sales_total !== null ? Number(row.sales_total) : undefined,
    sales_count: row.sales_count ?? undefined,
    tips_total: row.tips_total !== null ? Number(row.tips_total) : undefined,
  };
}

export function mapShiftWithMovements(row: DbShiftWithMovements): Shift {
  return mapShift(row, row.cash_movements ?? []);
}

export function toDbShift(shift: Shift): Omit<DbShift, 'id'> & { id?: string } {
  return {
    id: shift.id,
    restaurant_id: shift.restaurant_id,
    opened_at: shift.opened_at,
    opened_by: shift.opened_by ?? null,
    opening_float: shift.opening_float,
    status: shift.status,
    closed_at: shift.closed_at ?? null,
    closed_by: shift.closed_by ?? null,
    counted_bills: billsToDb(shift.counted_bills),
    counted_total: shift.counted_total ?? null,
    cash_expected: shift.cash_expected ?? null,
    difference: shift.difference ?? null,
    sales_total: shift.sales_total ?? null,
    sales_count: shift.sales_count ?? null,
    tips_total: shift.tips_total ?? null,
  };
}

export function toDbCashMovement(movement: CashMovement, shiftId: string): Omit<DbCashMovement, 'id' | 'created_at'> & { id?: string } {
  return {
    id: movement.id,
    shift_id: shiftId,
    amount: movement.amount,
    reason: movement.reason,
  };
}
