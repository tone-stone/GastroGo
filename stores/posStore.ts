import { create } from 'zustand';

import {
  COUNTER_TABLE_ID,
  demoCategories,
  demoMenuItems,
  demoOrders,
  demoStaff,
  demoTables,
  isCounterTable,
} from '@/lib/demo-data';
import type { MenuCategory, MenuItem, Order, OrderItem, StaffMember, Table, TableStatus } from '@/types';

interface PosState {
  tables: Table[];
  categories: MenuCategory[];
  menuItems: MenuItem[];
  orders: Order[];
  staff: StaffMember[];
  activeSaleOrderId: string | null;
  getTable: (id: string) => Table | undefined;
  getStaff: (id: string) => StaffMember | undefined;
  getOrderByTable: (tableId: string) => Order | undefined;
  getActiveSaleOrder: () => Order | undefined;
  startSaleOrder: (restaurantId: string, cashierId?: string) => Order;
  resetSaleOrder: () => void;
  cancelOrder: (orderId: string) => void;
  getMenuByCategory: (categoryId: string) => MenuItem[];
  openOrder: (tableId: string, restaurantId: string, waiterId?: string) => Order;
  addItemToOrder: (orderId: string, item: MenuItem, notes?: string) => void;
  updateItemNotes: (orderId: string, itemId: string, notes: string) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  updateItemQuantity: (orderId: string, itemId: string, quantity: number) => void;
  sendToKitchen: (orderId: string) => void;
  markKitchenItemReady: (orderId: string, itemId: string) => { tableName: string; itemName: string; quantity: number } | null;
  getKitchenOrders: () => Order[];
  requestBill: (tableId: string) => void;
  payOrder: (orderId: string, tip: number, paymentMethod: Order['payment_method']) => void;
  assignTable: (tableId: string, waiterId: string | null, status?: TableStatus) => void;
  startTableService: (tableId: string, waiterId: string, restaurantId: string) => Order;
  getMyTables: (waiterId: string) => Table[];
  loadRestaurantData: (restaurantId: string) => void;
  createTable: (data: {
    restaurant_id: string;
    number: number;
    capacity: number;
    zone?: string;
  }) => Table;
  updateTable: (id: string, data: Partial<Pick<Table, 'number' | 'capacity' | 'zone'>>) => void;
  deleteTable: (id: string) => void;
  createStaff: (data: Omit<StaffMember, 'id'>) => StaffMember;
  updateStaff: (id: string, data: Partial<Pick<StaffMember, 'name' | 'role' | 'color'>>) => void;
  deleteStaff: (id: string) => void;
  createCategory: (data: Omit<MenuCategory, 'id' | 'sort_order'> & { sort_order?: number }) => MenuCategory;
  createMenuItem: (data: Omit<MenuItem, 'id'>) => MenuItem;
  updateMenuItem: (id: string, data: Partial<Pick<MenuItem, 'name' | 'description' | 'price' | 'category_id' | 'is_available'>>) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuItem: (id: string) => void;
}

function recalculateOrder(order: Order): Order {
  const subtotal = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.16 * 100) / 100;
  const total = subtotal + tax + order.tip;
  return { ...order, subtotal, tax, total };
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeNotes(notes?: string): string | undefined {
  const trimmed = notes?.trim();
  return trimmed || undefined;
}

