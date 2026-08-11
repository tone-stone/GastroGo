import { getErrorMessage } from '@/lib/api/errors';
import { demoState, getDemoSnapshot, resetDemoState } from '@/lib/data/demo-state';
import {
  getMenuCategoriesRepository,
  getMenuItemsRepository,
  getOrdersRepository,
  getStaffRepository,
  getTablesRepository,
} from '@/lib/repositories';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { MenuCategory, MenuItem, Order, StaffMember, Table } from '@/types';

export interface RestaurantSnapshot {
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  staff: StaffMember[];
}

/** Carga todos los datos CRUD de un restaurante */
export async function fetchRestaurantSnapshot(restaurantId: string): Promise<RestaurantSnapshot> {
  if (!isSupabaseConfigured) {
    resetDemoState();
    return getDemoSnapshot();
  }

  const scope = { restaurantId };
  const [tables, categories, menuItems, orders, staff] = await Promise.all([
    getTablesRepository().list(scope),
    getMenuCategoriesRepository().list(scope),
    getMenuItemsRepository().list(scope),
    getOrdersRepository().list(scope),
    getStaffRepository().list(scope),
  ]);

  return { tables, categories, menuItems, orders, staff };
}

/** Persiste orden completa (cabecera + ítems) en segundo plano */
export function persistOrder(order: Order): void {
  if (!isSupabaseConfigured) {
    void getOrdersRepository().upsert(order);
    return;
  }
  void getOrdersRepository().upsert(order).catch((err) => {
    console.warn('[GastroGo] Error al persistir orden:', getErrorMessage(err));
  });
}

/** Persiste mesa en segundo plano */
export function persistTable(table: Table): void {
  if (!isSupabaseConfigured) {
    void getTablesRepository().update(table.id, table);
    return;
  }
  void getTablesRepository()
    .update(table.id, {
      number: table.number,
      name: table.name,
      capacity: table.capacity,
      zone: table.zone,
      status: table.status,
      assigned_waiter_id: table.assigned_waiter_id,
    })
    .catch((err) => {
      console.warn('[GastroGo] Error al persistir mesa:', getErrorMessage(err));
    });
}

/** Sincroniza estado demo → posStore (lectura directa del demo state) */
export function getDemoStateRef() {
  return demoState;
}
