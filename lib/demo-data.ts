import type {
  AppUser,
  MenuCategory,
  MenuItem,
  Order,
  Restaurant,
  StaffMember,
  Table,
  TableStatus,
} from '@/types';

export const DEMO_ORG_ID = 'demo-org';
export const DEMO_RESTAURANT_ID = 'demo-restaurant-1';
export const DEMO_USER_ID = 'demo-user';
export const COUNTER_TABLE_ID = 't-counter';

export function isCounterTable(tableId: string): boolean {
  return tableId === COUNTER_TABLE_ID;
}

export const demoRestaurants: Restaurant[] = [
  {
    id: DEMO_RESTAURANT_ID,
    organization_id: DEMO_ORG_ID,
    name: 'GastroGo Centro',
    address: 'Av. Principal 123',
    phone: '+52 55 1234 5678',
  },
  {
    id: 'demo-restaurant-2',
    organization_id: DEMO_ORG_ID,
    name: 'GastroGo Norte',
    address: 'Blvd. Norte 456',
    phone: '+52 55 8765 4321',
  },
];

export const demoStaff: StaffMember[] = [
  { id: 'w1', restaurant_id: DEMO_RESTAURANT_ID, name: 'Ana García', role: 'waiter', color: '#3D6B4F' },
  { id: 'w2', restaurant_id: DEMO_RESTAURANT_ID, name: 'Carlos Ruiz', role: 'waiter', color: '#5C4A3A' },
  { id: 'w3', restaurant_id: DEMO_RESTAURANT_ID, name: 'María López', role: 'waiter', color: '#40916C' },
  { id: 'w4', restaurant_id: DEMO_RESTAURANT_ID, name: 'Luis Hernández', role: 'manager', color: '#C4A052' },
];

export const demoTables: Table[] = [
  {
    id: COUNTER_TABLE_ID,
    restaurant_id: DEMO_RESTAURANT_ID,
    number: 0,
    name: 'Mostrador',
    capacity: 0,
    status: 'free',
    zone: 'Mostrador',
  },
  { id: 't1', restaurant_id: DEMO_RESTAURANT_ID, number: 1, name: 'Mesa 1', capacity: 2, status: 'free', zone: 'Terraza' },
  { id: 't2', restaurant_id: DEMO_RESTAURANT_ID, number: 2, name: 'Mesa 2', capacity: 4, status: 'occupied', zone: 'Terraza', assigned_waiter_id: 'w1' },
  { id: 't3', restaurant_id: DEMO_RESTAURANT_ID, number: 3, name: 'Mesa 3', capacity: 4, status: 'bill_requested', zone: 'Interior', assigned_waiter_id: 'w2' },
  { id: 't4', restaurant_id: DEMO_RESTAURANT_ID, number: 4, name: 'Mesa 4', capacity: 6, status: 'free', zone: 'Interior' },
  { id: 't5', restaurant_id: DEMO_RESTAURANT_ID, number: 5, name: 'Mesa 5', capacity: 2, status: 'occupied', zone: 'Barra', assigned_waiter_id: 'w3' },
  { id: 't6', restaurant_id: DEMO_RESTAURANT_ID, number: 6, name: 'Mesa 6', capacity: 8, status: 'reserved', zone: 'VIP', assigned_waiter_id: 'w4' },
  { id: 't7', restaurant_id: DEMO_RESTAURANT_ID, number: 7, name: 'Mesa 7', capacity: 4, status: 'free', zone: 'Interior' },
  { id: 't8', restaurant_id: DEMO_RESTAURANT_ID, number: 8, name: 'Mesa 8', capacity: 4, status: 'free', zone: 'Terraza' },
];

export const demoCategories: MenuCategory[] = [
  { id: 'c1', restaurant_id: DEMO_RESTAURANT_ID, name: 'Entradas', sort_order: 1 },
  { id: 'c2', restaurant_id: DEMO_RESTAURANT_ID, name: 'Platos fuertes', sort_order: 2 },
  { id: 'c3', restaurant_id: DEMO_RESTAURANT_ID, name: 'Bebidas', sort_order: 3 },
  { id: 'c4', restaurant_id: DEMO_RESTAURANT_ID, name: 'Postres', sort_order: 4 },
];

