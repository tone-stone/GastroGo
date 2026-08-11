import { create } from 'zustand';

import { demoUsers } from '@/lib/demo-data';
import type { AppUser, UserRole } from '@/types';

interface AdminState {
  users: AppUser[];
  createUser: (data: {
    restaurant_id: string;
    full_name: string;
    email: string;
    role: UserRole;
  }) => AppUser;
  updateUser: (id: string, data: Partial<Pick<AppUser, 'full_name' | 'email' | 'role'>>) => void;
  toggleUserActive: (id: string) => void;
  deleteUser: (id: string) => void;
  loadUsers: (restaurantId: string) => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: demoUsers,

  loadUsers: (_restaurantId) => {
    set({ users: demoUsers });
  },

  createUser: (data) => {
    const user: AppUser = {
      id: generateId('u'),
      ...data,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ users: [...state.users, user] }));
    return user;
  },

  updateUser: (id, data) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    }));
  },

  toggleUserActive: (id) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u)),
    }));
  },

  deleteUser: (id) => {
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },
}));
