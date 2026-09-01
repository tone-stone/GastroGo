import { create } from 'zustand';

import {
  COUNTER_TABLE_ID,
  isCounterTable,
} from '@/lib/demo-data';
import { demoState, getDemoSnapshot, resetDemoState } from '@/lib/data/demo-state';
import { fetchRestaurantSnapshot, persistOrder, persistTable } from '@/lib/data/restaurant-data';
import {
  getMenuCategoriesRepository,
  getMenuItemsRepository,
  getStaffRepository,
  getTablesRepository,
} from '@/lib/repositories';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { MenuCategory, MenuItem, Order, OrderChannel, OrderDiscount, OrderItem, StaffMember, Table, TableStatus } from '@/types';

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
  startChannelOrder: (restaurantId: string, channel: OrderChannel, staffId?: string) => Order;
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
  applyDiscount: (orderId: string, discount: OrderDiscount) => void;
  removeDiscount: (orderId: string) => void;
  assignTable: (tableId: string, waiterId: string | null, status?: TableStatus) => void;
  startTableService: (tableId: string, waiterId: string, restaurantId: string) => Order;
  getMyTables: (waiterId: string) => Table[];
  loadRestaurantData: (restaurantId: string) => Promise<void>;
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
  // El descuento se resta antes de IVA y propina (ver design_handoff_gastrogo_pos/README.md, "Descuentos").
  const discountAmount = order.discount?.amount ?? 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxable * 0.16 * 100) / 100;
  const total = taxable + tax + order.tip;
  return { ...order, subtotal, tax, total };
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeNotes(notes?: string): string | undefined {
  const trimmed = notes?.trim();
  return trimmed || undefined;
}

function syncOrderPersistence(get: () => PosState, orderId: string) {
  const order = get().orders.find((o) => o.id === orderId);
  if (!order) return;
  if (!isSupabaseConfigured) {
    const idx = demoState.orders.findIndex((o) => o.id === orderId);
    if (idx >= 0) demoState.orders[idx] = order;
    else demoState.orders.push(order);
  } else {
    persistOrder(order);
  }
}

function syncTablePersistence(table: Table) {
  if (!isSupabaseConfigured) {
    const idx = demoState.tables.findIndex((t) => t.id === table.id);
    if (idx >= 0) demoState.tables[idx] = table;
  } else {
    persistTable(table);
  }
}

// Se llama al montar Venta y Mesas — sin este guard, cada visita volvería a resetear
// `activeSaleOrderId` y pisaría el pedido recién creado.
let loadedRestaurantId: string | null = null;
let demoStateReset = false;

