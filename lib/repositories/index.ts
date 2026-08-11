import { requireSupabase } from '@/lib/api/client';
import { fromSupabaseError } from '@/lib/api/errors';
import { mapAppUser, mapCategory, mapMenuItem, mapOrderWithItems, mapStaff, mapTable } from '@/lib/api/mappers';
import type { CrudRepository, RestaurantScope } from '@/lib/api/types';
import { demoState } from '@/lib/data/demo-state';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { DbProfile } from '@/types/database';
import type { AppUser, MenuCategory, MenuItem, StaffMember, Table, UserRole } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export type CreateTableInput = {
  restaurant_id: string;
  number: number;
  name: string;
  capacity: number;
  zone?: string;
  is_counter?: boolean;
};

export type UpdateTableInput = Partial<
  Pick<Table, 'number' | 'name' | 'capacity' | 'zone' | 'status' | 'assigned_waiter_id'>
>;

const demoTablesRepo: CrudRepository<Table, CreateTableInput, UpdateTableInput> = {
  async list({ restaurantId }) {
    return demoState.tables.filter((t) => t.restaurant_id === restaurantId);
  },
  async getById(id) {
    return demoState.tables.find((t) => t.id === id) ?? null;
  },
  async create(input) {
    const table: Table = {
      id: generateId('t'),
      restaurant_id: input.restaurant_id,
      number: input.number,
      name: input.name,
      capacity: input.capacity,
      status: 'free',
      zone: input.zone,
    };
    demoState.tables.push(table);
    return table;
  },
  async update(id, input) {
    const idx = demoState.tables.findIndex((t) => t.id === id);
    if (idx < 0) throw new Error('Mesa no encontrada');
    demoState.tables[idx] = { ...demoState.tables[idx], ...input };
    return demoState.tables[idx];
  },
  async remove(id) {
    demoState.tables = demoState.tables.filter((t) => t.id !== id);
  },
};

const supabaseTablesRepo: CrudRepository<Table, CreateTableInput, UpdateTableInput> = {
  async list({ restaurantId }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('number');
    if (error) throw fromSupabaseError(error);
    return (data ?? []).map(mapTable);
  },
  async getById(id) {
    const client = requireSupabase();
    const { data, error } = await client.from('tables').select('*').eq('id', id).maybeSingle();
    if (error) throw fromSupabaseError(error);
    return data ? mapTable(data) : null;
  },
  async create(input) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('tables')
      .insert({
        restaurant_id: input.restaurant_id,
        number: input.number,
        name: input.name,
        capacity: input.capacity,
        zone: input.zone ?? null,
        is_counter: input.is_counter ?? false,
        status: 'free',
      })
      .select('*')
      .single();
    if (error) throw fromSupabaseError(error);
    return mapTable(data);
  },
  async update(id, input) {
    const client = requireSupabase();
    const { data, error } = await client.from('tables').update(input).eq('id', id).select('*').single();
    if (error) throw fromSupabaseError(error);
    return mapTable(data);
  },
  async remove(id) {
    const client = requireSupabase();
    const { error } = await client.from('tables').delete().eq('id', id);
    if (error) throw fromSupabaseError(error);
  },
};

export function getTablesRepository() {
  return isSupabaseConfigured ? supabaseTablesRepo : demoTablesRepo;
}

// ─── Menu categories ──────────────────────────────────────────────────────────

export type CreateCategoryInput = {
  restaurant_id: string;
  name: string;
  sort_order?: number;
};

export type UpdateCategoryInput = Partial<Pick<MenuCategory, 'name' | 'sort_order'>>;

const demoCategoriesRepo: CrudRepository<MenuCategory, CreateCategoryInput, UpdateCategoryInput> = {
  async list({ restaurantId }) {
    return demoState.categories.filter((c) => c.restaurant_id === restaurantId);
  },
  async getById(id) {
    return demoState.categories.find((c) => c.id === id) ?? null;
  },
  async create(input) {
    const category: MenuCategory = {
      id: generateId('c'),
      restaurant_id: input.restaurant_id,
      name: input.name,
      sort_order: input.sort_order ?? demoState.categories.length + 1,
    };
    demoState.categories.push(category);
    return category;
  },
  async update(id, input) {
    const idx = demoState.categories.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Categoría no encontrada');
    demoState.categories[idx] = { ...demoState.categories[idx], ...input };
    return demoState.categories[idx];
  },
  async remove(id) {
    demoState.categories = demoState.categories.filter((c) => c.id !== id);
    demoState.menuItems = demoState.menuItems.filter((m) => m.category_id !== id);
  },
};