export const demoMenuItems: MenuItem[] = [
  { id: 'm1', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c1', name: 'Guacamole', description: 'Con totopos artesanales', price: 95, is_available: true },
  { id: 'm2', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c1', name: 'Queso fundido', description: 'Con chorizo', price: 120, is_available: true },
  { id: 'm3', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c2', name: 'Tacos al pastor', description: 'Orden de 3', price: 85, is_available: true },
  { id: 'm4', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c2', name: 'Enchiladas suizas', price: 145, is_available: true },
  { id: 'm5', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c2', name: 'Arrachera', description: 'Con guarnición', price: 280, is_available: true },
  { id: 'm6', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c3', name: 'Agua fresca', price: 45, is_available: true },
  { id: 'm7', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c3', name: 'Cerveza artesanal', price: 75, is_available: true },
  { id: 'm8', restaurant_id: DEMO_RESTAURANT_ID, category_id: 'c4', name: 'Flan napolitano', price: 65, is_available: true },
];

export const demoOrders: Order[] = [
  {
    id: 'o1',
    restaurant_id: DEMO_RESTAURANT_ID,
    table_id: 't2',
    waiter_id: 'w1',
    status: 'sent_to_kitchen',
    subtotal: 325,
    tax: 52,
    tip: 0,
    total: 377,
    kitchen_sent_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    items: [
      { id: 'oi1', order_id: 'o1', menu_item_id: 'm1', name: 'Guacamole', quantity: 1, unit_price: 95, kitchen_status: 'pending' },
      { id: 'oi2', order_id: 'o1', menu_item_id: 'm3', name: 'Tacos al pastor', quantity: 2, unit_price: 85, kitchen_status: 'pending', notes: 'Sin cebolla' },
      { id: 'oi3', order_id: 'o1', menu_item_id: 'm6', name: 'Agua fresca', quantity: 2, unit_price: 45, kitchen_status: 'ready', ready_at: new Date().toISOString() },
    ],
    created_at: new Date().toISOString(),
  },
  {
    id: 'o2',
    restaurant_id: DEMO_RESTAURANT_ID,
    table_id: 't3',
    waiter_id: 'w2',
    status: 'ready',
    subtotal: 425,
    tax: 68,
    tip: 0,
    total: 493,
    kitchen_sent_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    items: [
      { id: 'oi4', order_id: 'o2', menu_item_id: 'm5', name: 'Arrachera', quantity: 1, unit_price: 280, kitchen_status: 'ready' },
      { id: 'oi5', order_id: 'o2', menu_item_id: 'm7', name: 'Cerveza artesanal', quantity: 2, unit_price: 75, kitchen_status: 'ready' },
    ],
    created_at: new Date().toISOString(),
  },
];

export const demoUsers: AppUser[] = [
  {
    id: 'u1',
    restaurant_id: DEMO_RESTAURANT_ID,
    full_name: 'Luis Hernández',
    email: 'admin@gastrogo.app',
    role: 'owner',
    is_active: true,
    created_at: '2025-01-15T10:00:00Z',
  },
  {
    id: 'u2',
    restaurant_id: DEMO_RESTAURANT_ID,
    full_name: 'Ana García',
    email: 'ana@gastrogo.app',
    role: 'waiter',
    is_active: true,
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'u3',
    restaurant_id: DEMO_RESTAURANT_ID,
    full_name: 'Carlos Ruiz',
    email: 'carlos@gastrogo.app',
    role: 'waiter',
    is_active: true,
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'u4',
    restaurant_id: DEMO_RESTAURANT_ID,
    full_name: 'Patricia Morales',
    email: 'patricia@gastrogo.app',
    role: 'cashier',
    is_active: false,
    created_at: '2025-03-10T10:00:00Z',
  },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

export function formatOrderTime(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatOrderTimeFull(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
