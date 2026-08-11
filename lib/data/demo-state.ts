import {
  demoCategories,
  demoMenuItems,
  demoOrders,
  demoStaff,
  demoTables,
  demoUsers,
} from '@/lib/demo-data';
import type { AppUser, MenuCategory, MenuItem, Order, StaffMember, Table } from '@/types';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Estado mutable compartido entre stores y repositorios demo */
export const demoState = {
  tables: clone(demoTables) as Table[],
  categories: clone(demoCategories) as MenuCategory[],
  menuItems: clone(demoMenuItems) as MenuItem[],
  orders: clone(demoOrders) as Order[],
  staff: clone(demoStaff) as StaffMember[],
  users: clone(demoUsers) as AppUser[],
};

export function resetDemoState() {
  demoState.tables = clone(demoTables);
  demoState.categories = clone(demoCategories);
  demoState.menuItems = clone(demoMenuItems);
  demoState.orders = clone(demoOrders);
  demoState.staff = clone(demoStaff);
  demoState.users = clone(demoUsers);
}

export function getDemoSnapshot() {
  return {
    tables: clone(demoState.tables),
    categories: clone(demoState.categories),
    menuItems: clone(demoState.menuItems),
    orders: clone(demoState.orders),
    staff: clone(demoState.staff),
  };
}