const supabaseCategoriesRepo: CrudRepository<MenuCategory, CreateCategoryInput, UpdateCategoryInput> = {
  async list({ restaurantId }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order');
    if (error) throw fromSupabaseError(error);
    return (data ?? []).map(mapCategory);
  },
  async getById(id) {
    const client = requireSupabase();
    const { data, error } = await client.from('menu_categories').select('*').eq('id', id).maybeSingle();
    if (error) throw fromSupabaseError(error);
    return data ? mapCategory(data) : null;
  },
  async create(input) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('menu_categories')
      .insert({
        restaurant_id: input.restaurant_id,
        name: input.name,
        sort_order: input.sort_order ?? 0,
      })
      .select('*')
      .single();
    if (error) throw fromSupabaseError(error);
    return mapCategory(data);
  },
  async update(id, input) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('menu_categories')
      .update(input)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw fromSupabaseError(error);
    return mapCategory(data);
  },
  async remove(id) {
    const client = requireSupabase();
    const { error } = await client.from('menu_categories').delete().eq('id', id);
    if (error) throw fromSupabaseError(error);
  },
};

export function getMenuCategoriesRepository() {
  return isSupabaseConfigured ? supabaseCategoriesRepo : demoCategoriesRepo;
}

// ─── Menu items ───────────────────────────────────────────────────────────────

export type CreateMenuItemInput = Omit<MenuItem, 'id'>;
export type UpdateMenuItemInput = Partial<
  Pick<MenuItem, 'name' | 'description' | 'price' | 'category_id' | 'is_available'>
>;

const demoMenuItemsRepo: CrudRepository<MenuItem, CreateMenuItemInput, UpdateMenuItemInput> = {
  async list({ restaurantId }) {
    return demoState.menuItems.filter((m) => m.restaurant_id === restaurantId);
  },
  async getById(id) {
    return demoState.menuItems.find((m) => m.id === id) ?? null;
  },
  async create(input) {
    const item: MenuItem = { id: generateId('m'), ...input };
    demoState.menuItems.push(item);
    return item;
  },
  async update(id, input) {
    const idx = demoState.menuItems.findIndex((m) => m.id === id);
    if (idx < 0) throw new Error('Platillo no encontrado');
    demoState.menuItems[idx] = { ...demoState.menuItems[idx], ...input };
    return demoState.menuItems[idx];
  },
  async remove(id) {
    demoState.menuItems = demoState.menuItems.filter((m) => m.id !== id);
  },
};

const supabaseMenuItemsRepo: CrudRepository<MenuItem, CreateMenuItemInput, UpdateMenuItemInput> = {
  async list({ restaurantId }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name');
    if (error) throw fromSupabaseError(error);
    return (data ?? []).map(mapMenuItem);
  },
  async getById(id) {
    const client = requireSupabase();
    const { data, error } = await client.from('menu_items').select('*').eq('id', id).maybeSingle();
    if (error) throw fromSupabaseError(error);
    return data ? mapMenuItem(data) : null;
  },
  async create(input) {
    const client = requireSupabase();
    const { data, error } = await client.from('menu_items').insert(input).select('*').single();
    if (error) throw fromSupabaseError(error);
    return mapMenuItem(data);
  },
  async update(id, input) {
    const client = requireSupabase();
    const { data, error } = await client.from('menu_items').update(input).eq('id', id).select('*').single();
    if (error) throw fromSupabaseError(error);
    return mapMenuItem(data);
  },
  async remove(id) {
    const client = requireSupabase();
    const { error } = await client.from('menu_items').delete().eq('id', id);
    if (error) throw fromSupabaseError(error);
  },
};