export const usePosStore = create<PosState>((set, get) => ({
  tables: demoState.tables,
  categories: demoState.categories,
  menuItems: demoState.menuItems,
  orders: demoState.orders,
  staff: demoState.staff,
  activeSaleOrderId: null,

  loadRestaurantData: async (restaurantId) => {
    if (loadedRestaurantId === restaurantId) return;
    loadedRestaurantId = restaurantId;

    // Camino demo: sin I/O real. Se aplica de inmediato (sin `await`) para que este
    // `set()` quede confirmado antes de que cualquier otro efecto síncrono del mismo
    // montaje (p. ej. crear el pedido de venta) pueda correr — de lo contrario ese
    // pedido recién creado queda expuesto un instante y un snapshot demorado por el
    // `await` innecesario lo pisa al aplicarse después.
    if (!isSupabaseConfigured) {
      if (!demoStateReset) {
        resetDemoState();
        demoStateReset = true;
      }
      const snapshot = getDemoSnapshot();
      set({
        tables: snapshot.tables,
        categories: snapshot.categories,
        menuItems: snapshot.menuItems,
        orders: snapshot.orders,
        staff: snapshot.staff,
        activeSaleOrderId: null,
      });
      return;
    }

    const snapshot = await fetchRestaurantSnapshot(restaurantId);
    set({
      tables: snapshot.tables,
      categories: snapshot.categories,
      menuItems: snapshot.menuItems,
      orders: snapshot.orders,
      staff: snapshot.staff,
      activeSaleOrderId: null,
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
      channel: 'dine_in',
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

    if (!isSupabaseConfigured) demoState.orders.push(order);
    else persistOrder(order);

    return order;
  },

  startChannelOrder: (restaurantId, channel, staffId) => {
    // No usa activeSaleOrderId (eso sigue siendo solo del mostrador/dine_in);
    // reusa una orden abierta del mismo canal si ya existe para no duplicarla.
    const existing = get().orders.find(
      (o) =>
        o.restaurant_id === restaurantId &&
        o.channel === channel &&
        o.status !== 'paid' &&
        o.status !== 'cancelled' &&
        isCounterTable(o.table_id),
    );
    if (existing) return existing;

    const order: Order = recalculateOrder({
      id: generateId('order'),
      restaurant_id: restaurantId,
      table_id: COUNTER_TABLE_ID,
      waiter_id: staffId,
      status: 'open',
      channel,
      subtotal: 0,
      tax: 0,
      tip: 0,
      total: 0,
      items: [],
      created_at: new Date().toISOString(),
    });

    set((state) => ({ orders: [...state.orders, order] }));
    if (!isSupabaseConfigured) demoState.orders.push(order);
    else persistOrder(order);

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
    syncOrderPersistence(get, orderId);
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
    const table = get().tables.find((t) => t.id === tableId);
    if (table) syncTablePersistence(table);
    get()
      .orders.filter((o) => o.table_id === tableId && o.status !== 'paid' && o.status !== 'cancelled')
      .forEach((o) => syncOrderPersistence(get, o.id));
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
      channel: 'dine_in',
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

    if (!isSupabaseConfigured) demoState.orders.push(order);
    else persistOrder(order);
    const updatedTable = get().tables.find((t) => t.id === tableId);
    if (updatedTable && !counter) syncTablePersistence(updatedTable);

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
    syncOrderPersistence(get, orderId);
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
    syncOrderPersistence(get, orderId);
  },

  removeItemFromOrder: (orderId, itemId) => {
    set((state) => ({
      orders: state.orders.map((order) => {
        if (order.id !== orderId) return order;
        const items = order.items.filter((i) => i.id !== itemId);
        return recalculateOrder({ ...order, items });
      }),
    }));
    syncOrderPersistence(get, orderId);
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
    syncOrderPersistence(get, orderId);
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
    syncOrderPersistence(get, orderId);
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
    syncOrderPersistence(get, orderId);
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
    const table = get().tables.find((t) => t.id === tableId);
    if (table) syncTablePersistence(table);
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
      const tables = counter
        ? state.tables
        : state.tables.map((t) =>
            t.id === order.table_id
              ? { ...t, status: 'free' as TableStatus, assigned_waiter_id: undefined }
              : t,
          );

      return {
        orders: state.orders.map((o) => (o.id === orderId ? paidOrder : o)),
        tables,
        activeSaleOrderId:
          state.activeSaleOrderId === orderId ? null : state.activeSaleOrderId,
      };
    });
    syncOrderPersistence(get, orderId);
    const table = get().tables.find((t) => {
      const order = get().orders.find((o) => o.id === orderId);
      return order && t.id === order.table_id;
    });
    if (table) syncTablePersistence(table);
  },

  applyDiscount: (orderId, discount) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? recalculateOrder({ ...o, discount }) : o)),
    }));
    syncOrderPersistence(get, orderId);
  },

  removeDiscount: (orderId) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId ? recalculateOrder({ ...o, discount: undefined }) : o,
      ),
    }));
    syncOrderPersistence(get, orderId);
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
    if (isSupabaseConfigured) {
      void getTablesRepository()
        .create({
          restaurant_id: data.restaurant_id,
          number: data.number,
          name: table.name,
          capacity: data.capacity,
          zone: data.zone,
        })
        .then((created) => {
          set((state) => ({
            tables: state.tables.map((t) => (t.id === table.id ? created : t)),
          }));
        });
    } else {
      demoState.tables.push(table);
    }
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
    const table = get().tables.find((t) => t.id === id);
    if (table) {
      if (isSupabaseConfigured) void getTablesRepository().update(id, data);
      else {
        const idx = demoState.tables.findIndex((t) => t.id === id);
        if (idx >= 0) demoState.tables[idx] = table;
      }
    }
  },

  deleteTable: (id) => {
    const hasActiveOrder = get().orders.some(
      (o) => o.table_id === id && o.status !== 'paid' && o.status !== 'cancelled'
    );
    if (hasActiveOrder) return;
    set((state) => ({ tables: state.tables.filter((t) => t.id !== id) }));
    if (isSupabaseConfigured) void getTablesRepository().remove(id);
    else demoState.tables = demoState.tables.filter((t) => t.id !== id);
  },

  createStaff: (data) => {
    const member: StaffMember = { id: generateId('w'), ...data };
    set((state) => ({ staff: [...state.staff, member] }));
    if (isSupabaseConfigured) {
      void getStaffRepository().create(data).then((created) => {
        set((state) => ({
          staff: state.staff.map((s) => (s.id === member.id ? created : s)),
        }));
      });
    } else {
      demoState.staff.push(member);
    }
    return member;
  },

  updateStaff: (id, data) => {
    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    if (isSupabaseConfigured) void getStaffRepository().update(id, data);
    else {
      const idx = demoState.staff.findIndex((s) => s.id === id);
      const updated = get().staff.find((s) => s.id === id);
      if (idx >= 0 && updated) demoState.staff[idx] = updated;
    }
  },

  deleteStaff: (id) => {
    set((state) => ({
      staff: state.staff.filter((s) => s.id !== id),
      tables: state.tables.map((t) =>
        t.assigned_waiter_id === id ? { ...t, assigned_waiter_id: undefined } : t
      ),
    }));
    if (isSupabaseConfigured) void getStaffRepository().remove(id);
    else demoState.staff = demoState.staff.filter((s) => s.id !== id);
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
    if (isSupabaseConfigured) {
      void getMenuCategoriesRepository()
        .create({ restaurant_id: data.restaurant_id, name: data.name, sort_order })
        .then((created) => {
          set((state) => ({
            categories: state.categories.map((c) => (c.id === category.id ? created : c)),
          }));
        });
    } else {
      demoState.categories.push(category);
    }
    return category;
  },

  createMenuItem: (data) => {
    const item: MenuItem = { id: generateId('m'), ...data };
    set((state) => ({ menuItems: [...state.menuItems, item] }));
    if (isSupabaseConfigured) {
      void getMenuItemsRepository().create(data).then((created) => {
        set((state) => ({
          menuItems: state.menuItems.map((m) => (m.id === item.id ? created : m)),
        }));
      });
    } else {
      demoState.menuItems.push(item);
    }
    return item;
  },

  updateMenuItem: (id, data) => {
    set((state) => ({
      menuItems: state.menuItems.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
    if (isSupabaseConfigured) void getMenuItemsRepository().update(id, data);
    else {
      const idx = demoState.menuItems.findIndex((m) => m.id === id);
      const updated = get().menuItems.find((m) => m.id === id);
      if (idx >= 0 && updated) demoState.menuItems[idx] = updated;
    }
  },

  deleteMenuItem: (id) => {
    set((state) => ({ menuItems: state.menuItems.filter((m) => m.id !== id) }));
    if (isSupabaseConfigured) void getMenuItemsRepository().remove(id);
    else demoState.menuItems = demoState.menuItems.filter((m) => m.id !== id);
  },

  toggleMenuItem: (id) => {
    set((state) => ({
      menuItems: state.menuItems.map((m) =>
        m.id === id ? { ...m, is_available: !m.is_available } : m
      ),
    }));
    const item = get().menuItems.find((m) => m.id === id);
    if (item) {
      if (isSupabaseConfigured) void getMenuItemsRepository().update(id, { is_available: item.is_available });
      else {
        const idx = demoState.menuItems.findIndex((m) => m.id === id);
        if (idx >= 0) demoState.menuItems[idx] = item;
      }
    }
  },
}));