export const usePosStore = create<PosState>((set, get) => ({
  tables: demoTables,
  categories: demoCategories,
  menuItems: demoMenuItems,
  orders: demoOrders,
  staff: demoStaff,
  activeSaleOrderId: null,

  loadRestaurantData: (_restaurantId) => {
    set({
      tables: demoTables,
      categories: demoCategories,
      menuItems: demoMenuItems,
      orders: demoOrders,
      staff: demoStaff,
    });
  },

  getTable: (id) => get().tables.find((t) => t.id === id),

  getStaff: (id) => get().staff.find((s) => s.id === id),

  getOrderByTable: (tableId) => {
    if (isCounterTable(tableId)) return undefined;
    return get().orders.find(
      (o) => o.table_id === tableId && o.status !== 'paid' && o.status !== 'cancelled',
    );
  },

  getActiveSaleOrder: () => {
    const { activeSaleOrderId, orders } = get();
    if (!activeSaleOrderId) return undefined;
    return orders.find(
      (o) =>
        o.id === activeSaleOrderId &&
        o.status !== 'paid' &&
        o.status !== 'cancelled' &&
        isCounterTable(o.table_id),
    );
  },

  startSaleOrder: (restaurantId, cashierId) => {
    const existing = get().getActiveSaleOrder();
    if (existing) return existing;

    const order: Order = recalculateOrder({
      id: generateId('order'),
      restaurant_id: restaurantId,
      table_id: COUNTER_TABLE_ID,
      waiter_id: cashierId,
      status: 'open',
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
      items: [],
      created_at: new Date().toISOString(),
    });

    set((state) => ({
      orders: [...state.orders, order],
      activeSaleOrderId: order.id,
    }));

    return order;
  },

  resetSaleOrder: () => set({ activeSaleOrderId: null }),

  cancelOrder: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'cancelled' as const } : o,
      ),
      activeSaleOrderId:
        state.activeSaleOrderId === orderId ? null : state.activeSaleOrderId,
    }));
  },

  getMenuByCategory: (categoryId) =>
    get().menuItems.filter((m) => m.category_id === categoryId && m.is_available),

  assignTable: (tableId, waiterId, status) => {
    set((state) => {
      const table = state.tables.find((t) => t.id === tableId);
      if (!table) return state;

      const activeOrder = state.orders.some(
        (o) => o.table_id === tableId && o.status !== 'paid' && o.status !== 'cancelled'
      );

      let newStatus = status ?? table.status;
      if (status === undefined) {
        if (waiterId && table.status === 'free') newStatus = 'occupied';
        if (!waiterId && !activeOrder) newStatus = 'free';
      }

      return {
        tables: state.tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                assigned_waiter_id: waiterId ?? undefined,
                status: newStatus,
              }
            : t
        ),
        orders: state.orders.map((o) =>
          o.table_id === tableId && o.status !== 'paid' && o.status !== 'cancelled'
            ? { ...o, waiter_id: waiterId ?? undefined }
            : o
        ),
      };
    });
  },

  startTableService: (tableId, waiterId, restaurantId) => {
    get().assignTable(tableId, waiterId, 'occupied');
    return get().openOrder(tableId, restaurantId, waiterId);
  },

  getMyTables: (waiterId) =>
    get().tables.filter((t) => t.assigned_waiter_id === waiterId && t.status !== 'free'),

  openOrder: (tableId, restaurantId, waiterId) => {
    const existing = get().getOrderByTable(tableId);
    if (existing) return existing;

    const table = get().getTable(tableId);
    const assignedWaiter = waiterId ?? table?.assigned_waiter_id;
    const counter = isCounterTable(tableId);

    const order: Order = recalculateOrder({
      id: generateId('order'),
      restaurant_id: restaurantId,
      table_id: tableId,
      waiter_id: assignedWaiter,
      status: 'open',
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
      items: [],
      created_at: new Date().toISOString(),
    });

    set((state) => ({
      orders: [...state.orders, order],
      tables: counter
        ? state.tables
        : state.tables.map((t) =>
            t.id === tableId
              ? {
                  ...t,
                  status: 'occupied' as TableStatus,
                  assigned_waiter_id: assignedWaiter ?? t.assigned_waiter_id,
                }
              : t,
          ),
    }));

    return order;
  },

  addItemToOrder: (orderId, item, notes) => {
    const normalizedNotes = normalizeNotes(notes);
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        const existing = order.items.find(
          (i) =>
            i.menu_item_id === item.id &&
            normalizeNotes(i.notes) === normalizedNotes
        );
        const items: OrderItem[] = existing
          ? order.items.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
            )
          : [
              ...order.items,
              {
                id: generateId('oi'),
                order_id: orderId,
                menu_item_id: item.id,
                name: item.name,
                quantity: 1,
                unit_price: item.price,
                notes: normalizedNotes,
              },
            ];
        return recalculateOrder({ ...order, items });
      }),
    }));
  },

  updateItemNotes: (orderId, itemId, notes) => {
    const normalizedNotes = normalizeNotes(notes);
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = order.items.map((i) =>
          i.id === itemId ? { ...i, notes: normalizedNotes } : i
        );
        return { ...order, items };
      }),
    }));
  },

  removeItemFromOrder: (orderId, itemId) => {
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = order.items.filter((i) => i.id !== itemId);
        return recalculateOrder({ ...order, items });
      }),
    }));
  },

  updateItemQuantity: (orderId, itemId, quantity) => {
    if (quantity <= 0) {
      get().removeItemFromOrder(orderId, itemId);
      return;
    }
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = order.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
        return recalculateOrder({ ...order, items });
      }),
    }));
  },

  sendToKitchen: (orderId) => {
    const sentAt = new Date().toISOString();
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: 'sent_to_kitchen' as const,
              kitchen_sent_at: sentAt,
              items: o.items.map((item) => ({
                ...item,
                kitchen_status: 'pending' as const,
                ready_at: undefined,
              })),
            }
          : o
      ),
    }));
  },

  markKitchenItemReady: (orderId, itemId) => {
    const table = get().tables.find((t) => {
      const order = get().orders.find((o) => o.id === orderId);
      return order && t.id === order.table_id;
    });
    const orderBefore = get().orders.find((o) => o.id === orderId);
    const itemBefore = orderBefore?.items.find((i) => i.id === itemId);
    if (!orderBefore || !itemBefore || itemBefore.kitchen_status === 'ready') return null;

    const readyAt = new Date().toISOString();

    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = order.items.map((item) =>
          item.id === itemId
            ? { ...item, kitchen_status: 'ready' as const, ready_at: readyAt }
            : item
        );
        const allReady = items.every((item) => item.kitchen_status === 'ready');
        return {
          ...order,
          items,
          status: allReady ? ('ready' as const) : order.status,
        };
      }),
    }));

    const tableName = table?.name ?? `Mesa ${table?.number ?? '?'}`;
    return { tableName, itemName: itemBefore.name, quantity: itemBefore.quantity };
  },

  getKitchenOrders: () =>
    get().orders.filter(
      (o) => o.status === 'sent_to_kitchen' || o.status === 'ready'
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),

  requestBill: (tableId) => {
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId ? { ...t, status: 'bill_requested' as TableStatus } : t
      ),
    }));
  },

  payOrder: (orderId, tip, paymentMethod) => {
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return state;

      const paidOrder = recalculateOrder({
        ...order,
        tip,
        status: 'paid',
        payment_method: paymentMethod,
        closed_at: new Date().toISOString(),
      });

      const counter = isCounterTable(order.table_id);

      return {
        orders: state.orders.map((o) => (o.id === orderId ? paidOrder : o)),
        tables: counter
          ? state.tables
          : state.tables.map((t) =>
              t.id === order.table_id
                ? { ...t, status: 'free' as TableStatus, assigned_waiter_id: undefined }
                : t,
            ),
        activeSaleOrderId:
          state.activeSaleOrderId === orderId ? null : state.activeSaleOrderId,
      };
    });
  },

  createTable: (data) => {
    const table: Table = {
      id: generateId('t'),
      restaurant_id: data.restaurant_id,
      number: data.number,
      name: `Mesa ${data.number}`,
      capacity: data.capacity,
      status: 'free',
      zone: data.zone ?? 'General',
    };
    set((state) => ({ tables: [...state.tables, table] }));
    return table;
  },

  updateTable: (id, data) => {
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === id
          ? {
              ...t,
              ...data,
              name: data.number !== undefined ? `Mesa ${data.number}` : t.name,
            }
          : t
      ),
    }));
  },

  deleteTable: (id) => {
    const hasActiveOrder = get().orders.some(
      (o) => o.table_id === id && o.status !== 'paid' && o.status !== 'cancelled'
    );
    if (hasActiveOrder) return;
    set((state) => ({ tables: state.tables.filter((t) => t.id !== id) }));
  },

  createStaff: (data) => {
    const member: StaffMember = { id: generateId('w'), ...data };
    set((state) => ({ staff: [...state.staff, member] }));
    return member;
  },

  updateStaff: (id, data) => {
    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
  },

  deleteStaff: (id) => {
    set((state) => ({
      staff: state.staff.filter((s) => s.id !== id),
      tables: state.tables.map((t) =>
        t.assigned_waiter_id === id ? { ...t, assigned_waiter_id: undefined } : t
      ),
    }));
  },

  createCategory: (data) => {
    const sort_order = data.sort_order ?? get().categories.length + 1;
    const category: MenuCategory = {
      id: generateId('c'),
      restaurant_id: data.restaurant_id,
      name: data.name,
      sort_order,
    };
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  createMenuItem: (data) => {
    const item: MenuItem = { id: generateId('m'), ...data };
    set((state) => ({ menuItems: [...state.menuItems, item] }));
    return item;
  },

  updateMenuItem: (id, data) => {
    set((state) => ({
      menuItems: state.menuItems.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
  },

  deleteMenuItem: (id) => {
    set((state) => ({ menuItems: state.menuItems.filter((m) => m.id !== id) }));
  },

  toggleMenuItem: (id) => {
    set((state) => ({
      menuItems: state.menuItems.map((m) =>
        m.id === id ? { ...m, is_available: !m.is_available } : m
      ),
    }));
  },
}));