export function getMenuItemsRepository() {
  return isSupabaseConfigured ? supabaseMenuItemsRepo : demoMenuItemsRepo;
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export type CreateStaffInput = Omit<StaffMember, 'id'>;
export type UpdateStaffInput = Partial<Pick<StaffMember, 'name' | 'role' | 'color'>>;

const demoStaffRepo: CrudRepository<StaffMember, CreateStaffInput, UpdateStaffInput> = {
  async list({ restaurantId }) {
    return demoState.staff.filter((s) => s.restaurant_id === restaurantId);
  },
  async getById(id) {
    return demoState.staff.find((s) => s.id === id) ?? null;
  },
  async create(input) {
    const member: StaffMember = { id: generateId('w'), ...input };
    demoState.staff.push(member);
    return member;
  },
  async update(id, input) {
    const idx = demoState.staff.findIndex((s) => s.id === id);
    if (idx < 0) throw new Error('Mesero no encontrado');
    demoState.staff[idx] = { ...demoState.staff[idx], ...input };
    return demoState.staff[idx];
  },
  async remove(id) {
    demoState.staff = demoState.staff.filter((s) => s.id !== id);
  },
};

const supabaseStaffRepo: CrudRepository<StaffMember, CreateStaffInput, UpdateStaffInput> = {
  async list({ restaurantId }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('staff_members')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('name');
    if (error) throw fromSupabaseError(error);
    return (data ?? []).map(mapStaff);
  },
  async getById(id) {
    const client = requireSupabase();
    const { data, error } = await client.from('staff_members').select('*').eq('id', id).maybeSingle();
    if (error) throw fromSupabaseError(error);
    return data ? mapStaff(data) : null;
  },
  async create(input) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('staff_members')
      .insert({ ...input, is_active: true })
      .select('*')
      .single();
    if (error) throw fromSupabaseError(error);
    return mapStaff(data);
  },
  async update(id, input) {
    const client = requireSupabase();
    const { data, error } = await client.from('staff_members').update(input).eq('id', id).select('*').single();
    if (error) throw fromSupabaseError(error);
    return mapStaff(data);
  },
  async remove(id) {
    const client = requireSupabase();
    const { error } = await client.from('staff_members').update({ is_active: false }).eq('id', id);
    if (error) throw fromSupabaseError(error);
  },
};

export function getStaffRepository() {
  return isSupabaseConfigured ? supabaseStaffRepo : demoStaffRepo;
}

// ─── Users (profiles + restaurant_members) ──────────────────────────────────────

export type CreateUserInput = {
  restaurant_id: string;
  full_name: string;
  email: string;
  role: UserRole;
};

export type UpdateUserInput = Partial<Pick<AppUser, 'full_name' | 'email' | 'role' | 'is_active'>>;

export interface UsersRepository {
  list(scope: RestaurantScope): Promise<AppUser[]>;
  getById(id: string): Promise<AppUser | null>;
  create(input: CreateUserInput): Promise<AppUser>;
  update(id: string, input: UpdateUserInput): Promise<AppUser>;
  remove(id: string): Promise<void>;
}

const demoUsersRepo: UsersRepository = {
  async list({ restaurantId }) {
    return demoState.users.filter((u) => u.restaurant_id === restaurantId);
  },
  async getById(id) {
    return demoState.users.find((u) => u.id === id) ?? null;
  },
  async create(input) {
    const user: AppUser = {
      id: generateId('u'),
      ...input,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    demoState.users.push(user);
    return user;
  },
  async update(id, input) {
    const idx = demoState.users.findIndex((u) => u.id === id);
    if (idx < 0) throw new Error('Usuario no encontrado');
    demoState.users[idx] = { ...demoState.users[idx], ...input };
    return demoState.users[idx];
  },
  async remove(id) {
    demoState.users = demoState.users.filter((u) => u.id !== id);
  },
};

const supabaseUsersRepo: UsersRepository = {
  async list({ restaurantId }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('restaurant_members')
      .select('restaurant_id, role, user_id, profiles(id, full_name, email, is_active, created_at)')
      .eq('restaurant_id', restaurantId);
    if (error) throw fromSupabaseError(error);
    return (data ?? []).flatMap((row) => {
      const profile = row.profiles as DbProfile | DbProfile[] | null;
      const p = Array.isArray(profile) ? profile[0] : profile;
      if (!p) return [];
      return [
        mapAppUser(p, {
          restaurant_id: row.restaurant_id,
          user_id: row.user_id,
          role: row.role,
        }),
      ];
    });
  },
  async getById(id) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('restaurant_members')
      .select('restaurant_id, role, user_id, profiles(id, full_name, email, is_active, created_at)')
      .eq('user_id', id)
      .maybeSingle();
    if (error) throw fromSupabaseError(error);
    if (!data?.profiles) return null;
    const profile = data.profiles as DbProfile | DbProfile[];
    const p = Array.isArray(profile) ? profile[0] : profile;
    if (!p) return null;
    return mapAppUser(p, {
      restaurant_id: data.restaurant_id,
      user_id: data.user_id,
      role: data.role,
    });
  },
  async create(input) {
    throw new Error(
      'Crear usuarios requiere invitación por auth. Usa el panel de Supabase o una Edge Function.',
    );
  },
  async update(id, input) {
    const client = requireSupabase();
    const profileUpdate: Record<string, unknown> = {};
    if (input.full_name !== undefined) profileUpdate.full_name = input.full_name;
    if (input.email !== undefined) profileUpdate.email = input.email;
    if (input.is_active !== undefined) profileUpdate.is_active = input.is_active;

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await client.from('profiles').update(profileUpdate).eq('id', id);
      if (error) throw fromSupabaseError(error);
    }
    if (input.role !== undefined) {
      const { error } = await client.from('restaurant_members').update({ role: input.role }).eq('user_id', id);
      if (error) throw fromSupabaseError(error);
    }
    const user = await supabaseUsersRepo.getById(id);
    if (!user) throw new Error('Usuario no encontrado');
    return user;
  },
  async remove(id) {
    await supabaseUsersRepo.update(id, { is_active: false });
  },
};

