import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  DEMO_RESTAURANT_ID,
  DEMO_USER_ID,
  demoRestaurants,
  demoStaff,
} from '@/lib/demo-data';
import type { LoginMode } from '@/constants/auth';
import type { Profile, Restaurant, Session, UserRole } from '@/types';

interface SessionState extends Session {
  isLoading: boolean;
  isDemo: boolean;
  loginMode: LoginMode | null;
  signIn: (email: string, password: string, mode: LoginMode) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  setActiveRestaurant: (restaurantId: string) => void;
}

const demoProfile: Profile = {
  id: DEMO_USER_ID,
  full_name: 'Ana García',
  email: 'demo@gastrogo.app',
};

function resolveDemoSession(email: string, mode: LoginMode) {
  if (mode === 'admin') {
    return {
      full_name: 'Luis Hernández',
      role: 'owner' as UserRole,
      staffMemberId: 'w4',
    };
  }

  if (mode === 'kitchen') {
    return {
      full_name: 'Chef Roberto',
      role: 'kitchen' as UserRole,
      staffMemberId: null,
    };
  }

  const lower = email.toLowerCase();
  const fullName = email.split('@')[0];
  const displayName =
    lower.includes('ana') || lower === 'demo@gastrogo.app'
      ? 'Ana García'
      : fullName.charAt(0).toUpperCase() + fullName.slice(1);

  if (mode === 'sale') {
    return {
      full_name: displayName,
      role: 'cashier' as UserRole,
      staffMemberId: null,
    };
  }

  if (lower.includes('carlos')) {
    return { full_name: 'Carlos Ruiz', role: 'waiter' as UserRole, staffMemberId: 'w2' };
  }

  if (lower.includes('maria')) {
    return { full_name: 'María López', role: 'waiter' as UserRole, staffMemberId: 'w3' };
  }

  return {
    full_name: displayName,
    role: 'waiter' as UserRole,
    staffMemberId: resolveStaffIdForUser(displayName, email),
  };
}

function resolveStaffIdForUser(fullName: string, email: string): string {
  const firstName = fullName.split(' ')[0]?.toLowerCase() ?? '';
  const emailPrefix = email.split('@')[0]?.toLowerCase() ?? '';
  const match = demoStaff.find(
    (s) =>
      s.name.toLowerCase().includes(firstName) ||
      s.name.toLowerCase().includes(emailPrefix) ||
      emailPrefix.includes(s.name.split(' ')[0]?.toLowerCase() ?? ''),
  );
  return match?.id ?? demoStaff[0].id;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  restaurants: [],
  activeRestaurantId: null,
  role: 'waiter',
  staffMemberId: null,
  loginMode: null,
  isLoading: true,
  isDemo: !isSupabaseConfigured,

  setActiveRestaurant: (restaurantId) => set({ activeRestaurantId: restaurantId }),

  initialize: async () => {
    if (!isSupabaseConfigured || !supabase) {
      set({
        isLoading: false,
        isDemo: true,
        user: null,
        restaurants: [],
        activeRestaurantId: null,
        role: 'waiter',
        staffMemberId: null,
        loginMode: null,
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      set({
        isLoading: false,
        user: null,
        restaurants: [],
        activeRestaurantId: null,
        role: 'waiter',
        staffMemberId: null,
        loginMode: null,
      });
      return;
    }

    const profile: Profile = {
      id: session.user.id,
      full_name: session.user.user_metadata.full_name ?? session.user.email ?? 'Usuario',
      email: session.user.email ?? '',
    };

    const { data: memberships } = await supabase
      .from('restaurant_members')
      .select('role, restaurants(*)')
      .eq('user_id', session.user.id);

    const restaurants: Restaurant[] = (memberships ?? [])
      .map((m) => (m.restaurants as Restaurant | Restaurant[] | null))
      .flatMap((r) => (Array.isArray(r) ? r : r ? [r] : []));

    const role = (memberships?.[0]?.role as UserRole) ?? 'waiter';

    set({
      user: profile,
      restaurants,
      activeRestaurantId: restaurants[0]?.id ?? null,
      role,
      staffMemberId: resolveStaffIdForUser(profile.full_name, profile.email),
      isLoading: false,
      isDemo: false,
    });
  },

  signIn: async (email, password, mode) => {
    if (!isSupabaseConfigured || !supabase) {
      const demo = resolveDemoSession(email, mode);
      set({
        user: { ...demoProfile, email, full_name: demo.full_name },
        restaurants: demoRestaurants,
        activeRestaurantId: DEMO_RESTAURANT_ID,
        role: demo.role,
        staffMemberId: demo.staffMemberId,
        loginMode: mode,
        isDemo: true,
      });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ loginMode: mode });
    await get().initialize();
  },

  signOut: async () => {
    if (supabase) await supabase.auth.signOut();
    set({
      user: null,
      restaurants: [],
      activeRestaurantId: null,
      role: 'waiter',
      staffMemberId: null,
      loginMode: null,
      isDemo: !isSupabaseConfigured,
    });
  },
}));
