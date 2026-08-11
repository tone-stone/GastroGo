import { create } from 'zustand';

import { getErrorMessage } from '@/lib/api/errors';
import { demoState } from '@/lib/data/demo-state';
import { getUsersRepository } from '@/lib/repositories';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { AppUser, UserRole } from '@/types';

interface AdminState {
  users: AppUser[];
  isLoading: boolean;
  createUser: (data: {
    restaurant_id: string;
    full_name: string;
    email: string;
    role: UserRole;
  }) => Promise<AppUser>;
  updateUser: (id: string, data: Partial<Pick<AppUser, 'full_name' | 'email' | 'role' | 'is_active'>>) => Promise<void>;
  toggleUserActive: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: (restaurantId: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: demoState.users,
  isLoading: false,

  loadUsers: async (restaurantId) => {
    set({ isLoading: true });
    try {
      const users = await getUsersRepository().list({ restaurantId });
      set({ users });
      if (!isSupabaseConfigured) demoState.users = users;
    } catch (error) {
      console.warn('[GastroGo] Error al cargar usuarios:', getErrorMessage(error));
    } finally {
      set({ isLoading: false });
    }
  },

  createUser: async (data) => {
    const user = await getUsersRepository().create(data);
    set((state) => ({ users: [...state.users, user] }));
    return user;
  },

  updateUser: async (id, data) => {
    const updated = await getUsersRepository().update(id, data);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? updated : u)),
    }));
  },

  toggleUserActive: async (id) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return;
    await get().updateUser(id, { is_active: !user.is_active });
  },

  deleteUser: async (id) => {
    await getUsersRepository().remove(id);
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },
}));