export function getUsersRepository(): UsersRepository {
  return isSupabaseConfigured ? supabaseUsersRepo : demoUsersRepo;
}

// ─── Orders (CRUD + ítems anidados) ───────────────────────────────────────────

export interface OrdersRepository {
  list(scope: RestaurantScope): Promise<import('@/types').Order[]>;
  getById(id: string): Promise<import('@/types').Order | null>;
  upsert(order: import('@/types').Order): Promise<void>;
  remove(id: string): Promise<void>;
}

const demoOrdersRepo: OrdersRepository = {
  async list({ restaurantId }) {
    return demoState.orders.filter((o) => o.restaurant_id === restaurantId);
  },
  async getById(id) {
    return demoState.orders.find((o) => o.id === id) ?? null;
  },
  async upsert(order) {
    const idx = demoState.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) demoState.orders[idx] = order;
    else demoState.orders.push(order);
  },
  async remove(id) {
    demoState.orders = demoState.orders.filter((o) => o.id !== id);
  },
};

const supabaseOrdersRepo: OrdersRepository = {
  async list({ restaurantId }) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('orders')
      .select('*, order_items(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (error) throw fromSupabaseError(error);
    return (data ?? []).map(mapOrderWithItems);
  },
  async getById(id) {
    const client = requireSupabase();
    const { data, error } = await client
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw fromSupabaseError(error);
    return data ? mapOrderWithItems(data) : null;
  },
  async upsert(order) {
    const client = requireSupabase();
    const { items, ...header } = order;
    const orderRow = {
      id: header.id,
      restaurant_id: header.restaurant_id,
      table_id: header.table_id,
      waiter_id: header.waiter_id ?? null,
      status: header.status,
      subtotal: header.subtotal,
      tax: header.tax,
      tip: header.tip,
      total: header.total,
      payment_method: header.payment_method ?? null,
      kitchen_sent_at: header.kitchen_sent_at ?? null,
      closed_at: header.closed_at ?? null,
    };

    const { error: orderError } = await client.from('orders').upsert(orderRow);
    if (orderError) throw fromSupabaseError(orderError);

    const { error: deleteError } = await client.from('order_items').delete().eq('order_id', order.id);
    if (deleteError) throw fromSupabaseError(deleteError);

    if (items.length > 0) {
      const rows = items.map((item) => ({
        id: item.id,
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes ?? null,
        kitchen_status: item.kitchen_status ?? null,
        ready_at: item.ready_at ?? null,
      }));
      const { error: itemsError } = await client.from('order_items').insert(rows);
      if (itemsError) throw fromSupabaseError(itemsError);
    }
  },
  async remove(id) {
    const client = requireSupabase();
    const { error } = await client.from('orders').delete().eq('id', id);
    if (error) throw fromSupabaseError(error);
  },
};

export function getOrdersRepository(): OrdersRepository {
  return isSupabaseConfigured ? supabaseOrdersRepo : demoOrdersRepo;
}
